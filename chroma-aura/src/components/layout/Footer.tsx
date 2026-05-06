"use client";

import Link from "next/link";
import { Palette, Globe, Send, Camera, Mail } from "lucide-react";
import { CATEGORIES, THEMES } from "@/data/coloring-pages";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Top 5 categories (capped to fit the column)
  const footerCategories = CATEGORIES.slice(0, 5);

  // Top 5 themes by search volume — high-traffic pSEO entry points
  const popularThemes = [...THEMES]
    .sort((a, b) => b.searchVolume - a.searchVolume)
    .slice(0, 5);

  return (
    <footer className="bg-section-muted border-t border-glass-border pt-20 pb-10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-iridescent p-2 rounded-xl">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span
                className="text-2xl font-bold font-heading bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--title-gradient)' }}
              >
                Chroma Aura
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed opacity-80">
              Empowering creators worldwide with AI-driven coloring experiences.
              From multi-modal inputs to immersive digital studios.
            </p>
            <div className="flex items-center gap-4">
               <SocialIcon icon={<Send className="w-5 h-5" />} href="#" />
               <SocialIcon icon={<Camera className="w-5 h-5" />} href="#" />
               <SocialIcon icon={<Globe className="w-5 h-5" />} href="#" />
               <SocialIcon icon={<Mail className="w-5 h-5" />} href="#" />
            </div>
          </div>

          <div>
             <h4 className="font-bold mb-6 text-foreground">Coloring Categories</h4>
             <ul className="space-y-4">
                {footerCategories.map((cat) => (
                  <li key={cat.slug}>
                    <FooterLink href={`/coloring-pages/${cat.slug}`}>{cat.title}</FooterLink>
                  </li>
                ))}
                <li>
                  <FooterLink href="/coloring-pages">
                    <span className="text-primary">Browse all →</span>
                  </FooterLink>
                </li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold mb-6 text-foreground">Popular Pages</h4>
             <ul className="space-y-4">
                {popularThemes.map((theme) => (
                  <li key={`${theme.category}/${theme.slug}`}>
                    <FooterLink href={`/coloring-pages/${theme.category}/${theme.slug}`}>
                      {theme.title}
                    </FooterLink>
                  </li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="font-bold mb-6 text-foreground">Support</h4>
             <ul className="space-y-4">
                <li><FooterLink href="/pricing">Pricing</FooterLink></li>
                <li><FooterLink href="/terms">Terms of Service</FooterLink></li>
                <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
                <li><FooterLink href="/refund">Refund Policy</FooterLink></li>
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-6 text-text-muted text-[10px] tracking-wider uppercase font-bold opacity-60">
           <p>© {currentYear} Chroma Aura AI. All rights reserved.</p>
           <div className="flex gap-8">
              <span>Made with ✨ and AI</span>
              <span>Status: Operational</span>
           </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-text-muted hover:text-primary transition-colors duration-200 block font-medium opacity-80 hover:opacity-100"
    >
      {children}
    </Link>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-text-muted hover:text-primary hover:bg-primary/5 shadow-sm"
    >
      {icon}
    </a>
  );
}
