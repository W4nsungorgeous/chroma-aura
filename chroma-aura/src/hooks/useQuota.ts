import { useState, useEffect, useMemo } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useUser } from "@clerk/nextjs";

export type UserTier = "guest" | "member" | "vip";

const TIER_LIMITS = {
  guest:  { generation: 2,    drawing: 0    }, // lifetime teaser — no reset
  member: { generation: 3,    drawing: 2    }, // resets weekly (Monday 00:00 UTC)
  vip:    { generation: 9999, drawing: 9999 },
};

/** Timestamp (ms) of next Monday 00:00 UTC. */
function nextMondayMs(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.getTime();
}

export function useQuota() {
  const { user, isLoaded } = useUser();
  const [drawingQuotaUsed, setDrawingQuotaUsed] = useState(0);
  const [generationQuotaUsed, setGenerationQuotaUsed] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // 1. Determine Tier
  const tier = useMemo<UserTier>(() => {
    if (!isLoaded || !user) return "guest";
    const email = user.primaryEmailAddress?.emailAddress;
    const role = user.publicMetadata?.role as string;
    if (email === "kellclosss@gmail.com" || role === "vip" || role === "admin") return "vip";
    return "member";
  }, [user, isLoaded]);

  const limits = TIER_LIMITS[tier];

  // 2. Load initial quota from localStorage on mount
  useEffect(() => {
    const initFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
      try {
        const stored = localStorage.getItem(`quota_${result.visitorId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDrawingQuotaUsed(parsed.drawing?.used || 0);
          setGenerationQuotaUsed(parsed.generation?.used || 0);
        }
      } catch {
        // localStorage unavailable (private browsing) or JSON corrupt — start from zero
      }
    };
    initFingerprint();
  }, []);

  // 3. Weekly reset for member tier — fires once deviceId and tier are both known
  useEffect(() => {
    if (!deviceId || !isLoaded || tier !== "member") return;
    try {
      const stored = localStorage.getItem(`quota_${deviceId}`);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const resetAt: number | undefined = parsed.resetAt;
      if (resetAt && Date.now() > resetAt) {
        // Period has expired — wipe counts and set next weekly boundary
        setDrawingQuotaUsed(0);
        setGenerationQuotaUsed(0);
        localStorage.setItem(`quota_${deviceId}`, JSON.stringify({
          drawing: { used: 0, limit: limits.drawing },
          generation: { used: 0, limit: limits.generation },
          resetAt: nextMondayMs(),
        }));
      }
    } catch {
      // ignore
    }
  }, [deviceId, isLoaded, tier]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveQuota = (drawingUsed: number, generationUsed: number) => {
    if (!deviceId) return;
    try {
      // Member: persist resetAt so the weekly boundary survives page reloads.
      // Keep the existing resetAt if it's still in the future; otherwise stamp a new one.
      let resetAt: number | undefined;
      if (tier === "member") {
        const stored = localStorage.getItem(`quota_${deviceId}`);
        const existing = stored ? JSON.parse(stored) : null;
        resetAt =
          existing?.resetAt && existing.resetAt > Date.now()
            ? existing.resetAt
            : nextMondayMs();
      }
      localStorage.setItem(
        `quota_${deviceId}`,
        JSON.stringify({
          drawing: { used: drawingUsed, limit: limits.drawing },
          generation: { used: generationUsed, limit: limits.generation },
          ...(resetAt !== undefined ? { resetAt } : {}),
        })
      );
    } catch {
      // localStorage unavailable or full — quota lives only in memory this session
    }
  };

  const decrementDrawing = () => {
    if (drawingQuotaUsed < limits.drawing) {
      const newUsed = drawingQuotaUsed + 1;
      setDrawingQuotaUsed(newUsed);
      saveQuota(newUsed, generationQuotaUsed);
      return true;
    }
    return false;
  };

  const decrementGeneration = () => {
    if (generationQuotaUsed < limits.generation) {
      const newUsed = generationQuotaUsed + 1;
      setGenerationQuotaUsed(newUsed);
      saveQuota(drawingQuotaUsed, newUsed);
      return true;
    }
    return false;
  };

  return {
    tier,
    deviceId,
    drawingQuota: { used: drawingQuotaUsed, limit: limits.drawing },
    generationQuota: {
      used: generationQuotaUsed,
      limit: limits.generation,
      remaining: Math.max(0, limits.generation - generationQuotaUsed),
    },
    expiresAt: (user?.publicMetadata?.expiresAt as string) || null,
    decrementDrawing,
    decrementGeneration,
    isLimitReached:
      drawingQuotaUsed >= limits.drawing || generationQuotaUsed >= limits.generation,
  };
}
