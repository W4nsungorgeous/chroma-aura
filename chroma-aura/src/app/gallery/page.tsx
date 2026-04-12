"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Library, Sparkles, User, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLES = [
  { title: "Neon Cyberpunk City", artist: "AuraArtist", likes: 124, color: "bg-purple-500" },
  { title: "Mystic Forest Spirits", artist: "ZenColors", likes: 89, color: "bg-emerald-500" },
  { title: "Space Explorer Kitty", artist: "StellarCat", likes: 256, color: "bg-blue-500" },
  { title: "Golden Dragon Temple", artist: "MythicMina", likes: 167, color: "bg-amber-500" },
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />

      <section className="container mx-auto px-6 max-w-7xl flex-1 flex flex-col pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-border-subtle mb-6"
            >
              <Library className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground/80">Community Gallery</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight">
              Explorer the <span className="text-primary italic">Aura</span> of Creations
            </h1>
            <p className="text-xl text-text-muted font-medium opacity-80">
              Discover, share, and get inspired by masterpieces created by our worldwide community of artists.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-2xl bg-icon-bg border border-border-subtle font-bold hover:bg-icon-bg/80 transition-all text-foreground">Trending</button>
            <button className="px-6 py-3 rounded-2xl bg-foreground text-background font-bold hover:scale-105 active:scale-95 transition-all shadow-xl">Latest</button>
          </div>
        </div>

        {/* Gallery Grid Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SAMPLES.map((sample, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-[32px] overflow-hidden bg-icon-bg relative mb-4 border border-border-subtle transition-all group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                <div className={cn("absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110", sample.color)} />
                <div className="absolute inset-0 flex items-center justify-center p-8">
                   <div className="w-full h-full border-4 border-dashed border-foreground/10 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-foreground/20 group-hover:rotate-12 transition-transform" />
                   </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                   <div className="flex gap-3">
                      <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition-all">Remix</button>
                      <button className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"><Share2 className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
              
              <div className="px-2">
                <h3 className="font-bold text-lg mb-1 text-foreground truncate">{sample.title}</h3>
                <div className="flex items-center justify-between text-text-muted">
                   <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                         <User className="w-3 h-3 text-primary" />
                      </div>
                      {sample.artist}
                   </div>
                   <div className="flex items-center gap-1 text-xs font-bold">
                      <Heart className="w-3.5 h-3.5" />
                      {sample.likes}
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Empty placeholders */}
          {[1, 2, 3, 4].map((i) => (
            <div key={`empty-${i}`} className="aspect-[3/4] rounded-[32px] border-2 border-dashed border-border-subtle bg-icon-bg/30 flex flex-col items-center justify-center p-8 text-center gap-4 opacity-50">
               <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-subtle" />
               <div className="h-4 w-24 bg-border-subtle rounded-full" />
            </div>
          ))}
        </div>
        
        <div className="mt-20 py-20 rounded-[40px] bg-icon-bg border border-border-subtle text-center">
           <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
           <h2 className="text-3xl font-bold mb-4 text-foreground">Artist Spotlight Coming Soon</h2>
           <p className="text-text-muted max-w-md mx-auto">We're currently selecting our first wave of featured artists. Want to be one of them? Keep creating!</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
