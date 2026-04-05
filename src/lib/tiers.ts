/**
 * Subscription tiers for Permit Tracer.
 *
 * Limits are enforced server-side in the API routes.
 */

export interface Tier {
  id: string;
  name: string;
  price: number;          // monthly USD, 0 = free
  permitLimit: number;    // max permits visible (0 = unlimited)
  skipTraceLimit: number; // skip traces per month
  features: string[];
  cta: string;
  popular?: boolean;
}

export const ADMIN_TIER: Tier = {
  id: "admin",
  name: "Admin",
  price: 0,
  permitLimit: 0,
  skipTraceLimit: 99999,
  features: ["Unlimited everything", "All states", "Admin panel access"],
  cta: "Admin",
};

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    permitLimit: 100,
    skipTraceLimit: 10,
    features: [
      "100 permit records",
      "10 skip traces / month",
      "1 state",
      "Basic filters",
      "CSV export (100 rows)",
    ],
    cta: "Current Plan",
  },
  {
    id: "basic",
    name: "Basic",
    price: 49,
    permitLimit: 1000,
    skipTraceLimit: 100,
    features: [
      "1,000 permit records",
      "100 skip traces / month",
      "3 states",
      "All filters + search",
      "CSV export (1,000 rows)",
      "Priority data refresh",
    ],
    cta: "Upgrade to Basic",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    permitLimit: 0, // unlimited
    skipTraceLimit: 1000,
    features: [
      "Unlimited permit records",
      "1,000 skip traces / month",
      "All states",
      "All filters + search",
      "Unlimited CSV export",
      "Priority data refresh",
      "API access (coming soon)",
      "Webhook alerts (coming soon)",
    ],
    cta: "Upgrade to Pro",
  },
];

export const TIER_MAP: Record<string, Tier> = {
  ...Object.fromEntries(TIERS.map((t) => [t.id, t])),
  admin: ADMIN_TIER,
};

/** Get the user's effective tier, default to free */
export function getUserTier(profile: any): Tier {
  const tierId = profile?.tier || "free";
  return TIER_MAP[tierId] || TIERS[0];
}

/** Check if user has hit their permit limit */
export function isAtPermitLimit(tier: Tier, currentCount: number): boolean {
  if (tier.permitLimit === 0) return false; // unlimited
  return currentCount >= tier.permitLimit;
}

/** Check if user has hit their skip trace limit */
export function isAtSkipTraceLimit(tier: Tier, usedThisMonth: number): boolean {
  return usedThisMonth >= tier.skipTraceLimit;
}

/** Max states allowed per tier */
export function maxStates(tier: Tier): number {
  if (tier.id === "admin") return 9;
  if (tier.id === "free") return 1;
  if (tier.id === "basic") return 3;
  return 9; // pro = all
}
