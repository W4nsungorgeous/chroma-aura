"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Loader2, Clock, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import {
  PLANS,
  CREDITS_PER_DOLLAR,
  CREDITS_MIN_DOLLARS,
  CREDITS_MAX_DOLLARS,
  CREDITS_STEP,
  CREDITS_PRESETS,
  type PlanId,
} from "@/lib/subscription";

// ── Client-side Paddle Price ID map ───────────────────────────────────────
const PADDLE_PRICE_IDS: Record<string, string> = {
  starter_monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_STARTER   ?? "",
  pro_monthly:     process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO       ?? "",
  studio_monthly:  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_STUDIO    ?? "",
  credits_50:      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_CREDITS_50 ?? "",
};

// ── Product display metadata (static plans only; credits are dynamic) ─────
const PLAN_PRODUCT_MAP: Record<
  string,
  { name: string; price: string; features: string[]; type: "subscription" }
> = {
  starter_monthly: {
    name: "Starter Plan", price: "$4.99", type: "subscription",
    features: ["60 Lineart Generations / mo", "20 AI Auto-Colorings / mo", "Standard Resolution"],
  },
  pro_monthly: {
    name: "Pro Plan", price: "$12.99", type: "subscription",
    features: ["200 Lineart Generations / mo", "80 AI Auto-Colorings / mo", "HD Export (2K)", "Priority Queue"],
  },
  studio_monthly: {
    name: "Studio Plan", price: "$29.99", type: "subscription",
    features: ["600 Lineart Generations / mo", "200 AI Auto-Colorings / mo", "Ultra HD Export (4K)", "Commercial Rights"],
  },
};

const PLAN_IDS = new Set(["starter_monthly", "pro_monthly", "studio_monthly"]);

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ── Credits amount selector ────────────────────────────────────────────────
function CreditAmountSelector({
  amount,
  onChange,
}: {
  amount: number;
  onChange: (v: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(amount));

  // Keep local input in sync when parent changes (e.g. preset click)
  useEffect(() => { setInputValue(String(amount)); }, [amount]);

  const clamp = (v: number) =>
    Math.min(CREDITS_MAX_DOLLARS, Math.max(CREDITS_MIN_DOLLARS, Math.round(v)));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) onChange(clamp(parsed));
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    const clamped = isNaN(parsed) ? CREDITS_MIN_DOLLARS : clamp(parsed);
    onChange(clamped);
    setInputValue(String(clamped));
  };

  const pct = ((amount - CREDITS_MIN_DOLLARS) / (CREDITS_MAX_DOLLARS - CREDITS_MIN_DOLLARS)) * 100;

  return (
    <div className="space-y-5">
      {/* ── Preset buttons ── */}
      <div className="flex gap-2 flex-wrap">
        {CREDITS_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "flex-1 min-w-[60px] py-2 rounded-2xl text-sm font-bold transition-all border",
              amount === preset
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-foreground/5 text-foreground border-border-subtle hover:bg-foreground/10"
            )}
          >
            ${preset}
          </button>
        ))}
      </div>

      {/* ── Slider ── */}
      <div className="relative px-1">
        <div className="relative h-2 rounded-full bg-foreground/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={CREDITS_MIN_DOLLARS}
          max={CREDITS_MAX_DOLLARS}
          step={CREDITS_STEP}
          value={amount}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30 border-2 border-background pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted px-1">
        <span>${CREDITS_MIN_DOLLARS}</span>
        <span>${CREDITS_MAX_DOLLARS}</span>
      </div>

      {/* ── Direct input ── */}
      <div className="flex items-center gap-3">
        <span className="text-text-muted text-sm font-medium">Custom amount:</span>
        <div className="flex items-center gap-1 bg-foreground/5 border border-border-subtle rounded-2xl px-4 py-2 w-32">
          <span className="text-foreground font-bold">$</span>
          <input
            type="number"
            min={CREDITS_MIN_DOLLARS}
            max={CREDITS_MAX_DOLLARS}
            step={CREDITS_STEP}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full bg-transparent text-foreground font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* ── Summary line ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div>
          <p className="text-xs text-text-muted">You pay</p>
          <p className="text-2xl font-black text-foreground">${amount}</p>
        </div>
        <div className="h-8 w-px bg-border-subtle" />
        <div className="text-right">
          <p className="text-xs text-text-muted">You receive</p>
          <p className="text-2xl font-black text-emerald-400">
            {(amount * CREDITS_PER_DOLLAR).toLocaleString()}
            <span className="text-sm font-medium text-text-muted ml-1">credits</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Subscription status banner ─────────────────────────────────────────────
