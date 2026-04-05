/**
 * POST /api/webhook/stripe
 * Handles: checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, { apiVersion: "2025-03-31.basil" as any });

// Map Stripe price amounts to tier IDs
function tierFromAmount(amount: number): string {
  if (amount >= 14000) return "pro";    // $149
  if (amount >= 4000) return "basic";   // $49
  return "free";
}

async function updateUserTier(userId: string, tierId: string) {
  const admin = createAdminClient();
  await admin.from("profiles").update({ tier: tierId }).eq("id", userId);
  console.log(`[stripe-webhook] Updated user ${userId} to tier ${tierId}`);
}

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).single();
  return data?.id || null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
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
    event = JSON.parse(body) as Stripe.Event;
  }

  switch (event.type) {
    // New subscription created via checkout
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tierId = session.metadata?.tier_id;

      if (userId && tierId) {
        await updateUserTier(userId, tierId);

        // Save Stripe customer ID
        if (session.customer) {
          const admin = createAdminClient();
          await admin.from("profiles").update({ stripe_customer_id: String(session.customer) }).eq("id", userId);
        }
      }
      break;
    }

    // Subscription updated (upgrade/downgrade)
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      const userId = await findUserByCustomerId(customerId);

      if (userId) {
        if (sub.status === "active" || sub.status === "trialing") {
          const amount = (sub.items?.data?.[0]?.price?.unit_amount) || 0;
          const tier = tierFromAmount(amount);
          await updateUserTier(userId, tier);
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          await updateUserTier(userId, "free");
        }
      }
      break;
    }

    // Subscription cancelled
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      const userId = await findUserByCustomerId(customerId);

      if (userId) {
        await updateUserTier(userId, "free");
        console.log(`[stripe-webhook] Subscription cancelled for user ${userId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
