"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export type UserTier = "guest" | "member" | "vip";

interface Quota {
  used: number;
  limit: number;
}

export function useQuota() {
  const [tier, setTier] = useState<UserTier>("guest");
  const [drawingQuota, setDrawingQuota] = useState<Quota>({ used: 0, limit: 50 });
  const [generationQuota, setGenerationQuota] = useState<Quota>({ used: 0, limit: 3 });
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initFingerprint = async () => {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      setDeviceId(result.visitorId);
      
      // Load initial quota from localStorage for demo/sim
      const stored = localStorage.getItem(`quota_${result.visitorId}`);
      if (stored) {
        setDrawingQuota(JSON.parse(stored).drawing);
        setGenerationQuota(JSON.parse(stored).generation);
      }
    };

    initFingerprint();
  }, []);

  const decrementDrawing = () => {
    if (drawingQuota.used < drawingQuota.limit) {
      const newQuota = { ...drawingQuota, used: drawingQuota.used + 1 };
      setDrawingQuota(newQuota);
      saveQuota(newQuota, generationQuota);
      return true;
    }
    return false;
  };

  const decrementGeneration = () => {
    if (generationQuota.used < generationQuota.limit) {
      const newQuota = { ...generationQuota, used: generationQuota.used + 1 };
      setGenerationQuota(newQuota);
      saveQuota(drawingQuota, newQuota);
      return true;
    }
    return false;
  };

  const saveQuota = (drawing: Quota, generation: Quota) => {
    if (deviceId) {
      localStorage.setItem(`quota_${deviceId}`, JSON.stringify({ drawing, generation }));
    }
  };

  return {
    tier,
    drawingQuota,
    generationQuota,
    decrementDrawing,
    decrementGeneration,
    isLimitReached: drawingQuota.used >= drawingQuota.limit || generationQuota.used >= generationQuota.limit
  };
}
