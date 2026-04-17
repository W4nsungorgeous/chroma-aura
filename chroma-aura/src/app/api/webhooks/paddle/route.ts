/**
 * Paddle Webhook Handler
 * POST /api/webhooks/paddle
 *
 * Uses the official @paddle/paddle-node-sdk for signature verification
 * (paddle.webhooks.unmarshal) instead of a manual HMAC implementation.
 *
 * Events handled:
 *   subscription.created    → activate plan
 *   subscription.activated  → activate plan (Paddle fires after first payment clears)
 *   subscription.updated    → detect scheduled plan change or immediate plan swap
 *   subscription.canceled   → activate pending plan if queued; else downgrade to member
 *   transaction.completed   → add permanentCredits for credits_50 one-time purchases
 *
 * Setup checklist (fill in before going live):
 *   PADDLE_API_KEY                  — Paddle server-side secret key
 *   PADDLE_NOTIFICATION_WEBHOOK_SECRET — Webhook signing secret from Paddle dashboard
 *   NEXT_PUBLIC_PADDLE_ENV          — "sandbox" | "production"
 *   PADDLE_PRICE_ID_STARTER         — Paddle Price ID for starter_monthly
 *   PADDLE_PRICE_ID_PRO             — Paddle Price ID for pro_monthly
 *   PADDLE_PRICE_ID_STUDIO          — Paddle Price ID for studio_monthly
 *   PADDLE_PRICE_ID_CREDITS_50      — Paddle Price ID for credits_50 one-time product
 */

import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import type {
  SubscriptionCreatedEvent,
  SubscriptionActivatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk";
import { clerkClient } from "@clerk/nextjs/server";
import { getPaddleInstance } from "@/lib/paddle";
import { PLANS, CREDITS_PER_DOLLAR } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";

// ── Paddle Price ID → internal PlanId ─────────────────────────────────────
const PRICE_TO_PLAN: Record<string, PlanId> = {
  [process.env.PADDLE_PRICE_ID_STARTER ?? "__starter__"]: "starter_monthly",
  [process.env.PADDLE_PRICE_ID_PRO     ?? "__pro__"    ]: "pro_monthly",
  [process.env.PADDLE_PRICE_ID_STUDIO  ?? "__studio__" ]: "studio_monthly",
};

const CREDITS_PRICE_ID = process.env.PADDLE_PRICE_ID_CREDITS_50 ?? "__credits_50__";

// ── Clerk helpers ──────────────────────────────────────────────────────────
async function getClerkMeta(clerkUserId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  return (user.publicMetadata ?? {}) as Record<string, unknown>;
}

async function updateClerkMeta(clerkUserId: string, patch: Record<string, unknown>) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...user.publicMetadata, ...patch },
  });
}

function extractClerkUserId(customData: Record<string, unknown> | null | undefined): string | null {
  return (customData?.clerk_user_id as string) || null;
}

// ── Event handlers ─────────────────────────────────────────────────────────

/**
 * subscription.created / subscription.activated
 *
 * Paddle fires subscription.created when a new subscription is first created
 * and subscription.activated once the first payment clears.
 * We handle both identically: activate or queue the plan.
 */
async function handleSubscriptionActivated(
  event: SubscriptionCreatedEvent | SubscriptionActivatedEvent
) {
  const clerkUserId = extractClerkUserId(event.data.customData);
  if (!clerkUserId) {
    console.error(`[Paddle] ${event.eventType}: missing clerk_user_id in customData`);
    return;
  }

  const priceId = event.data.items?.[0]?.price?.id;
  const planId = priceId ? PRICE_TO_PLAN[priceId] : undefined;
  if (!planId) {
    console.error(`[Paddle] ${event.eventType}: unknown priceId "${priceId}"`);
    return;
  }

  const nextBilledAt = event.data.nextBilledAt;
  const planExpiresAt = nextBilledAt ? new Date(nextBilledAt).getTime() : null;

  const meta = await getClerkMeta(clerkUserId);
  const existingExpiry = meta.planExpiresAt as number | null;
  const hasActivePlan = existingExpiry !== null && existingExpiry > Date.now();

  if (hasActivePlan) {
    console.log(`[Paddle] Queuing plan ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, { pendingPlanId: planId });
  } else {
    const plan = PLANS[planId];
    console.log(`[Paddle] Activating plan ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      tier: plan.tier,
      planId,
      planExpiresAt,
      pendingPlanId: null,
    });
  }
}

/**
 * subscription.updated
 *
 * Fires whenever a subscription changes: plan swap, renewal date update,
 * scheduled cancellation, or a scheduled plan change being applied.
 *
 * - scheduledChange present → queue pendingPlanId (change takes effect at renewal)
 * - scheduledChange absent  → apply the current items as the active plan now
 *   (covers same-period plan swaps and renewals with a new price)
 */
