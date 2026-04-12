"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Palette, Layers, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  
  const featured = {
    title: isDark ? "Neon Forest Mandala" : "Dreamy Cloud Castle",
    imgUrl: isDark 
      ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
      : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000",
    overlay: isDark ? "from-slate-950/90" : "from-primary/60"
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center bg-background">
      {/* Background blobs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-400/10 rounded-full blur-[120px] -z-10" />

      {/* Floating Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20 dark:text-primary/10"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0 
            }}
            animate={mounted ? { 
              y: ["-10%", "110%"],
              rotate: 360,
              opacity: [0, 1, 0]
            } : { opacity: 0 }}
            transition={{ 
              duration: Math.random() * 10 + 20, 
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        ))}
      </div>
      
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={mounted ? { opacity: 0, x: -50 } : { opacity: 1, x: 0 }}
            animate={mounted ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 group cursor-pointer transition-all">
              <Sparkles className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold text-text-muted">Next-Gen AI Coloring Platform</span>
              <div className="ml-2 px-2 py-0.5 rounded-md bg-iridescent text-[10px] font-bold text-white uppercase tracking-wider">New</div>
            </div>
            
            <h1 
              className="text-5xl md:text-7xl font-bold font-heading leading-tight mb-6 bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--title-gradient)' }}
            >
              Bring Your <span className="text-primary italic">Imagination</span> to Life with AI
            </h1>
            
            <p className="text-xl text-text-muted mb-10 leading-relaxed max-w-xl font-medium">
              Turn your voice, text, or photos into custom coloring pages. Immerse yourself in our interactive 
              AI studio and watch your creations pulse with life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/studio"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/gallery"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10"
              >
                Browse Gallery
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 opacity-80 hover:opacity-100 transition-all duration-500">
               <div className="flex items-center gap-2 text-text-muted">
                 <Zap className="w-5 h-5 text-primary" />
                 <span className="text-sm font-bold uppercase tracking-widest">Instant Gen</span>
               </div>
               <div className="flex items-center gap-2 text-text-muted">
                 <Layers className="w-5 h-5 text-accent" />
                 <span className="text-sm font-bold uppercase tracking-widest">Multi-modal</span>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={mounted ? { opacity: 0, scale: 0.8, rotate: 5 } : { opacity: 1, scale: 1, rotate: 0 }}
            animate={mounted ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
            className="relative"
          >
            {/* The "Wow" Visual Element */}
            <div className="relative z-10 rounded-3xl overflow-hidden glass p-4 border-border-subtle shadow-[0_0_50px_rgba(159,122,234,0.1)] group">
              <div className="absolute inset-0 bg-iridescent opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="bg-section-muted rounded-2xl overflow-hidden relative aspect-[4/5] md:aspect-square group cursor-pointer">
                  {/* This would be an AI generated lineart image in production */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center brightness-90 group-hover:scale-110 transition-transform duration-700" 
                    style={{ backgroundImage: `url('${featured.imgUrl}')` }}
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-t via-transparent to-transparent", featured.overlay)} />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <p className="text-sm font-bold text-white mb-2 tracking-tighter uppercase whitespace-nowrap drop-shadow-md">Featured Creation</p>
                    <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg group-hover:text-white transition-colors">"{featured.title}"</h3>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-iridescent p-0.5">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-800 border border-slate-100">AI</div>
                       </div>
                       <p className="text-sm text-white/80 font-medium drop-shadow-sm">Generated in 1.4s • Community Rated 9.8</p>
                    </div>
                 </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-bounce" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
