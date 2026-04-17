"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Palette, Layers, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
    title: isDark ? "Neon Forest Mandala" : "Prismatic Crystal Butterfly",
    imgUrl: isDark 
      ? "/images/neon_forest_mandala.png"
      : "/images/prismatic_crystal_butterfly.png",
    overlay: isDark ? "from-slate-950/90" : "from-primary/60"
  };

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 30 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], ["15deg", "-15deg"]);
  const rotateY = useTransform(smoothX, [0, 1], ["-15deg", "15deg"]);
  const trZText = useTransform(smoothX, [0, 1], ["40px", "50px"]); // subtle push
  const bgX = useTransform(smoothX, [0, 1], ["-5%", "5%"]);
  const bgY = useTransform(smoothY, [0, 1], ["-5%", "5%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
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
            {/* The "Wow" Visual Element with 3D Tilt */}
            <div className="relative z-10 group perspective-[1200px]">
              <motion.div 
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="relative rounded-3xl p-1 shadow-[0_0_50px_rgba(159,122,234,0.1)] group cursor-pointer transition-shadow duration-500 hover:shadow-[0_20px_80px_rgba(159,122,234,0.3)]"
              >
                <div className="absolute inset-0 bg-iridescent opacity-10 group-hover:opacity-20 transition-opacity rounded-3xl" style={{ transform: "translateZ(-20px)" }} />
                
                <div className="bg-section-muted rounded-[22px] overflow-hidden relative aspect-[4/5] md:aspect-square" style={{ transformStyle: "preserve-3d" }}>
                    
                    {/* Parallax Background Image */}
                    <motion.div 
                      className="absolute inset-[-10%] bg-cover bg-center brightness-95" 
                      style={{ 
                        backgroundImage: `url('${featured.imgUrl}')`,
                        x: bgX,
                        y: bgY,
                      }}
                    />
                    
                    {/* 3D Popping Image Overlay (Fake Depth) */}
                    <motion.div 
                      className="absolute inset-[-5%] bg-contain bg-center bg-no-repeat transition-transform duration-700" 
                      style={{ 
                        backgroundImage: `url('${featured.imgUrl}')`,
                        transform: "translateZ(30px) scale(1.05)",
                      }}
                    />

                    <div className={cn("absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-80", featured.overlay)} />
                    
                    {/* Floating Text matching Z-axis */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none"
                      style={{ translateZ: trZText }}
                    >
                      <p className="text-sm font-bold text-white mb-2 tracking-tighter uppercase whitespace-nowrap drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]">Featured Creation</p>
                      <h3 className="text-3xl font-black mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">"{featured.title}"</h3>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-iridescent p-0.5 shadow-lg">
                            <div className="w-full h-full rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs font-black text-slate-800">AI</div>
                         </div>
                         <p className="text-sm text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Generated in 1.4s • Community Rated 9.8</p>
                      </div>
                   </motion.div>
                </div>
              </motion.div>
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
