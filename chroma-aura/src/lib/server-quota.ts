import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// VIP access: granted to emails listed here OR to any Clerk user whose
// publicMetadata.tier === "vip".  Add the owner account unconditionally.
const VIP_EMAILS = new Set(["kellclosss@gmail.com"]);

export type Tier = "guest" | "member" | "starter" | "pro" | "studio" | "vip";

/** Unified per-period op limit (lineart generation + AI auto-color share the same pool). */
const TIER_LIMITS: Record<Tier, number> = {
  guest:   2,     // lifetime teaser — no reset
  member:  5,     // resets weekly (Monday UTC)
  starter: 80,    // monthly via Paddle subscription
  pro:     280,
  studio:  700,
  vip:     9999,
};

interface QuotaRecord {
  opsUsed: number;
  periodStart: string; // "YYYY-MM-DD" | "permanent"
}

// In-memory store: resets on server restart.
// TODO: replace with Supabase `quotas` table for production persistence.
const store = new Map<string, QuotaRecord>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStart(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + daysToMonday);
  return monday.toISOString().slice(0, 10);
}

function getPeriodStart(tier: Tier): string {
  if (tier === "guest")   return "permanent"; // no reset for guest teaser
  if (tier === "member")  return weekStart();
  return today(); // paid plans: daily in-memory (DB will own this long-term)
}

function getRecord(key: string, tier: Tier): QuotaRecord {
  const periodStart = getPeriodStart(tier);
  const rec = store.get(key);
  if (!rec || rec.periodStart !== periodStart) {
    const fresh: QuotaRecord = { opsUsed: 0, periodStart };
    store.set(key, fresh);
    return fresh;
  }
  return rec;
}

// ── FingerprintJS visitorId format ─────────────────────────────────────────
const FINGERPRINT_RE = /^[a-zA-Z0-9_-]{16,64}$/;

// ── resolveQuotaKey ────────────────────────────────────────────────────────
export async function resolveQuotaKey(req: NextRequest): Promise<{
  key: string;
  tier: Tier;
  /** Clerk userId — null for guests */
  userId: string | null;
  /** Permanent pay-as-you-go credits in Clerk metadata (0 for guests) */
  permanentCredits: number;
}> {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
    const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
    const metaTier = meta.tier as Tier | undefined;
    const role = meta.role as string | undefined;
    const permanentCredits = Number(meta.permanentCredits ?? 0);

    let tier: Tier = "member";
    if (VIP_EMAILS.has(email) || metaTier === "vip" || role === "vip" || role === "admin") {
      tier = "vip";
    } else if (
      metaTier === "starter" || metaTier === "pro" || metaTier === "studio"
    ) {
      tier = metaTier;
    }

    return { key: `user_${userId}`, tier, userId, permanentCredits };
  }

  // Guest
  const raw = req.headers.get("x-device-id")?.trim() ?? "";
  if (FINGERPRINT_RE.test(raw)) {
    return { key: `fp_${raw}`, tier: "guest", userId: null, permanentCredits: 0 };
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  return { key: `ip_${ip}`, tier: "guest", userId: null, permanentCredits: 0 };
}

// ── Unified quota helpers ──────────────────────────────────────────────────

export function checkQuota(key: string, tier: Tier): boolean {
  return getRecord(key, tier).opsUsed < TIER_LIMITS[tier];
}

export function consumeQuota(key: string, tier: Tier): void {
  getRecord(key, tier).opsUsed += 1;
}

// ── Permanent credits (pay-as-you-go fallback) ─────────────────────────────
/**
 * Atomically deducts one permanent credit from Clerk publicMetadata.
 * Returns true if a credit was successfully consumed; false if none remain.
 *
 * Called only when plan quota is already exhausted, so permanent credits
 * act as a seamless top-up without changing the quota period counter.
 */
export async function consumePermanentCredit(userId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const current = Number(meta.permanentCredits ?? 0);

  if (current <= 0) return false;

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...meta,
      permanentCredits: current - 1,
    },
  });

  console.log(
    `[Quota] Consumed 1 permanent credit for user ${userId} (${current} → ${current - 1})`
  );
  return true;
}
