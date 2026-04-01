import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  users,
  subscriptions,
  reviewGenerations,
  customQuestions,
  paymentHistory,
} from "../drizzle/schema";
import type { PlanType } from "@shared/const";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    if (!ENV.databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }
    const pool = mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool);
  }
  return _db;
}

export { getDb };
const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

// ============ Users ============

export async function getUserByOpenId(openId: string) {
  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function upsertUser(data: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  passwordHash?: string | null;
  lastSignedIn?: Date;
}) {
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await db
      .update(users)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.loginMethod !== undefined && { loginMethod: data.loginMethod }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.lastSignedIn && { lastSignedIn: data.lastSignedIn }),
      })
      .where(eq(users.openId, data.openId));
    return getUserByOpenId(data.openId);
  }
  await db.insert(users).values({
    openId: data.openId,
    name: data.name ?? null,
    email: data.email ?? null,
    passwordHash: data.passwordHash ?? null,
    loginMethod: data.loginMethod ?? null,
    lastSignedIn: data.lastSignedIn ?? new Date(),
  });
  return getUserByOpenId(data.openId);
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ============ Subscriptions ============

export async function getActiveSubscription(userId: number) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);
  return sub ?? null;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return sub ?? null;
}

export async function upsertSubscription(data: {
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: PlanType;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const existing = await getSubscriptionByStripeId(data.stripeSubscriptionId);
  if (existing) {
    await db
      .update(subscriptions)
      .set({
        plan: data.plan,
        status: data.status,
        stripePriceId: data.stripePriceId,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      })
      .where(eq(subscriptions.stripeSubscriptionId, data.stripeSubscriptionId));
    return getSubscriptionByStripeId(data.stripeSubscriptionId);
  }
  await db.insert(subscriptions).values(data);
  return getSubscriptionByStripeId(data.stripeSubscriptionId);
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete",
) {
  await db
    .update(subscriptions)
    .set({ status })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getSubscriptionStats() {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));
  const MONTHLY_REVENUE = { light: 980, standard: 1980, premium: 4980 };
  const stats = { light: 0, standard: 0, premium: 0, totalRevenue: 0 };
  for (const sub of allSubs) {
    const plan = sub.plan as "light" | "standard" | "premium";
    if (plan in stats) stats[plan]++;
    stats.totalRevenue += MONTHLY_REVENUE[plan] ?? 0;
  }
  return stats;
}

// ============ Review Generations ============

export async function createReviewGeneration(data: {
  userId: number;
  plan: PlanType;
  industry?: string;
  purpose?: string;
  tone?: string;
  questionsData?: string;
  answersData?: string;
  generatedReview: string;
}) {
  const result = await db.insert(reviewGenerations).values(data);
  return result;
}

export async function getReviewHistory(userId: number, limit = 20) {
  return db
    .select()
    .from(reviewGenerations)
    .where(eq(reviewGenerations.userId, userId))
    .orderBy(desc(reviewGenerations.createdAt))
    .limit(limit);
}

export async function getMonthlyGenerationCount(userId: number): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewGenerations)
    .where(
      and(
        eq(reviewGenerations.userId, userId),
        sql`${reviewGenerations.createdAt} >= ${startOfMonth}`,
      ),
    );
  return Number(row?.count ?? 0);
}

// ============ Custom Questions ============

export async function getCustomQuestions(userId: number) {
  return db
    .select()
    .from(customQuestions)
    .where(and(eq(customQuestions.userId, userId), eq(customQuestions.isActive, 1)))
    .orderBy(customQuestions.orderIndex);
}

export async function createCustomQuestion(userId: number, questionText: string) {
  const existing = await getCustomQuestions(userId);
  const orderIndex = existing.length;
  await db.insert(customQuestions).values({ userId, questionText, orderIndex });
}

export async function updateCustomQuestion(id: number, userId: number, questionText: string) {
  await db
    .update(customQuestions)
    .set({ questionText })
    .where(and(eq(customQuestions.id, id), eq(customQuestions.userId, userId)));
}

export async function deleteCustomQuestion(id: number, userId: number) {
  await db
    .update(customQuestions)
    .set({ isActive: 0 })
    .where(and(eq(customQuestions.id, id), eq(customQuestions.userId, userId)));
}

export async function reorderCustomQuestions(userId: number, questionIds: number[]) {
  for (let i = 0; i < questionIds.length; i++) {
    await db
      .update(customQuestions)
      .set({ orderIndex: i })
      .where(and(eq(customQuestions.id, questionIds[i]), eq(customQuestions.userId, userId)));
  }
}

// ============ Payment History ============

export async function createPaymentRecord(data: {
  userId: number;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency?: string;
  plan: PlanType;
  status: "succeeded" | "pending" | "failed";
  description?: string;
  paidAt?: Date;
}) {
  await db.insert(paymentHistory).values({
    ...data,
    currency: data.currency ?? "jpy",
    paidAt: data.paidAt ?? new Date(),
  });
}

export async function getPaymentHistory(userId: number) {
  return db
    .select()
    .from(paymentHistory)
    .where(eq(paymentHistory.userId, userId))
    .orderBy(desc(paymentHistory.createdAt));
}

export async function getPaymentById(id: number, userId: number) {
  const [payment] = await db
    .select()
    .from(paymentHistory)
    .where(and(eq(paymentHistory.id, id), eq(paymentHistory.userId, userId)))
    .limit(1);
  return payment ?? null;
}
