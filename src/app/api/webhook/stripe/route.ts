/**
 * POST /api/webhook/stripe
 * Stripe webhook handler — upgrades user tier on successful checkout.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, { apiVersion: "2025-03-31.basil" as any });

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // If we have a webhook secret, verify the signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // No webhook secret configured — parse the event directly (dev mode)
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const tierId = session.metadata?.tier_id;

    if (userId && tierId) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("profiles")
        .update({ tier: tierId })
        .eq("id", userId);

      if (error) {
        console.error("[stripe-webhook] Failed to update tier:", error.message);
      } else {
        console.log(`[stripe-webhook] Upgraded user ${userId} to ${tierId}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
