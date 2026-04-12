"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Sparkles, Palette, Zap, Library, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative flex-1">
      <Navbar />
      <Hero />
      
      {/* Features Bento Grid Teaser */}
      <section className="py-24 bg-section-muted px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">The Online Drawing Studio <span className="text-accent underline underline-offset-8 decoration-primary/30">Reimagined</span></h2>
            <p className="text-text-muted max-w-2xl mx-auto font-medium opacity-80">Experience a fusion of human creativity and AI precision. No more blank canvases, just endless possibilities.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6 text-primary" />}
              title="Multi-modal AI Input"
              description="Speak your dreams, type a prompt, or snap a photo. Our AI turns anything into a perfect lineart."
              className="md:col-span-2 border-l-4 border-l-primary"
            />
            <FeatureCard 
              icon={<MousePointer2 className="w-6 h-6 text-accent" />}
              title="Immersive Studio"
              description="Full-screen coloring with flood-fill, textures, and AI-assisted shading."
              className="border-l-4 border-l-accent"
            />
            <FeatureCard 
              icon={<Palette className="w-6 h-6 text-blue-500" />}
              title="AI Auto-Coloring"
              description="Stuck? Let the AI provide a base palette or suggest lighting for your masterpiece."
              className="border-l-4 border-l-blue-400"
            />
             <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title="AI Scoring System"
              description="Get fun feedback and 'Aura Points' based on your color harmony and precision."
              className="md:col-span-2 border-l-4 border-l-yellow-400"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-iridescent opacity-10 blur-[100px] -z-10 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={mounted ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-12 rounded-[40px] border-border-subtle shadow-sm"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to start your <span className="bg-iridescent bg-clip-text text-transparent">Chroma</span> Journey?</h2>
              <p className="text-xl text-text-muted mb-10 leading-relaxed font-medium">Join 50,000+ creators and download your first 3 AI coloring pages for free today.</p>
              <button className="bg-slate-900 dark:bg-white text-white dark:text-black text-xl font-black px-12 py-5 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary/20">
                 Claim My Free Credits
              </button>
           </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description, className }: { icon: React.ReactNode; title: string, description: string, className?: string }) {
  return (
    <div className={cn("glass-card p-8 rounded-[32px] group relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="bg-section-muted w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 font-heading text-foreground">{title}</h3>
      <p className="text-text-muted leading-relaxed font-medium opacity-80">{description}</p>
    </div>
  );
}