function SubscriptionBanner({
  productId, planExpiresAt, pendingPlanId, permanentCredits, creditAmount,
}: {
  productId: string;
  planExpiresAt: number | null;
  pendingPlanId: PlanId | null;
  permanentCredits: number;
  creditAmount: number;
}) {
  const isCredits = productId === "credits_50";
  const isPlan = PLAN_IDS.has(productId);
  const hasActivePlan = planExpiresAt !== null && planExpiresAt > Date.now();

  if (isCredits) {
    const creditsAdded = creditAmount * CREDITS_PER_DOLLAR;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6"
      >
        <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-400">Takes effect immediately</p>
          <p className="text-xs text-emerald-300/70 mt-0.5">
            <strong>{creditsAdded.toLocaleString()}</strong> permanent credits will be added right after payment.
            {permanentCredits > 0 && (
              <> Balance: <strong>{permanentCredits}</strong> → <strong className="text-emerald-400">{permanentCredits + creditsAdded}</strong></>
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
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-start gap-3 p-4 rounded-2xl border mb-6",
          hasPending ? "bg-amber-500/10 border-amber-500/20" : "bg-sky-500/10 border-sky-500/20"
        )}
      >
        {hasPending
          ? <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          : <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
        <div>
          {hasPending ? (
            <>
              <p className="text-sm font-bold text-amber-400">You already have a pending plan</p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                {PLANS[pendingPlanId!]?.name} is queued to start on <strong>{formatDate(planExpiresAt)}</strong>. Purchasing will replace it.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-sky-400">Scheduled to start after your current plan</p>
              <p className="text-xs text-sky-300/70 mt-0.5">
                Your new plan activates on <strong>{formatDate(planExpiresAt)}</strong> when your current plan expires.
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

  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [creditAmount, setCreditAmount] = useState(CREDITS_PRESETS[0]); // default $10

  const productId = searchParams.get("plan") || "pro_monthly";
  const isPlan = PLAN_IDS.has(productId);
  const isCredits = productId === "credits_50";
  const priceId = PADDLE_PRICE_IDS[productId];
  const planInfo = PLAN_PRODUCT_MAP[productId];

  // Auth gate
  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/checkout?plan=${productId}`)}`);
    }
  }, [isLoaded, user, router, productId]);

  // ── Initialize Paddle JS ──────────────────────────────────────────────
  useEffect(() => {
    initializePaddle({
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") ?? "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
    }).then((instance) => { if (instance) setPaddle(instance); });
  }, []);

  // ── Open inline checkout once Paddle + user are ready ────────────────
  useEffect(() => {
    if (!paddle || !user || !priceId) return;
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    paddle.Checkout.open({
      items: [{ priceId, quantity: isCredits ? creditAmount : 1 }],
      customer: userEmail ? { email: userEmail } : undefined,
      customData: { clerk_user_id: user.id },
      settings: {
        displayMode: "inline",
        frameTarget: "paddle-checkout-frame",
        frameInitialHeight: 450,
        theme: "dark",
        locale: "en",
      },
    });
    setCheckoutReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paddle, user, priceId]);

  // ── Update quantity when credit amount changes (no full re-open) ──────
  const updateCreditQuantity = useCallback(
    (amount: number) => {
      if (!paddle || !priceId || !checkoutReady) return;
      paddle.Checkout.updateItems([{ priceId, quantity: amount }]);
    },
    [paddle, priceId, checkoutReady]
  );

  const handleCreditAmountChange = (amount: number) => {
    setCreditAmount(amount);
    updateCreditQuantity(amount);
  };

  const loading = !isLoaded || !subLoaded;

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
        {/* ── Left Column: Order Summary ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h1 className="text-3xl font-bold font-heading mb-2 text-foreground">Checkout securely</h1>
          <p className="text-text-muted mb-6">
            {isCredits
              ? "Choose how many credits to add to your balance."
              : <>You are {isPlan && isActivePlan ? "queuing" : "purchasing"} the{" "}
                  <span className="font-bold text-primary">{planInfo?.name}</span>.</>
            }
          </p>

          <SubscriptionBanner
            productId={productId}
            planExpiresAt={planExpiresAt}
            pendingPlanId={pendingPlanId}
            permanentCredits={permanentCredits}
            creditAmount={creditAmount}
          />

          {/* Credits: amount selector */}
          {isCredits && (
            <div className="glass-card p-8 rounded-[32px] border border-border-subtle shadow-xl bg-card-bg mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Permanent Credits</h3>
                  <p className="text-xs text-text-muted">$1 = {CREDITS_PER_DOLLAR} credits · never expire</p>
                </div>
              </div>

              <CreditAmountSelector amount={creditAmount} onChange={handleCreditAmountChange} />

              {permanentCredits > 0 && (
                <div className="mt-5 flex items-center gap-2 text-xs text-text-muted">
                  <Zap className="w-3 h-3 text-primary" />
                  Current balance: <strong className="text-foreground">{permanentCredits}</strong> credits
                </div>
              )}

              <div className="mt-5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  <strong className="text-emerald-400">Permanent credits</strong> are separate from your monthly
                  plan allocation. They are consumed automatically once your plan quota is exhausted.
                </p>
              </div>
            </div>
          )}

          {/* Plans: static summary card */}
          {isPlan && planInfo && (
            <div className="glass-card p-8 rounded-[32px] border border-border-subtle shadow-xl bg-card-bg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{planInfo.name}</h3>
                  <p className="text-sm text-text-muted">
                    {isActivePlan
                      ? `Starts ${planExpiresAt ? formatDate(planExpiresAt) : "after current plan"}`
                      : "Billed monthly"}
                  </p>
                </div>
                <span className="text-3xl font-black text-foreground">{planInfo.price}</span>
              </div>

              <hr className="border-border-subtle my-6" />

              <h4 className="font-bold text-sm text-foreground/80 mb-4 uppercase tracking-wider">What's included</h4>
              <ul className="space-y-3 mb-8">
                {planInfo.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isActivePlan && planId && (
                <div className="p-4 rounded-2xl bg-foreground/5 border border-border-subtle mb-6">
                  <p className="text-xs text-text-muted mb-1 uppercase tracking-wider font-bold">Current plan</p>
                  <p className="text-sm font-bold text-foreground">
                    {PLANS[planId]?.name ?? planId}{" "}
                    <span className="font-normal text-text-muted">
                      · expires {planExpiresAt ? formatDate(planExpiresAt) : "—"}
                    </span>
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
          )}
        </motion.div>

        {/* ── Right Column: Paddle inline checkout ── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
          <div className="glass-card p-4 rounded-[32px] border border-border-subtle min-h-[500px] flex flex-col bg-card-bg overflow-hidden">
            {!checkoutReady && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-text-muted">Loading secure payment form…</p>
              </div>
            )}
            {/*
             * Paddle mounts its inline checkout iframe into any element
             * with the CSS class matching frameTarget ("paddle-checkout-frame").
             */}
            <div
              className={cn(
                "paddle-checkout-frame w-full flex-1 transition-opacity duration-300",
                checkoutReady ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
              )}
            />
          </div>

          {!priceId && (
            <p className="text-xs text-rose-400 text-center mt-3">
              Payment is not yet configured for this product. Please contact support.
            </p>
          )}
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
