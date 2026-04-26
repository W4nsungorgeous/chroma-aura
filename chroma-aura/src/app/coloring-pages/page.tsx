import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CATEGORIES, themesByCategory } from "@/data/coloring-pages";
import { Sparkles, ArrowRight } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromaaura.com";

export const metadata: Metadata = {
  title: "Free Printable Coloring Pages — AI-Generated Line Art | Chroma Aura",
  description:
    "Browse hundreds of free printable coloring pages — AI-generated line art across animals, fantasy, gaming, pop culture, mandalas and more. PDF & PNG download.",
  alternates: { canonical: `${SITE_URL}/coloring-pages` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/coloring-pages`,
    title: "Free Printable Coloring Pages | Chroma Aura",
    description:
      "Browse hundreds of free printable coloring pages — AI-generated line art across every category.",
    siteName: "Chroma Aura",
  },
};

export default function ColoringPagesIndex() {
  return (
    <main className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />

      <section className="container mx-auto px-6 max-w-7xl flex-1 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Free Printable Library
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter mb-6">
            Coloring Pages for Every <span className="text-primary">Imagination</span>
          </h1>
          <p className="text-xl text-white/60 leading-relaxed">
            AI-generated line art ready to print. Pick a category to start exploring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => {
            const themes = themesByCategory(cat.slug);
            const top = themes[0];
            return (
              <Link
                key={cat.slug}
                href={`/coloring-pages/${cat.slug}`}
                className="group glass rounded-3xl p-8 border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 shadow-xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold font-heading">{cat.title}</h2>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-6 min-h-[3rem]">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 uppercase tracking-widest font-bold">
                    {themes.length} {themes.length === 1 ? "page" : "pages"}
                  </span>
                  {top && (
                    <span className="text-primary font-bold truncate ml-3">
                      Top: {top.title}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
