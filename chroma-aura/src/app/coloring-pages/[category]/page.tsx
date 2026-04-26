import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  CATEGORIES,
  CategorySlug,
  themesByCategory,
} from "@/data/coloring-pages";
import { ArrowRight, Sparkles } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromaaura.com";

interface RouteParams {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find(c => c.slug === category);
  if (!cat) return {};

  const url = `${SITE_URL}/coloring-pages/${cat.slug}`;
  const title = `${cat.title} Coloring Pages — Free Printable | Chroma Aura`;

  return {
    title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: cat.description,
      siteName: "Chroma Aura",
    },
    twitter: { card: "summary_large_image", title, description: cat.description },
  };
}

export default async function CategoryIndex({ params }: RouteParams) {
  const { category } = await params;
  const cat = CATEGORIES.find(c => c.slug === category);
  if (!cat) notFound();

  const themes = themesByCategory(cat.slug as CategorySlug);

  return (
    <main className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />

      <section className="container mx-auto px-6 max-w-7xl flex-1 pb-20">
        <nav className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6">
          <Link href="/coloring-pages" className="hover:underline">Coloring Pages</Link>
          <span>/</span>
          <span className="text-white/50">{cat.title}</span>
        </nav>

        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> {cat.title}
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter mb-6">
            Free <span className="text-primary">{cat.title}</span> Coloring Pages
          </h1>
          <p className="text-xl text-white/60 leading-relaxed">{cat.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map(theme => (
            <Link
              key={theme.slug}
              href={`/coloring-pages/${theme.category}/${theme.slug}`}
              className="group glass rounded-3xl p-6 border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 shadow-xl"
            >
              <div className="aspect-[3/4] rounded-2xl bg-white/5 mb-5 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white/10 group-hover:text-primary/40 transition-colors" />
              </div>
              <h2 className="text-lg font-bold font-heading leading-tight mb-2 group-hover:text-primary transition-colors">
                {theme.title}
              </h2>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {theme.modifiers.slice(0, 2).map(m => (
                  <span key={m} className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full bg-white/5 text-white/50">
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 truncate">{theme.audiences[0]}</span>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
