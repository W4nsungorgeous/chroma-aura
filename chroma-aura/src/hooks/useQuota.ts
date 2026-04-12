import { useState, useEffect, useMemo } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useUser } from "@clerk/nextjs";

export type UserTier = "guest" | "member" | "vip";

interface Quota {
  used: number;
  limit: number;
}

const TIER_LIMITS = {
  guest: { generation: 3, drawing: 50 },
  member: { generation: 20, drawing: 500 },
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
    
    return "member";
  }, [user, isLoaded]);

  // 2. Load Limits based on Tier
  const limits = TIER_LIMITS[tier];

  useEffect(() => {
    const initFingerprint = async () => {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      setDeviceId(result.visitorId);
      
      // Load initial quota from localStorage
      const stored = localStorage.getItem(`quota_${result.visitorId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrawingQuotaUsed(parsed.drawing.used || 0);
        setGenerationQuotaUsed(parsed.generation.used || 0);
      }
    };

    initFingerprint();
  }, []);

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
    if (deviceId) {
      localStorage.setItem(`quota_${deviceId}`, JSON.stringify({ 
        drawing: { used: drawingUsed, limit: limits.drawing }, 
        generation: { used: generationUsed, limit: limits.generation } 
      }));
    }
  };

  return {
    tier,
    drawingQuota: { used: drawingQuotaUsed, limit: limits.drawing },
    generationQuota: { used: generationQuotaUsed, limit: limits.generation },
    decrementDrawing,
    decrementGeneration,
    isLimitReached: drawingQuotaUsed >= limits.drawing || generationQuotaUsed >= limits.generation
  };
}
