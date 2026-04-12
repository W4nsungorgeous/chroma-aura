"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Library, Sparkles, User, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SAMPLES = [
  { 
    title: "Mandala Butterfly", 
    artist: "AuraArtist", 
    likes: 124, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Nature",
    filter: ""
  },
  { 
    title: "Anime Neon Soul", 
    artist: "ZenColors", 
    likes: 89, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Anime",
    filter: "contrast-150 saturate-200 hue-rotate-180" 
  },
  { 
    title: "Golden Mythic Wings", 
    artist: "MythicMina", 
    likes: 167, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Fantasy",
    filter: "sepia brightness-90 contrast-125 saturate-50"
  },
  { 
    title: "Cyber City Monarch", 
    artist: "StellarCat", 
    likes: 256, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Cyberpunk",
    filter: "invert-10 hue-rotate-90 brightness-110"
  },
  { 
    title: "Steampunk Core", 
    artist: "SteamMaster", 
    likes: 312, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Steampunk",
    filter: "brightness-75 contrast-150 sepia(0.8) hue-rotate-[-30deg]"
  },
  { 
    title: "Ukiyo-e Legacy", 
    artist: "WaveRunner", 
    likes: 204, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Traditional",
    filter: "contrast-90 saturate-50 sepia-20 brightness-105"
  },
  { 
    title: "Bioluminescent Rift", 
    artist: "NeonDeep", 
    likes: 421, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Deep Sea",
    filter: "invert saturate-150 hue-rotate-200"
  },
  { 
    title: "Midnight Cathedral", 
    artist: "Nightshade", 
    likes: 156, 
    lineart: "/ai/latest_lineart.png", 
    colored: "/ai/latest_autocolor.png",
    tag: "Gothic",
    filter: "grayscale brightness-50 contrast-200"
  },
];

export default function GalleryPage() {
  const router = useRouter();

  const handleRemix = (lineartUrl: string) => {
    router.push(`/studio?lineart=${encodeURIComponent(lineartUrl)}`);
  };
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
              <div className="aspect-[3/4] p-4 relative mb-6 group cursor-pointer" style={{ perspective: "1200px" }}>
                {/* 
                   Poker-Style Shuffle System:
                   - Lineart (Front, slides out-left on hover)
                   - Colored (Back, snaps to center on hover)
                */}

                {/* Layer 1: Colored Masterpiece (Pre-loaded behind) */}
                <motion.div 
                  initial={{ zIndex: 10, scale: 0.9, x: 40, y: 20, rotate: 6, opacity: 0.4 }}
                  whileHover={{ zIndex: 30, scale: 1.05, x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="absolute inset-4 rounded-[28px] overflow-hidden shadow-2xl border border-white/20 bg-background z-10"
                >
                  <img 
                    src={sample.colored} 
                    alt="Colored" 
                    className={cn("w-full h-full object-cover transition-all duration-700", sample.filter)} 
                  />
                  
                  {/* Overlay Actions (Visible only on top) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleRemix(sample.lineart)}
                        className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                      >
                        Remix
                      </button>
                      <button className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"><Share2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </motion.div>

                {/* Layer 2: Lineart Draft (Initially front) */}
                <motion.div 
                  initial={{ zIndex: 20, scale: 1, x: 0, y: 0, rotate: -3, opacity: 1 }}
                  whileHover={{ 
                    zIndex: 5, 
                    x: -140, 
                    y: -10,
                    rotate: -12, 
                    rotateY: -35,
                    scale: 0.8, 
                    opacity: 0 
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className="absolute inset-4 rounded-[28px] overflow-hidden border border-border-subtle bg-white shadow-xl z-20"
                >
                  <img src={sample.lineart} alt="Lineart" className="w-full h-full object-cover grayscale brightness-110" />
                  
                  {/* "Draft" Badge */}
                  <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full bg-black/5 backdrop-blur-sm border border-black/10 text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">
                    Original Draft
                  </div>
                </motion.div>

                {/* Global Tag */}
                <motion.div 
                  className="absolute top-8 right-8 z-40 px-4 py-1.5 rounded-full glass border-white/20 text-[10px] font-bold text-white shadow-xl pointer-events-none uppercase tracking-widest"
                  whileHover={{ scale: 1.1 }}
                >
                  {sample.tag}
                </motion.div>
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
