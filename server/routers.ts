import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { PlanType } from "@shared/const";
import * as db from "./db";
import { stripe, getOrCreateCustomer } from "./stripe";
import { STRIPE_PRODUCTS, PLAN_LIMITS } from "./products";
import { generateReceiptPDF } from "./receipt";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { hashPassword, verifyPassword } from "./auth";
import { nanoid } from "nanoid";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: ENV.openaiApiKey });
  }
  return _openai;
}

// ============ Default questions by industry ============
function getDefaultQuestions(industry: string, plan: PlanType): string[] {
  const base = [
    "どのようなサービスを利用しましたか？",
    "スタッフの対応はいかがでしたか？",
    "施設の清潔感や雰囲気はいかがでしたか？",
    "サービスの質に満足していますか？",
    "また利用したいと思いますか？",
  ];

  if (plan === "light") return base.slice(0, 5);

  const extended = [
    ...base,
    "価格に見合った価値を感じましたか？",
    "待ち時間はいかがでしたか？",
    "他の方にもおすすめできますか？",
    "改善してほしい点はありますか？",
    "特に印象に残った点はありますか？",
  ];

  return extended.slice(0, PLAN_LIMITS[plan].maxQuestionsCount);
}

// ============ Auth Router ============
const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "名前を入力してください"),
        email: z.string().email("有効なメールアドレスを入力してください"),
        password: z.string().min(6, "パスワードは6文字以上で入力してください"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このメールアドレスは既に登録されています",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const openId = `email_${nanoid()}`;

      const user = await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email",
        lastSignedIn: new Date(),
        passwordHash,
      });

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ユーザー作成に失敗しました" });
      }

      // Set session cookie
      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("有効なメールアドレスを入力してください"),
        password: z.string().min(1, "パスワードを入力してください"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Set session cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
    return { success: true };
  }),
});

// ============ Subscription Router ============
const subscriptionRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveSubscription(ctx.user.id);
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["light", "standard", "premium"]) }))
    .mutation(async ({ ctx, input }) => {
      const product = STRIPE_PRODUCTS[input.plan];
      const customer = await getOrCreateCustomer(
        ctx.user.email ?? `user-${ctx.user.id}@kuchikomi-lab.local`,
        ctx.user.id,
      );

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [{ price: product.priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${ctx.req.headers.origin}/payment/success`,
        cancel_url: `${ctx.req.headers.origin}/pricing?canceled=true`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          plan: input.plan,
          email: ctx.user.email ?? "",
        },
      });

      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    if (!sub?.stripeCustomerId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "サブスクリプションが見つかりません" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${ctx.req.headers.origin}/dashboard`,
    });

    return { url: portalSession.url };
  }),

  limits: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    if (!sub) return null;
    return PLAN_LIMITS[sub.plan as PlanType];
  }),

  monthlyUsage: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    if (!sub) return null;
    const used = await db.getMonthlyGenerationCount(ctx.user.id);
    const limit = PLAN_LIMITS[sub.plan as PlanType].monthlyGenerationsLimit;
    return { used, limit, remaining: Math.max(0, limit - used) };
  }),
});

