"use client";

import { useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Loader2, CreditCard, Clock, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, CREDITS_PER_PACK, PlanId } from "@/lib/subscription";

// ── Product display metadata ───────────────────────────────────────────────
const PRODUCT_MAP: Record<
  string,
  { name: string; price: string; features: string[]; type: "subscription" | "one-time" }
> = {
  starter_monthly: {
    name: "Starter Plan",
    price: "$4.99",
    type: "subscription",
    features: ["60 Lineart Generations / mo", "20 AI Auto-Colorings / mo", "Standard Resolution"],
  },
  pro_monthly: {
    name: "Pro Plan",
    price: "$12.99",
    type: "subscription",
    features: ["200 Lineart Generations / mo", "80 AI Auto-Colorings / mo", "HD Export (2K)", "Priority Queue"],
  },
  studio_monthly: {
    name: "Studio Plan",
    price: "$29.99",
    type: "subscription",
    features: [
      "600 Lineart Generations / mo",
      "200 AI Auto-Colorings / mo",
      "Ultra HD Export (4K)",
      "Commercial Rights",
    ],
  },
  credits_50: {
    name: "50 Credits Pack",
    price: "$2.00",
    type: "one-time",
    features: ["50 Generations or Auto-Colorings", "Never expires", "Consumed after plan quota is used"],
  },
};

