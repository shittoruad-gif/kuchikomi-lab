import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { stripe } from "./stripe";
import { ENV } from "./_core/env";
import * as db from "./db";
import { STRIPE_PRODUCTS } from "./products";
import type { PlanType } from "@shared/const";

function getPlanFromPriceId(priceId: string): PlanType | null {
  for (const [plan, product] of Object.entries(STRIPE_PRODUCTS)) {
    if (product.priceId === priceId) return plan as PlanType;
  }
  return null;
}

export function registerWebhookRoutes(app: Express) {
  // IMPORTANT: raw body parser must be registered before json parser
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Test event detection
      if (event.id.startsWith("evt_test_")) {
        res.json({ verified: true });
        return;
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0");
            const plan = (session.metadata?.plan ?? "light") as PlanType;

            if (!userId) {
              console.error("[Webhook] Missing user_id in metadata");
              break;
            }

            const subscriptionId = session.subscription as string;
            const sub = await stripe.subscriptions.retrieve(subscriptionId);

            await db.upsertSubscription({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: sub.items.data[0]?.price.id ?? "",
              plan,
              status: "active",
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            });

            await db.createPaymentRecord({
              userId,
              stripePaymentIntentId: session.payment_intent as string,
              amount: session.amount_total ?? 0,
              plan,
              status: "succeeded",
              description: `${plan}プラン 初回決済`,
              paidAt: new Date(),
            });

            console.log(`[Webhook] Checkout completed for user ${userId}, plan: ${plan}`);
            break;
          }

          case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            const subscriptionId = invoice.subscription as string;
            if (!subscriptionId) break;

            const existingSub = await db.getSubscriptionByStripeId(subscriptionId);
            if (existingSub) {
              await db.createPaymentRecord({
                userId: existingSub.userId,
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_paid,
                plan: existingSub.plan as PlanType,
                status: "succeeded",
                description: `${existingSub.plan}プラン 更新決済`,
                paidAt: new Date(),
              });
            }
            break;
          }

          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const priceId = sub.items.data[0]?.price.id;
            const plan = priceId ? getPlanFromPriceId(priceId) : null;

            const existingSub = await db.getSubscriptionByStripeId(sub.id);
            if (existingSub) {
              await db.upsertSubscription({
                userId: existingSub.userId,
                stripeCustomerId: sub.customer as string,
                stripeSubscriptionId: sub.id,
                stripePriceId: priceId ?? "",
                plan: plan ?? (existingSub.plan as PlanType),
                status: sub.status as any,
                currentPeriodStart: new Date(sub.current_period_start * 1000),
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              });
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            await db.updateSubscriptionStatus(sub.id, "canceled");
            console.log(`[Webhook] Subscription canceled: ${sub.id}`);
            break;
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error("[Webhook] Processing error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    },
  );
}
