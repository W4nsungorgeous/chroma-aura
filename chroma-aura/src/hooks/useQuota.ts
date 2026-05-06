import { useState, useEffect, useMemo } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useUser } from "@clerk/nextjs";

export type UserTier = "guest" | "member" | "starter" | "pro" | "studio" | "vip";

/** Must match server-side TIER_LIMITS in server-quota.ts */
const TIER_LIMITS: Record<UserTier, number> = {
  guest:   2,
  member:  5,
  starter: 80,
  pro:     280,
  studio:  700,
  vip:     9999,
};

/** Timestamp (ms) of next Monday 00:00 UTC. */
function nextMondayMs(): number {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.getTime();
}

export function useQuota() {
  const { user, isLoaded } = useUser();
  const [opsUsed, setOpsUsed] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Resolve tier from Clerk metadata (mirrors server-quota.ts logic)
  const tier = useMemo<UserTier>(() => {
    if (!isLoaded || !user) return "guest";
    const email   = user.primaryEmailAddress?.emailAddress ?? "";
    const meta    = user.publicMetadata as Record<string, unknown>;
    const metaTier = meta.tier as string | undefined;
    const role    = meta.role as string | undefined;

    if (email === "kellclosss@gmail.com" || metaTier === "vip" || role === "vip" || role === "admin") return "vip";
    if (metaTier === "starter") return "starter";
    if (metaTier === "pro")     return "pro";
    if (metaTier === "studio")  return "studio";
    return "member";
  }, [user, isLoaded]);

  const limit = TIER_LIMITS[tier];

  // Load initial ops from localStorage
  useEffect(() => {
    const init = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
      try {
        const stored = localStorage.getItem(`quota_${result.visitorId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setOpsUsed(parsed.ops?.used ?? parsed.generation?.used ?? 0);
        }
      } catch {
        // private browsing or corrupt — start from zero
      }
    };
    init();
  }, []);

  // Weekly reset for member tier
  useEffect(() => {
    if (!deviceId || !isLoaded || tier !== "member") return;
    try {
      const stored = localStorage.getItem(`quota_${deviceId}`);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.resetAt && Date.now() > parsed.resetAt) {
        setOpsUsed(0);
        localStorage.setItem(`quota_${deviceId}`, JSON.stringify({
          ops: { used: 0, limit },
          resetAt: nextMondayMs(),
        }));
      }
    } catch { /* ignore */ }
  }, [deviceId, isLoaded, tier]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (used: number) => {
    if (!deviceId) return;
    try {
      let resetAt: number | undefined;
      if (tier === "member") {
        const stored = localStorage.getItem(`quota_${deviceId}`);
        const existing = stored ? JSON.parse(stored) : null;
        resetAt = existing?.resetAt && existing.resetAt > Date.now()
          ? existing.resetAt
          : nextMondayMs();
      }
      localStorage.setItem(`quota_${deviceId}`, JSON.stringify({
        ops: { used, limit },
        ...(resetAt !== undefined ? { resetAt } : {}),
      }));
    } catch { /* localStorage full or unavailable */ }
  };

  /** Decrement ops from the client-side pool (UI optimistic update). Returns false if exhausted. */
  const decrementOps = (cost: number = 1) => {
    if (opsUsed + cost <= limit) {
      const next = opsUsed + cost;
      setOpsUsed(next);
      persist(next);
      return true;
    }
    return false;
  };

  const remaining = Math.max(0, limit - opsUsed);

  return {
    tier,
    deviceId,
    /** Unified ops quota (lineart + auto-color share this pool, mirrors server-quota.ts) */
    opsQuota: { used: opsUsed, limit, remaining },
    /** @deprecated Use opsQuota — kept for backward-compat with UserMenu credit bar */
    generationQuota: { used: opsUsed, limit, remaining },
    expiresAt: (user?.publicMetadata?.planExpiresAt as number) || null,
    decrementOps,
    /** @deprecated Use decrementOps */
    decrementGeneration: decrementOps,
    /** @deprecated Use decrementOps */
    decrementDrawing: decrementOps,
    isLimitReached: opsUsed >= limit,
  };
}
