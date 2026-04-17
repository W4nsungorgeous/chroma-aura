"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Sparkles, Zap, Star, Diamond } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "starter_monthly",
    name: "Starter",
    price: "4.99",
    description: "Perfect for casual creators.",
    features: [
      "60 Lineart Generations / mo",
      "20 AI Auto-Colorings / mo",
      "Standard Resolution",
      "Basic Brush Set",
      "No Watermark"
    ],
    buttonText: "Get Starter",
    active: false,
    icon: <Zap className="w-6 h-6 text-yellow-500" />
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "12.99",
    description: "The sweet spot for active artists.",
    features: [
      "200 Lineart Generations / mo",
      "80 AI Auto-Colorings / mo",
      "HD Export (2K)",
      "Priority Queue",
      "Premium Brush Set",
      "No Watermark"
    ],
    buttonText: "Upgrade to Pro",
    active: true,
    highlight: true,
    icon: <Star className="w-6 h-6 text-primary" />
  },
  {
    id: "studio_monthly",
    name: "Studio",
    price: "29.99",
    description: "Ultimate limit for absolute freedom.",
    features: [
      "600 Lineart Generations / mo",
      "200 AI Auto-Colorings / mo",
      "Ultra HD Export (4K)",
      "Style Weight Tuning",
      "Private Cloud Gallery",
      "Commercial Rights"
    ],
    buttonText: "Become Studio",
    active: false,
    icon: <Diamond className="w-6 h-6 text-accent" />
  }
];

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlanClick = (planId: string) => {
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />

      <section className="container mx-auto px-6 max-w-7xl flex-1 flex flex-col justify-center pb-20">
        <div className="text-center mb-20">
          <motion.div
            initial={mounted ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
            animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-border-subtle mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Simple, Transparent Pricing</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight">Choose your <span className="text-primary italic">Creativity</span> level</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            From free exploration to professional mastery, find the plan that fits your artistic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={mounted ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass-card p-8 rounded-[40px] flex flex-col group relative",
                tier.highlight && "border-primary/50 shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-primary/5"
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 z-10">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center justify-between mb-8">
                 <div className={cn("p-4 rounded-2xl", tier.highlight ? "bg-primary/20" : "bg-icon-bg")}>
                    {tier.icon}
                 </div>
                 <div className="text-right">
                    <span className="text-4xl font-bold text-foreground">$</span>
                    <span className="text-5xl font-black text-foreground">{tier.price}</span>
                    <span className="text-text-muted font-medium ml-1">/mo</span>
                 </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 font-heading text-foreground">{tier.name}</h3>
              <p className="text-foreground/80 text-sm mb-8">{tier.description}</p>

              <hr className="border-border-subtle mb-8" />

              <ul className="space-y-4 mb-10 flex-1">
                 {tier.features.map((feature) => (
                   <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-5 h-5 rounded-full bg-icon-bg flex items-center justify-center group-hover:bg-primary/20 transition-all">
                         <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                   </li>
                 ))}
              </ul>

              <button
                onClick={() => handlePlanClick(tier.id)}
                className={cn(
                "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95",
                tier.highlight
                  ? "bg-foreground text-background"
                  : "bg-icon-bg text-foreground hover:bg-icon-bg/80"
              )}>
                 {tier.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Pay-As-You-Go Section */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto glass border-border-subtle rounded-[32px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex-1">
              <h3 className="text-3xl font-bold font-heading mb-2 text-foreground">Pay-As-You-Go Credits</h3>
              <p className="text-text-muted max-w-md mb-4">
                Don't want to subscribe? Buy credits that <strong>never expire</strong> and top up whenever you need. 1 Credit = 1 Generation or Auto-Color.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">$1 = 50 credits</span>
                <span className="px-3 py-1.5 rounded-full bg-foreground/5 text-text-muted border border-border-subtle font-medium">Min $3 · Max $100</span>
                <span className="px-3 py-1.5 rounded-full bg-foreground/5 text-text-muted border border-border-subtle font-medium">Never expire</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-background/50 p-6 rounded-3xl border border-white/10 shadow-inner min-w-[180px]">
              <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">Starting from</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-foreground">$3</span>
              </div>
              <p className="text-sm text-emerald-400 font-bold mb-4">150 credits</p>
              <button
                onClick={() => handlePlanClick("credits_50")}
                className="px-8 py-3 rounded-xl bg-foreground text-background font-bold hover:scale-105 transition-all shadow-md w-full active:scale-95"
              >
                Buy Credits
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
