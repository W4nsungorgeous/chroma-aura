"use client";

import { Sparkles, ArrowRight, Palette, Layers, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center bg-background">
      {/* Background blobs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 mb-6 group cursor-pointer hover:bg-white/5 transition-all">
              <Sparkles className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-medium text-white/80">Next-Gen AI Coloring Platform</span>
              <div className="ml-2 px-2 py-0.5 rounded-md bg-iridescent text-[10px] font-bold text-white uppercase tracking-wider">New</div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-heading leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
              Bring Your <span className="text-primary italic">Imagination</span> to Life with AI
            </h1>
            
            <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-xl">
              Turn your voice, text, or photos into custom coloring pages. Immerse yourself in our interactive 
              AI studio and watch your creations pulse with life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/studio"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/gallery"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                Browse Gallery
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               <div className="flex items-center gap-2">
                 <Zap className="w-5 h-5 text-primary" />
                 <span className="text-sm font-semibold uppercase tracking-widest">Instant Gen</span>
               </div>
               <div className="flex items-center gap-2">
                 <Layers className="w-5 h-5 text-accent" />
                 <span className="text-sm font-semibold uppercase tracking-widest">Multi-modal</span>
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
            className="relative"
          >
            {/* The "Wow" Visual Element */}
            <div className="relative z-10 rounded-3xl overflow-hidden glass p-4 border-white/20 shadow-[0_0_50px_rgba(139,92,246,0.3)] group">
              <div className="absolute inset-0 bg-iridescent opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="bg-slate-950 rounded-2xl overflow-hidden relative aspect-[4/5] md:aspect-square group cursor-pointer">
                 {/* This would be an AI generated lineart image in production */}
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center brightness-75 group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                 
                 <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <p className="text-sm font-bold text-primary mb-2 tracking-tighter uppercase whitespace-nowrap">Featured Creation</p>
                    <h3 className="text-2xl font-bold mb-4">"Neon Forest Mandala"</h3>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-iridescent p-0.5">
                          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold">AI</div>
                       </div>
                       <p className="text-sm text-white/70">Generated in 1.4s • Community Rated 9.8</p>
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