async function handleSubscriptionUpdated(event: SubscriptionUpdatedEvent) {
  const clerkUserId = extractClerkUserId(event.data.customData);
  if (!clerkUserId) {
    console.error("[Paddle] subscription.updated: missing clerk_user_id in customData");
    return;
  }

  const priceId = event.data.items?.[0]?.price?.id;
  const planId = priceId ? PRICE_TO_PLAN[priceId] : undefined;

  const scheduled = event.data.scheduledChange;

  if (scheduled && scheduled.action === "cancel") {
    // Cancellation is scheduled; plan remains active until effectiveAt.
    // The subscription.canceled event will handle the actual downgrade.
    console.log(
      `[Paddle] Subscription cancellation scheduled at ${scheduled.effectiveAt} for user ${clerkUserId}`
    );
    return;
  }

  if (scheduled && planId) {
    // A plan change is scheduled to take effect at renewal (e.g., upgrade at period end).
    // Store as pendingPlanId — will be activated when subscription.updated fires again
    // without a scheduledChange (meaning the change has taken effect).
    console.log(`[Paddle] Queuing plan change to ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, { pendingPlanId: planId });
    return;
  }

  if (planId) {
    // No scheduledChange — the plan swap took effect now (immediate upgrade or renewal).
    const plan = PLANS[planId];
    const nextBilledAt = event.data.nextBilledAt;
    const planExpiresAt = nextBilledAt ? new Date(nextBilledAt).getTime() : null;

    console.log(`[Paddle] Applying plan update: ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      tier: plan.tier,
      planId,
      planExpiresAt,
      pendingPlanId: null, // Clear any previously queued plan
    });
  }
}

/**
 * subscription.canceled
 *
 * Fires when the subscription actually ends (after the billing period).
 * - If there is a pendingPlanId: activate it now.
 * - Otherwise: downgrade to free member.
 */
async function handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
  const clerkUserId = extractClerkUserId(event.data.customData);
  if (!clerkUserId) return;

  const meta = await getClerkMeta(clerkUserId);
  const pendingPlanId = meta.pendingPlanId as PlanId | null;

  if (pendingPlanId && PLANS[pendingPlanId]) {
    const plan = PLANS[pendingPlanId];
    // The activation webhook (subscription.created/activated for the new sub) will
    // set the exact planExpiresAt. Use 30 days as a safe fallback until that fires.
    const planExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    console.log(`[Paddle] Activating pending plan ${pendingPlanId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      tier: plan.tier,
      planId: pendingPlanId,
      planExpiresAt,
      pendingPlanId: null,
    });
  } else {
    console.log(`[Paddle] Downgrading user ${clerkUserId} to member`);
    await updateClerkMeta(clerkUserId, {
      tier: "member",
      planId: null,
      planExpiresAt: null,
      pendingPlanId: null,
    });
  }
}

/**
 * transaction.completed — one-time credits purchase
 *
 * Fires for every completed transaction, including subscription renewals.
 * We only act when the price matches the credits pack price ID.
 */
async function handleTransactionCompleted(event: TransactionCompletedEvent) {
  const priceId = event.data.items?.[0]?.price?.id;
  if (priceId !== CREDITS_PRICE_ID) return; // Not a credits purchase — ignore

  const clerkUserId = extractClerkUserId(event.data.customData);
  if (!clerkUserId) {
    console.error("[Paddle] transaction.completed (credits): missing clerk_user_id in customData");
    return;
  }

  // quantity = dollar amount the user paid (e.g. 10 → $10 → 500 credits)
  const quantity = event.data.items?.[0]?.quantity ?? 1;
  const creditsToAdd = quantity * CREDITS_PER_DOLLAR;

  const meta = await getClerkMeta(clerkUserId);
  const current = Number(meta.permanentCredits ?? 0);
  const updated = current + creditsToAdd;

  console.log(
    `[Paddle] Adding ${creditsToAdd} permanent credits for user ${clerkUserId} ($${quantity} × ${CREDITS_PER_DOLLAR} = ${creditsToAdd}; ${current} → ${updated})`
  );
  await updateClerkMeta(clerkUserId, { permanentCredits: updated });
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const signature = req.headers.get("paddle-signature") ?? "";
  const webhookSecret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? "";

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  if (!signature || !rawBody) {
    return NextResponse.json({ error: "Missing signature or body" }, { status: 400 });
  }

  // ── Signature verification via official SDK ────────────────────────────
  // paddle.webhooks.unmarshal() handles timestamp+HMAC verification and
  // returns a fully typed EventEntity, replacing our manual crypto implementation.
  const paddle = getPaddleInstance();
  let eventData: Awaited<ReturnType<typeof paddle.webhooks.unmarshal>>;
  try {
    eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch (e) {
    console.error("[Paddle Webhook] Signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!eventData) {
    return NextResponse.json({ error: "Empty event" }, { status: 400 });
  }

  console.log(`[Paddle Webhook] Received: ${eventData.eventType}`);

  try {
    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionActivated(eventData as SubscriptionCreatedEvent);
        break;
      case EventName.SubscriptionActivated:
        await handleSubscriptionActivated(eventData as SubscriptionActivatedEvent);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(eventData as SubscriptionUpdatedEvent);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(eventData as SubscriptionCanceledEvent);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(eventData as TransactionCompletedEvent);
        break;
      default:
        // Acknowledge unhandled events silently
        break;
    }
  } catch (err) {
    console.error(`[Paddle Webhook] Error processing ${eventData.eventType}:`, err);
    // Return 200 to prevent Paddle retrying — we have logging; fix and replay if needed
    return NextResponse.json({ received: true, error: String(err) });
  }

  return NextResponse.json({ received: true, eventType: eventData.eventType });
}
