/**
 * Paddle Webhook Handler
 * POST /api/webhooks/paddle
 *
 * Handles post-payment events from Paddle and updates Clerk publicMetadata
 * as the single source of truth for subscription state.
 *
 * Events handled:
 *   subscription.created    → activate plan immediately (no prior plan)
 *   subscription.activated  → same as above (Paddle fires this after trial/payment)
 *   subscription.canceled   → activate pending plan if queued; else downgrade to member
 *   transaction.completed   → add permanentCredits for credits_50 one-time purchases
 *
 * Setup checklist (fill in before going live):
 *   1. Set PADDLE_WEBHOOK_SECRET in .env.local
 *   2. Set PADDLE_PRICE_ID_STARTER, _PRO, _STUDIO, _CREDITS_50 in .env.local
 *   3. In Paddle dashboard → Notifications → add this endpoint URL
 */

import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { PLANS, CREDITS_PER_PACK, PlanId } from "@/lib/subscription";

// ── Paddle Price ID → internal PlanId mapping ──────────────────────────────
// Fill these with your real Paddle Price IDs once you have them.
const PRICE_TO_PLAN: Record<string, PlanId> = {
  [process.env.PADDLE_PRICE_ID_STARTER ?? "__starter__"]: "starter_monthly",
  [process.env.PADDLE_PRICE_ID_PRO     ?? "__pro__"    ]: "pro_monthly",
  [process.env.PADDLE_PRICE_ID_STUDIO  ?? "__studio__" ]: "studio_monthly",
};

const CREDITS_PRICE_ID = process.env.PADDLE_PRICE_ID_CREDITS_50 ?? "__credits_50__";

// ── Signature verification ─────────────────────────────────────────────────
async function verifyPaddleSignature(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    // In development without a secret, skip verification (never do this in prod)
    console.warn("[Paddle Webhook] PADDLE_WEBHOOK_SECRET not set — skipping verification");
    return process.env.NODE_ENV !== "production";
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) return false;

  // Paddle signature format: "ts=<timestamp>;h1=<hmac>"
  const parts = Object.fromEntries(signature.split(";").map((p) => p.split("=")));
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}:${body}`)
  );
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === h1;
}

// ── Clerk metadata helpers ─────────────────────────────────────────────────
async function getClerkUser(clerkUserId: string) {
  const client = await clerkClient();
  return client.users.getUser(clerkUserId);
}

async function updateClerkMeta(clerkUserId: string, patch: Record<string, unknown>) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      ...user.publicMetadata,
      ...patch,
    },
  });
}

// ── Event handlers ─────────────────────────────────────────────────────────

/**
 * subscription.created / subscription.activated
 * Resolves the purchased price → planId, then:
 *   - If user has NO active plan: activate immediately.
 *   - If user HAS an active plan: queue as pendingPlanId (activates on expiry).
 */
async function handleSubscriptionActivated(data: Record<string, unknown>) {
  const customData = data.custom_data as Record<string, unknown> | undefined;
  const clerkUserId = customData?.clerk_user_id as string | undefined;
  if (!clerkUserId) {
    console.error("[Paddle Webhook] subscription.activated: missing clerk_user_id in custom_data");
    return;
  }

  const items = data.items as Array<{ price: { id: string } }> | undefined;
  const priceId = items?.[0]?.price?.id;
  const planId = priceId ? PRICE_TO_PLAN[priceId] : undefined;
  if (!planId) {
    console.error("[Paddle Webhook] subscription.activated: unknown priceId", priceId);
    return;
  }

  const scheduledChangeAt = data.scheduled_change
    ? (data.scheduled_change as { effective_at: string }).effective_at
    : null;

  // Billing period — Paddle provides next_billed_at for the renewal date
  const nextBilledAt = data.next_billed_at as string | undefined;
  const planExpiresAt = nextBilledAt ? new Date(nextBilledAt).getTime() : null;

  const user = await getClerkUser(clerkUserId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const existingExpiry = meta.planExpiresAt as number | null;
  const hasActivePlan = existingExpiry !== null && existingExpiry > Date.now();

  if (hasActivePlan) {
    // Queue the new plan — activates when current plan expires
    console.log(`[Paddle Webhook] Queuing plan ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      pendingPlanId: planId,
    });
  } else {
    // No active plan — activate immediately
    const plan = PLANS[planId];
    console.log(`[Paddle Webhook] Activating plan ${planId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      tier: plan.tier,
      planId,
      planExpiresAt,
      pendingPlanId: null,
    });
  }
}

/**
 * subscription.canceled
 * Current plan expired/canceled.
 *   - If there's a pendingPlanId: activate it now.
 *   - Otherwise: downgrade to member tier.
 */
async function handleSubscriptionCanceled(data: Record<string, unknown>) {
  const customData = data.custom_data as Record<string, unknown> | undefined;
  const clerkUserId = customData?.clerk_user_id as string | undefined;
  if (!clerkUserId) return;

  const user = await getClerkUser(clerkUserId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const pendingPlanId = meta.pendingPlanId as PlanId | null;

  if (pendingPlanId && PLANS[pendingPlanId]) {
    // Activate the queued plan
    const plan = PLANS[pendingPlanId];
    // For a real integration you'd fetch the new subscription's next_billed_at here.
    // Using 30 days from now as a safe approximation until the activation webhook fires.
    const planExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    console.log(`[Paddle Webhook] Activating pending plan ${pendingPlanId} for user ${clerkUserId}`);
    await updateClerkMeta(clerkUserId, {
      tier: plan.tier,
      planId: pendingPlanId,
      planExpiresAt,
      pendingPlanId: null,
    });
  } else {
    // No pending plan — downgrade to free member
    console.log(`[Paddle Webhook] Downgrading user ${clerkUserId} to member`);
    await updateClerkMeta(clerkUserId, {
      tier: "member",
      planId: null,
      planExpiresAt: null,
      pendingPlanId: null,
    });
  }
}

/**
 * transaction.completed (one-time purchase: credits pack)
 * Immediately increments permanentCredits in Clerk metadata.
 */
async function handleTransactionCompleted(data: Record<string, unknown>) {
  const customData = data.custom_data as Record<string, unknown> | undefined;
  const clerkUserId = customData?.clerk_user_id as string | undefined;
  if (!clerkUserId) return;

  const items = data.items as Array<{ price: { id: string } }> | undefined;
  const priceId = items?.[0]?.price?.id;
  if (priceId !== CREDITS_PRICE_ID) return; // not a credits purchase

  const user = await getClerkUser(clerkUserId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const current = Number(meta.permanentCredits ?? 0);
  const updated = current + CREDITS_PER_PACK;

  console.log(
    `[Paddle Webhook] Adding ${CREDITS_PER_PACK} permanent credits for user ${clerkUserId} (${current} → ${updated})`
  );
  await updateClerkMeta(clerkUserId, { permanentCredits: updated });
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const valid = await verifyPaddleSignature(req, body);
  if (!valid) {
    console.error("[Paddle Webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event_type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, data } = event;
  console.log(`[Paddle Webhook] Received: ${event_type}`);

  try {
    switch (event_type) {
      case "subscription.created":
      case "subscription.activated":
        await handleSubscriptionActivated(data);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(data);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(data);
        break;
      default:
        // Acknowledge but do nothing for unhandled events
        break;
    }
  } catch (err) {
    console.error(`[Paddle Webhook] Error processing ${event_type}:`, err);
    // Return 200 anyway to prevent Paddle retrying (we log the error internally)
    return NextResponse.json({ received: true, error: String(err) }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
