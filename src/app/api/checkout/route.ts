/**
 * POST /api/checkout
 * Creates a Stripe Checkout session for upgrading tier.
 * Body: { tierId: "basic" | "pro" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { TIER_MAP } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, { apiVersion: "2025-03-31.basil" as any });

// Map tier IDs to Stripe price amounts (in cents)
const TIER_PRICES: Record<string, number> = {
  basic: 4900,   // $49/mo
  pro: 14900,    // $149/mo
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { tierId } = body as { tierId?: string };

  if (!tierId || !TIER_PRICES[tierId]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = TIER_MAP[tierId];
  if (!tier) return NextResponse.json({ error: "Unknown tier" }, { status: 400 });

  try {
    // Reuse existing Stripe customer if we have one
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single();

    const sessionParams: any = {
      mode: "subscription",
      payment_method_types: ["card"],
      ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email ?? undefined }),
      metadata: {
        user_id: user.id,
        tier_id: tierId,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: {
              name: `Permit Tracer ${tier.name}`,
              description: tier.features.slice(0, 3).join(", "),
            },
            unit_amount: TIER_PRICES[tierId],
          },
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/settings?upgraded=${tierId}`,
      cancel_url: `${request.nextUrl.origin}/settings`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[checkout] Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
