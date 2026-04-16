import { useState, useEffect, useMemo } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useUser } from "@clerk/nextjs";

export type UserTier = "guest" | "member" | "starter" | "pro" | "studio" | "vip";

const TIER_LIMITS = {
  guest: { generation: 2, drawing: 0 },
  member: { generation: 3, drawing: 2 },
  starter: { generation: 60, drawing: 20 },
  pro: { generation: 200, drawing: 80 },
  studio: { generation: 600, drawing: 200 },
  vip: { generation: 9999, drawing: 9999 },
};

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
    
    // VIP Upgrade for specific email
    if (email === "kellclosss@gmail.com" || role === "vip" || role === "admin") {
      return "vip";
    }
    
    // Paid Plans
    if (role === "starter") return "starter";
    if (role === "pro") return "pro";
    if (role === "studio") return "studio";
    
    return "member";
  }, [user, isLoaded]);

  // 2. Load Limits based on Tier
  const limits = TIER_LIMITS[tier];

  useEffect(() => {
    const initFingerprint = async () => {
      if (!isLoaded) return;
      let fpId: string | null = null;
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        fpId = result.visitorId;
        setDeviceId(result.visitorId);
      } catch (err) {
        console.error("Fingerprint error", err);
      }
      
      const storageKey = user ? `quota_user_${user.id}` : (fpId ? `quota_fp_${fpId}` : null);
      if (storageKey) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            setDrawingQuotaUsed(parsed.drawing?.used || 0);
            setGenerationQuotaUsed(parsed.generation?.used || 0);
          } else {
            setDrawingQuotaUsed(0);
            setGenerationQuotaUsed(0);
          }
        } catch {
          // localStorage unavailable or parse error — start from zero
          setDrawingQuotaUsed(0);
          setGenerationQuotaUsed(0);
        }
      }
    };

    initFingerprint();
  }, [user, isLoaded]); // Re-run when auth changes to switch quota cache

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

  const saveQuota = (drawingUsed: number, generationUsed: number) => {
    const storageKey = user ? `quota_user_${user.id}` : (deviceId ? `quota_fp_${deviceId}` : null);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          drawing: { used: drawingUsed, limit: limits.drawing },
          generation: { used: generationUsed, limit: limits.generation }
        }));
      } catch {
        // localStorage unavailable or full — quota state lives only in memory this session
      }
    }
  };

  return {
    tier,
    deviceId,
    drawingQuota: { used: drawingQuotaUsed, limit: limits.drawing },
    generationQuota: {
      used: generationQuotaUsed,
      limit: limits.generation,
      remaining: Math.max(0, limits.generation - generationQuotaUsed)
    },
    expiresAt: user?.publicMetadata?.expiresAt as string || null,
    decrementDrawing,
    decrementGeneration,
    isLimitReached: drawingQuotaUsed >= limits.drawing || generationQuotaUsed >= limits.generation
  };
}
