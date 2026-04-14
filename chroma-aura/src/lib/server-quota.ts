import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

type Tier = "guest" | "member" | "vip";

const TIER_LIMITS: Record<Tier, { generation: number; drawing: number }> = {
  guest:  { generation: 3,    drawing: 50   },
  member: { generation: 20,   drawing: 500  },
  vip:    { generation: 9999, drawing: 9999 },
};

interface QuotaRecord {
  generationUsed: number;
  drawingUsed: number;
  date: string; // "YYYY-MM-DD" — resets daily
}

// In-memory store: resets on server restart.
// TODO: replace with Supabase `quotas` table for production persistence.
const store = new Map<string, QuotaRecord>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRecord(key: string): QuotaRecord {
  const d = today();
  const rec = store.get(key);
  if (!rec || rec.date !== d) {
    const fresh: QuotaRecord = { generationUsed: 0, drawingUsed: 0, date: d };
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
    // VIP promotion happens client-side via Clerk metadata; server defaults to member.
    // For full server-side VIP, wire up currentUser() + Supabase roles.
    return { key: `user_${userId}`, tier: "member" };
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
  return getRecord(key).generationUsed < TIER_LIMITS[tier].generation;
}

export function consumeGenerationQuota(key: string): void {
  getRecord(key).generationUsed += 1;
}

export function checkDrawingQuota(key: string, tier: Tier): boolean {
  return getRecord(key).drawingUsed < TIER_LIMITS[tier].drawing;
}

export function consumeDrawingQuota(key: string): void {
  getRecord(key).drawingUsed += 1;
}
