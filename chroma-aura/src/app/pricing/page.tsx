"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Sparkles, Zap, Star, Diamond } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Free Guest",
    price: "0",
    description: "Try out Chroma Aura for free.",
    features: [
      "1 AI Generation / day",
      "5 Studio Sessions / day",
      "Standard Resolution",
      "Basic Brush Set",
      "Community Support"
    ],
    buttonText: "Current Plan",
    active: false,
    icon: <Zap className="w-6 h-6 text-yellow-500" />
  },
  {
    name: "Creative Pro",
    price: "12",
    description: "Perfect for casual creators.",
    features: [
      "50 AI Generations / day",
      "Unlimited Studio Sessions",
      "HD Export (4K)",
      "Premium Brush Set",
      "Priority Queue",
      "No Watermark"
    ],
    buttonText: "Upgrade to Pro",
    active: true,
    highlight: true,
    icon: <Star className="w-6 h-6 text-primary" />
  },
  {
    name: "VIP Artist",
    price: "29",
    description: "Ultimate creative freedom.",
    features: [
      "Unlimited AI Generations",
      "Batch Generation (50 at once)",
      "Exclusive Art Styles",
      "Early Access to AI Tools",
      "Private Gallery",
      "Commercial Rights"
    ],
    buttonText: "Become VIP",
    active: false,
    icon: <Diamond className="w-6 h-6 text-accent" />
  }
];

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

              <button className={cn(
                "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg",
                tier.highlight 
                  ? "bg-foreground text-background hover:scale-105 active:scale-95" 
                  : "bg-icon-bg text-foreground hover:bg-icon-bg/80"
              )}>
                 {tier.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
