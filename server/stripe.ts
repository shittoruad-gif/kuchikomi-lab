import Stripe from "stripe";
import { ENV } from "./_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2024-11-20.acacia" as any,
    });
  }
  return _stripe;
}

// Proxy for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

export async function getOrCreateCustomer(email: string, userId: number) {
  const s = getStripe();
  const customers = await s.customers.list({ email, limit: 1 });
  if (customers.data.length > 0) {
    return customers.data[0];
  }
  return s.customers.create({
    email,
    metadata: { userId: String(userId) },
  });
}
