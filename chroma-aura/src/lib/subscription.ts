/**
 * Subscription data model for Chroma Aura.
 *
 * Source of truth: Clerk user.publicMetadata (server-authoritative).
 * The webhook handler (/api/webhooks/paddle) writes these fields after
 * each Paddle event. Client reads them via useUser() / currentUser().
 *
 * publicMetadata schema:
 * {
 *   tier:              "member" | "starter" | "pro" | "studio" | "vip"
 *   planId:            PlanId | null
 *   planExpiresAt:     number (unix ms) | null
 *   pendingPlanId:     PlanId | null   ← queued; activates when current plan expires
 *   permanentCredits:  number          ← pay-as-you-go pool, never expires
 * }
 */

export type PlanId = "starter_monthly" | "pro_monthly" | "studio_monthly";
export type ProductId = PlanId | "credits_50";

export interface PlanMeta {
  id: PlanId;
  name: string;
  tier: "starter" | "pro" | "studio";
  /** Monthly allocation */
  generation: number;
  drawing: number;
  price: string;
}

export const PLANS: Record<PlanId, PlanMeta> = {
  starter_monthly: {
    id: "starter_monthly",
    name: "Starter",
    tier: "starter",
    generation: 60,
    drawing: 20,
    price: "$4.99",
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro",
    tier: "pro",
    generation: 200,
    drawing: 80,
    price: "$12.99",
  },
  studio_monthly: {
    id: "studio_monthly",
    name: "Studio",
    tier: "studio",
    generation: 500,
    drawing: 200,
    price: "$29.99",
  },
};

/**
 * Credits awarded per $1 spent.
 * Paddle unit price = $1, quantity = dollar amount paid.
 * Rate: 1 credit = $0.05  →  $1 = 20 credits.
 */
export const CREDITS_PER_DOLLAR = 20;

/** Minimum purchase amount in dollars. */
export const CREDITS_MIN_DOLLARS = 3;

/** Maximum purchase amount in dollars. */
export const CREDITS_MAX_DOLLARS = 100;

/** Step size for slider / input (dollars). */
export const CREDITS_STEP = 1;

/** Quick-select preset amounts shown as buttons (dollars). */
export const CREDITS_PRESETS = [10, 20, 50, 100];

export interface UserSubscription {
  /** Currently active plan, or null if on free tier. */
  planId: PlanId | null;
  /** Unix ms when current plan expires. null = no active plan. */
  planExpiresAt: number | null;
  /** Plan queued to activate when current plan expires. */
  pendingPlanId: PlanId | null;
  /** Pay-as-you-go credits — never expire, separate from plan allocation. */
  permanentCredits: number;
  /** Computed: plan is paid and not yet expired. */
  isActivePlan: boolean;
}

/** Parse a Clerk user's publicMetadata into a typed UserSubscription. */
export function parseSubscription(
  meta: Record<string, unknown>
): UserSubscription {
  const planId = (meta.planId as PlanId) || null;
  const planExpiresAt = (meta.planExpiresAt as number) || null;
  const pendingPlanId = (meta.pendingPlanId as PlanId) || null;
  const permanentCredits = Number(meta.permanentCredits ?? 0);
  const isActivePlan = planExpiresAt !== null && planExpiresAt > Date.now();

  return { planId, planExpiresAt, pendingPlanId, permanentCredits, isActivePlan };
}
