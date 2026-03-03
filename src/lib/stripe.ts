import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "sk_test_...") {
      throw new Error("STRIPE_SECRET_KEY is not configured in .env.local");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Returns true if Stripe is configured with real keys (not placeholder). */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== "sk_test_...";
}
