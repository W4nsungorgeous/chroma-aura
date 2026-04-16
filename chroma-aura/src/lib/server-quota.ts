import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// VIP access: granted to emails listed here OR to any Clerk user whose
// publicMetadata.tier === "vip".  Add the owner account unconditionally.
const VIP_EMAILS = new Set(["kellclosss@gmail.com"]);

type Tier = "guest" | "member" | "starter" | "pro" | "studio" | "vip";

const TIER_LIMITS: Record<Tier, { generation: number; drawing: number }> = {
  guest:  { generation: 2,    drawing: 0    }, // lifetime teaser — no reset
  member: { generation: 3,   drawing: 2    }, // resets weekly
  starter: { generation: 60, drawing: 20 },
  pro: { generation: 200, drawing: 80 },
  studio: { generation: 600, drawing: 200 },
  vip:    { generation: 9999, drawing: 9999 },
};

interface QuotaRecord {
  generationUsed: number;
  drawingUsed: number;
  periodStart: string; // "YYYY-MM-DD" — daily for guest, weekly (Mon) for member
}

// In-memory store: resets on server restart.
// TODO: replace with Supabase `quotas` table for production persistence.
const store = new Map<string, QuotaRecord>();

/** Returns today's date as "YYYY-MM-DD" (UTC). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the ISO date of Monday of the current UTC week ("YYYY-MM-DD"). */
function weekStart(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + daysToMonday);
  return monday.toISOString().slice(0, 10);
}

/** Returns the expected period-start string for the given tier. */
function getPeriodStart(tier: Tier): string {
  if (tier === "guest") return "permanent";
  if (tier === "member") return weekStart();
  return today(); // paid plans reset info should be from db eventually; fallback to daily today for simplicity until billing works
}

function getRecord(key: string, tier: Tier): QuotaRecord {
  const periodStart = getPeriodStart(tier);
  const rec = store.get(key);
  if (!rec || rec.periodStart !== periodStart) {
    const fresh: QuotaRecord = { generationUsed: 0, drawingUsed: 0, periodStart };
    store.set(key, fresh);
    return fresh;
  }
  return rec;
}

// FingerprintJS visitorId is a 20-32 char hex/alphanumeric string.
const FINGERPRINT_RE = /^[a-zA-Z0-9_-]{16,64}$/;

export async function resolveQuotaKey(req: NextRequest): Promise<{ key: string; tier: Tier }> {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
    const metaTier = user?.publicMetadata?.tier as Tier | undefined;
    const role = user?.publicMetadata?.role as string | undefined;

    let tier: Tier = "member";
    if (VIP_EMAILS.has(email) || metaTier === "vip" || role === "vip" || role === "admin") {
      tier = "vip";
    } else if (role === "starter" || role === "pro" || role === "studio") {
      tier = role as Tier;
    }

    return { key: `user_${userId}`, tier };
  }

  // Guest: prefer FingerprintJS visitorId sent by the client, fall back to IP.
  const raw = req.headers.get("x-device-id")?.trim() ?? "";
  if (FINGERPRINT_RE.test(raw)) {
    return { key: `fp_${raw}`, tier: "guest" };
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  return { key: `ip_${ip}`, tier: "guest" };
}

export function checkGenerationQuota(key: string, tier: Tier): boolean {
  return getRecord(key, tier).generationUsed < TIER_LIMITS[tier].generation;
}

export function consumeGenerationQuota(key: string, tier: Tier): void {
  getRecord(key, tier).generationUsed += 1;
}

export function checkDrawingQuota(key: string, tier: Tier): boolean {
  return getRecord(key, tier).drawingUsed < TIER_LIMITS[tier].drawing;
}

export function consumeDrawingQuota(key: string, tier: Tier): void {
  getRecord(key, tier).drawingUsed += 1;
}
