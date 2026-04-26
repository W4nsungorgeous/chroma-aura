"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Sparkles, Download, Printer, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Theme, Category } from "@/data/coloring-pages";

interface Props {
  theme: Theme;
  category: Category;
}

export default function ColoringPageClient({ theme, category }: Props) {
  return (
    <main className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />

      <section className="container mx-auto px-6 max-w-7xl flex-1 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Preview & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 sticky top-32"
          >
            <div className="glass rounded-[40px] overflow-hidden p-6 border-white/10 group shadow-2xl">
              <div className="aspect-[3/4] rounded-3xl bg-white relative overflow-hidden flex items-center justify-center p-12">
                <div className="w-full h-full border-2 border-black/5 rounded-2xl border-dashed flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-black/10 animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
                <Printer className="w-5 h-5" />
                Print PDF (Free)
              </button>
              <button className="flex-1 glass py-5 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all">
                <Download className="w-5 h-5" />
                Download PNG
              </button>
            </div>

            <div className="glass p-6 rounded-3xl border-white/10 flex items-center justify-between text-white/50 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> CC BY-NC 4.0 License
              </div>
              <div>HD Resolution • 300 DPI</div>
            </div>
          </motion.div>

          {/* Right: Content & pSEO Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div>
              <nav className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                <Link href="/coloring-pages" className="hover:underline">Coloring Pages</Link>
                <span>/</span>
                <Link href={`/coloring-pages/${category.slug}`} className="hover:underline">{category.title}</Link>
              </nav>
              <h1 className="text-5xl md:text-6xl font-black font-heading leading-tight mb-8 tracking-tighter">
                Free Printable <span className="text-primary">{theme.title}</span> Coloring Page
              </h1>
              <p className="text-xl text-white/60 leading-relaxed">
                Download and print our high-quality <span className="font-bold text-white/80">{theme.title}</span> coloring sheet.
                Perfect for {theme.audiences.join(", ")}, educational activities, and art lovers. Generated with AI for maximum unique detail.
              </p>
            </div>

            <div className="space-y-8 glass p-10 rounded-[40px] border-white/5 shadow-xl transition-shadow hover:shadow-primary/5">
              <h2 className="text-3xl font-bold font-heading">About this {category.title} Artwork</h2>
              <p className="text-white/50 leading-loose">
                This artwork was crafted using our proprietary <span className="text-primary font-bold">Chroma Neural Engine</span>.
                It features intricate patterns typical of the <span className="text-accent font-bold italic">{theme.title} style</span>,
                offering a relaxing experience for both beginners and advanced artists.
              </p>
              <ul className="grid grid-cols-2 gap-6 text-sm">
                <li className="flex flex-col gap-2">
                  <span className="text-white/30 uppercase tracking-widest font-bold text-[10px]">Style</span>
                  <span className="font-bold text-white/90">{theme.modifiers.join(" · ")}</span>
                </li>
                <li className="flex flex-col gap-2">
                  <span className="text-white/30 uppercase tracking-widest font-bold text-[10px]">Audience</span>
                  <span className="font-bold text-white/90">{theme.audiences[0]}</span>
                </li>
                <li className="flex flex-col gap-2">
                  <span className="text-white/30 uppercase tracking-widest font-bold text-[10px]">Estimated Time</span>
                  <span className="font-bold text-white/90">45 - 90 Minutes</span>
                </li>
                <li className="flex flex-col gap-2">
                  <span className="text-white/30 uppercase tracking-widest font-bold text-[10px]">File Format</span>
                  <span className="font-bold text-white/90">Vector PDF & PNG</span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold font-heading">How to get the best coloring results?</h3>
              <div className="grid gap-4">
                <StepCard number="1" text="Print on high-quality 200gsm cardstock for the best texture." />
                <StepCard number="2" text="Use fine-liner pens for the intricate internal patterns." />
                <StepCard number="3" text="Download our 4K version by upgrading to Pro for more detail." />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function StepCard({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-6 glass-card p-6 rounded-3xl border-white/5">
      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
        {number}
      </div>
      <p className="text-white/70 font-medium leading-snug">{text}</p>
    </div>
  );
}
