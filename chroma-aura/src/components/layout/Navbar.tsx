"use client";

import Link from "next/link";
import { Sparkles, Palette, Library, User, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-300",
        isScrolled ? "top-2" : "top-6"
      )}
    >
      <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between border-white/10 shadow-2xl overflow-hidden relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-50 blur-xl -z-10 animate-pulse" />
        
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-iridescent p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Chroma Aura
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/studio" icon={<Sparkles className="w-4 h-4" />} label="Studio" />
          <NavLink href="/gallery" icon={<Library className="w-4 h-4" />} label="Gallery" />
          <NavLink href="/pricing" icon={<Sparkles className="w-4 h-4" />} label="Pricing" />
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
            <User className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button className="bg-iridescent px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            Get Started
          </button>
          <button className="md:hidden p-2 text-white/70 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors relative group"
    >
      {icon}
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
    </Link>
  );
}
