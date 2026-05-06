import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

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
  if (tier === "guest")  return "permanent";
  if (tier === "member") return weekStart();
  return today(); // paid plans reset daily in DB (monthly billing handled by Paddle)
}

// ── FingerprintJS visitorId format ─────────────────────────────────────────
const FINGERPRINT_RE = /^[a-zA-Z0-9_-]{16,64}$/;

// ── resolveQuotaKey ────────────────────────────────────────────────────────
export async function resolveQuotaKey(req: NextRequest): Promise<{
  key: string;
  tier: Tier;
  userId: string | null;
  permanentCredits: number;
}> {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
    const meta  = (user?.publicMetadata ?? {}) as Record<string, unknown>;
    const metaTier = meta.tier as Tier | undefined;
    const role     = meta.role as string | undefined;
    const permanentCredits = Number(meta.permanentCredits ?? 0);

    let tier: Tier = "member";
    if (VIP_EMAILS.has(email) || metaTier === "vip" || role === "vip" || role === "admin") {
      tier = "vip";
    } else if (metaTier === "starter" || metaTier === "pro" || metaTier === "studio") {
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

// ── Supabase quota record helpers ──────────────────────────────────────────

async function getRecord(key: string, tier: Tier): Promise<{ opsUsed: number; isFresh: boolean }> {
  const periodStart = getPeriodStart(tier);
  const db = getServiceSupabase();

  const { data, error } = await db
    .from("quotas")
    .select("ops_used, period_start")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("[Quota] getRecord error:", error.message);
    // Fail open — let the request through rather than block on DB error
    return { opsUsed: 0, isFresh: true };
  }

  // No row yet, or period rolled over → treat as fresh
  if (!data || data.period_start !== periodStart) {
    return { opsUsed: 0, isFresh: true };
  }

  return { opsUsed: data.ops_used, isFresh: false };
}

async function upsertRecord(key: string, tier: Tier, opsUsed: number): Promise<void> {
  const periodStart = getPeriodStart(tier);
  const db = getServiceSupabase();

  const { error } = await db.from("quotas").upsert(
    { key, ops_used: opsUsed, period_start: periodStart, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[Quota] upsertRecord error:", error.message);
  }
}

// ── Public quota helpers ───────────────────────────────────────────────────

export async function checkQuota(key: string, tier: Tier, cost: number = 1): Promise<boolean> {
  const { opsUsed } = await getRecord(key, tier);
  return opsUsed + cost <= TIER_LIMITS[tier];
}

export async function consumeQuota(key: string, tier: Tier, cost: number = 1): Promise<void> {
  const { opsUsed, isFresh } = await getRecord(key, tier);
  const next = isFresh ? cost : opsUsed + cost;
  await upsertRecord(key, tier, next);
}

// ── Permanent credits (pay-as-you-go fallback) ─────────────────────────────
export async function consumePermanentCredit(userId: string, cost: number = 1): Promise<boolean> {
  const client = await clerkClient();
  const user   = await client.users.getUser(userId);
  const meta   = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const current = Number(meta.permanentCredits ?? 0);

  if (current < cost) return false;

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...meta, permanentCredits: current - cost },
  });

  console.log(`[Quota] Consumed ${cost} permanent credit(s) for user ${userId} (${current} → ${current - cost})`);
  return true;
}
