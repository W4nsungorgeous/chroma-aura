"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { parseSubscription, UserSubscription } from "@/lib/subscription";

interface UseSubscriptionResult extends UserSubscription {
  isLoaded: boolean;
}

/**
 * Reads the current user's subscription state from Clerk publicMetadata.
 * The webhook handler (/api/webhooks/paddle) is the sole writer of this data.
 */
export function useSubscription(): UseSubscriptionResult {
  const { user, isLoaded } = useUser();

  const subscription = useMemo<UserSubscription>(() => {
    if (!user) {
      return {
        planId: null,
        planExpiresAt: null,
        pendingPlanId: null,
        permanentCredits: 0,
        isActivePlan: false,
      };
    }
    return parseSubscription(user.publicMetadata as Record<string, unknown>);
  }, [user]);

  return { isLoaded, ...subscription };
}
