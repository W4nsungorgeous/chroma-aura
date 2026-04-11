"use client";

import Link from "next/link";
import { Palette, Globe, Send, Camera, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    { name: "Animals", slug: "animals" },
    { name: "Mandala", slug: "mandala" },
    { name: "Fantasy", slug: "fantasy" },
    { name: "Space", slug: "space" },
    { name: "Flowers", slug: "flowers" },
  ];

  const styles = [
    { name: "Cute Anime", slug: "cute-anime" },
    { name: "Detailed Lineart", slug: "detailed-lineart" },
    { name: "Minimalist", slug: "minimalist" },
    { name: "Pop Art", slug: "pop-art" },
  ];

  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-iridescent p-2 rounded-xl">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-heading">Chroma Aura</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
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
             <h4 className="font-bold mb-6 text-white/90">Coloring Categories</h4>
             <ul className="space-y-4">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <FooterLink href={`/coloring-pages/${cat.slug}`}>{cat.name}</FooterLink>
                  </li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="font-bold mb-6 text-white/90">Popular Styles</h4>
             <ul className="space-y-4">
                {styles.map((style) => (
                  <li key={style.slug}>
                    <FooterLink href={`/coloring-pages/style/${style.slug}`}>{style.name}</FooterLink>
                  </li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="font-bold mb-6 text-white/90">Support</h4>
             <ul className="space-y-4">
                <li><FooterLink href="/pricing">Pricing</FooterLink></li>
                <li><FooterLink href="/about">About Us</FooterLink></li>
                <li><FooterLink href="/terms">Terms of Service</FooterLink></li>
                <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-white/30 text-xs tracking-wider uppercase font-medium">
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
      className="text-white/40 hover:text-primary transition-colors duration-200 block"
    >
      {children}
    </Link>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode; href: string }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all text-white/60 hover:text-white"
    >
      {icon}
    </a>
  );
}