const PLAN_IDS = new Set(["starter_monthly", "pro_monthly", "studio_monthly"]);

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Subscription status banner ─────────────────────────────────────────────
function SubscriptionBanner({
  productId,
  planExpiresAt,
  pendingPlanId,
  permanentCredits,
}: {
  productId: string;
  planExpiresAt: number | null;
  pendingPlanId: PlanId | null;
  permanentCredits: number;
}) {
  const isCredits = productId === "credits_50";
  const isPlan = PLAN_IDS.has(productId);
  const hasActivePlan = planExpiresAt !== null && planExpiresAt > Date.now();

  if (isCredits) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6"
      >
        <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-400">Takes effect immediately</p>
          <p className="text-xs text-emerald-300/70 mt-0.5">
            {CREDITS_PER_PACK} permanent credits will be added to your balance right after payment.
            {permanentCredits > 0 && (
              <> You currently have <strong>{permanentCredits}</strong> permanent credits.</>
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  if (isPlan && hasActivePlan && planExpiresAt) {
    const hasPending = !!pendingPlanId;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 p-4 rounded-2xl border mb-6",
          hasPending
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-sky-500/10 border-sky-500/20"
        )}
      >
        {hasPending ? (
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        )}
        <div>
          {hasPending ? (
            <>
              <p className="text-sm font-bold text-amber-400">You already have a pending plan</p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                {PLANS[pendingPlanId!]?.name} is already queued to start on{" "}
                <strong>{formatDate(planExpiresAt)}</strong>. Purchasing this plan will replace it.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-sky-400">Scheduled to start after your current plan</p>
              <p className="text-xs text-sky-300/70 mt-0.5">
                Your new plan will activate on <strong>{formatDate(planExpiresAt)}</strong> when your
                current plan expires. You won't be charged until then.
              </p>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}

// ── Main checkout content ──────────────────────────────────────────────────
function CheckoutContent() {
  const { user, isLoaded } = useUser();
  const { isLoaded: subLoaded, planId, planExpiresAt, pendingPlanId, permanentCredits, isActivePlan } =
    useSubscription();
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("plan") || "pro_monthly";
  const productInfo = PRODUCT_MAP[productId] || PRODUCT_MAP["pro_monthly"];
  const isPlan = PLAN_IDS.has(productId);
  const isCredits = productId === "credits_50";

  // Auth gate
  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/checkout?plan=${productId}`)}`);
    }
  }, [isLoaded, user, router, productId]);

  const loading = !isLoaded || !subLoaded;

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Determine CTA label based on subscription state ──────────────────────
  let ctaLabel = "Complete Purchase";
  if (isPlan) {
    if (isActivePlan) {
      ctaLabel = pendingPlanId ? "Replace Queued Plan" : "Queue New Plan";
    } else {
      ctaLabel = "Subscribe Now";
    }
  } else if (isCredits) {
    ctaLabel = "Buy Credits Now";
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl pt-32">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-muted hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pricing
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Order Summary */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h1 className="text-3xl font-bold font-heading mb-2 text-foreground">Checkout securely</h1>
          <p className="text-text-muted mb-6">
            You are{" "}
            {isPlan && isActivePlan ? "queuing" : "purchasing"} the{" "}
            <span className="font-bold text-primary">{productInfo.name}</span>.
          </p>

          {/* Subscription-aware banner */}
          <SubscriptionBanner
            productId={productId}
            planExpiresAt={planExpiresAt}
            pendingPlanId={pendingPlanId}
            permanentCredits={permanentCredits}
          />

          {/* Permanent credits balance (always visible when buying credits) */}
          {isCredits && permanentCredits > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 border border-border-subtle mb-4">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-foreground/80">
                Current balance: <strong className="text-foreground">{permanentCredits}</strong> permanent credits
                &nbsp;→&nbsp; after purchase:{" "}
                <strong className="text-emerald-400">{permanentCredits + CREDITS_PER_PACK}</strong>
              </p>
            </div>
          )}

          {/* Order summary card */}
          <div className="glass-card p-8 rounded-[32px] border border-border-subtle shadow-xl bg-card-bg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">{productInfo.name}</h3>
                <p className="text-sm text-text-muted">
                  {productInfo.type === "subscription"
                    ? isActivePlan
                      ? `Starts ${planExpiresAt ? formatDate(planExpiresAt) : "after current plan"}`
                      : "Billed monthly"
                    : "One-time · Permanent"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-foreground">{productInfo.price}</span>
              </div>
            </div>

            <hr className="border-border-subtle my-6" />

            <h4 className="font-bold text-sm text-foreground/80 mb-4 uppercase tracking-wider">
              What's included
            </h4>
            <ul className="space-y-3 mb-8">
              {productInfo.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Credits type explanation */}
            {isCredits && (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 mb-6">
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  <strong className="text-emerald-400">Permanent credits</strong> are separate from your monthly
                  plan allocation. They are consumed automatically once your plan quota is exhausted, and they
                  never expire.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-icon-bg flex items-start gap-3 border border-border-subtle">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted">
                Guaranteed safe & secure checkout powered by Paddle. Full encryption and compliance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Paddle payment container */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
          <div className="glass-card p-8 rounded-[32px] border border-border-subtle min-h-[500px] flex flex-col bg-card-bg">
            {/* Current plan info (if upgrading) */}
            {isPlan && isActivePlan && planId && (
              <div className="mb-6 p-4 rounded-2xl bg-foreground/5 border border-border-subtle">
                <p className="text-xs text-text-muted mb-1 uppercase tracking-wider font-bold">Current plan</p>
                <p className="text-sm font-bold text-foreground">
                  {PLANS[planId]?.name ?? planId}{" "}
                  <span className="font-normal text-text-muted">
                    · expires {planExpiresAt ? formatDate(planExpiresAt) : "—"}
                  </span>
                </p>
              </div>
            )}

            {/* Paddle inline checkout mounts here */}
            <div
              id="paddle-checkout-container"
              className="flex-1 w-full min-h-[400px] border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center p-6 bg-icon-bg"
            >
              <CreditCard className="w-12 h-12 text-text-muted mb-4 opacity-50" />
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-sm text-text-muted max-w-xs text-center mb-6">
                Payment is processed securely by Paddle.
              </p>

              {/* Placeholder CTA — replaced by Paddle's inline frame once integrated */}
              <button
                className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20"
                onClick={() => {
                  // TODO: call Paddle.Checkout.open({ ... }) here
                  console.log("[Checkout] Initiating Paddle checkout for:", productId);
                }}
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