// ============ Review Router ============
const reviewRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        industry: z.string(),
        purpose: z.string().optional(),
        tone: z.string().optional(),
        questions: z.array(z.string()),
        answers: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sub = await db.getActiveSubscription(ctx.user.id);
      if (!sub) {
        throw new TRPCError({ code: "FORBIDDEN", message: "有効なサブスクリプションが必要です" });
      }

      const plan = sub.plan as PlanType;
      const limits = PLAN_LIMITS[plan];

      // Plan limit checks
      const monthlyCount = await db.getMonthlyGenerationCount(ctx.user.id);
      if (monthlyCount >= limits.monthlyGenerationsLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `今月の生成上限（${limits.monthlyGenerationsLimit}回）に達しました。プランをアップグレードしてください。`,
        });
      }
      if (input.questions.length > limits.maxQuestionsCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `質問数の上限は${limits.maxQuestionsCount}問です` });
      }
      if (input.purpose && !limits.canSelectPurpose) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "このプランでは目的選択はできません" });
      }
      if (input.tone && !limits.canSelectTone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "このプランではトーン選択はできません" });
      }

      // Build prompt
      let prompt = `あなたはGoogle口コミの作成を手伝うアシスタントです。以下の情報を元に、自然でリアルな口コミ文を日本語で生成してください。\n\n`;
      prompt += `業種: ${input.industry}\n`;
      if (input.purpose) prompt += `口コミの目的: ${input.purpose}\n`;
      if (input.tone) prompt += `文体: ${input.tone}\n`;
      prompt += `\n回答内容:\n`;

      for (let i = 0; i < input.questions.length; i++) {
        prompt += `Q: ${input.questions[i]}\nA: ${input.answers[i] || "回答なし"}\n`;
      }

      if (plan === "premium") {
        prompt += `\n【高度最適化】この口コミは検索エンジンでの表示を意識し、具体的な体験談を含め、読者が参考にしやすい構成にしてください。300文字程度で生成してください。`;
      } else if (plan === "standard") {
        prompt += `\n200文字程度で、自然な口コミを生成してください。`;
      } else {
        prompt += `\n150文字程度で、シンプルな口コミを生成してください。`;
      }

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.8,
      });

      const generatedReview = completion.choices[0]?.message?.content ?? "口コミの生成に失敗しました。";

      await db.createReviewGeneration({
        userId: ctx.user.id,
        plan,
        industry: input.industry,
        purpose: input.purpose,
        tone: input.tone,
        questionsData: JSON.stringify(input.questions),
        answersData: JSON.stringify(input.answers),
        generatedReview,
      });

      return { review: generatedReview };
    }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return db.getReviewHistory(ctx.user.id);
  }),

  generateTrial: publicProcedure
    .input(
      z.object({
        industry: z.string(),
        answers: z.array(z.object({ question: z.string(), answer: z.string() })),
      }),
    )
    .mutation(async ({ input }) => {
      let prompt = `以下の情報を元に、Google口コミ風の短い文章（80文字程度）を日本語で生成してください。自然でリアルな口調にしてください。\n\n`;
      prompt += `業種: ${input.industry}\n\n`;
      for (const qa of input.answers) {
        prompt += `Q: ${qa.question}\nA: ${qa.answer}\n`;
      }

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      });

      return { review: completion.choices[0]?.message?.content ?? "生成に失敗しました。" };
    }),

  getDefaultQuestions: protectedProcedure
    .input(z.object({ industry: z.string() }))
    .query(async ({ ctx, input }) => {
      const sub = await db.getActiveSubscription(ctx.user.id);
      const plan = (sub?.plan ?? "light") as PlanType;
      return getDefaultQuestions(input.industry, plan);
    }),
});

// ============ Custom Questions Router ============
const customQuestionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getActiveSubscription(ctx.user.id);
    if (!sub || sub.plan !== "premium") {
      throw new TRPCError({ code: "FORBIDDEN", message: "PREMIUMプラン限定機能です" });
    }
    return db.getCustomQuestions(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ questionText: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const sub = await db.getActiveSubscription(ctx.user.id);
      if (!sub || sub.plan !== "premium") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PREMIUMプラン限定機能です" });
      }
      const existing = await db.getCustomQuestions(ctx.user.id);
      if (existing.length >= PLAN_LIMITS.premium.maxQuestionsCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "質問数の上限に達しています" });
      }
      await db.createCustomQuestion(ctx.user.id, input.questionText);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), questionText: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateCustomQuestion(input.id, ctx.user.id, input.questionText);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteCustomQuestion(input.id, ctx.user.id);
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.object({ questionIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await db.reorderCustomQuestions(ctx.user.id, input.questionIds);
      return { success: true };
    }),
});

// ============ Payment Router ============
const paymentRouter = router({
  history: protectedProcedure.query(async ({ ctx }) => {
    return db.getPaymentHistory(ctx.user.id);
  }),

  downloadReceipt: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await db.getPaymentById(input.paymentId, ctx.user.id);
      if (!payment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "決済記録が見つかりません" });
      }
      const pdfBuffer = await generateReceiptPDF(payment, ctx.user);
      return { pdf: pdfBuffer.toString("base64"), filename: `receipt-${payment.id}.pdf` };
    }),
});

// ============ Admin Router ============
const adminRouter = router({
  users: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),

  stats: adminProcedure.query(async () => {
    return db.getSubscriptionStats();
  }),

  changePlan: adminProcedure
    .input(z.object({ userId: z.number(), plan: z.enum(["light", "standard", "premium"]) }))
    .mutation(async ({ input }) => {
      const sub = await db.getActiveSubscription(input.userId);
      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND", message: "サブスクリプションが見つかりません" });
      }
      await db.upsertSubscription({
        userId: input.userId,
        stripeCustomerId: sub.stripeCustomerId ?? "",
        stripeSubscriptionId: sub.stripeSubscriptionId ?? "",
        stripePriceId: STRIPE_PRODUCTS[input.plan].priceId,
        plan: input.plan,
        status: "active",
        currentPeriodStart: sub.currentPeriodStart ?? undefined,
        currentPeriodEnd: sub.currentPeriodEnd ?? undefined,
      });
      return { success: true };
    }),
});

// ============ App Router ============
export const appRouter = router({
  auth: authRouter,
  subscription: subscriptionRouter,
  review: reviewRouter,
  customQuestions: customQuestionsRouter,
  payment: paymentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
