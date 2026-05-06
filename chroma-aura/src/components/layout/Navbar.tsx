"use client";

import Link from "next/link";
import { Sparkles, Palette, Library, User, Menu, ChevronDown, ArrowRight, LayoutGrid } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import UserMenu from "@/components/ui/UserMenu";
import { CATEGORIES, themesByCategory } from "@/data/coloring-pages";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
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
      <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between border-glass-border shadow-2xl relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-30 blur-xl -z-10 animate-pulse" />

        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-iridescent p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <span
            className="text-2xl font-bold font-heading bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--title-gradient)' }}
          >
            Chroma Aura
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/studio" icon={<Sparkles className="w-4 h-4" />} label="Studio" />
          <NavLink href="/gallery" icon={<Library className="w-4 h-4" />} label="Gallery" />
          <CategoriesDropdown />
          <NavLink href="/pricing" icon={<Sparkles className="w-4 h-4" />} label="Pricing" />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="flex items-center gap-4 min-w-[100px] justify-end">
            {!isLoaded ? (
              <div className="flex items-center gap-2 p-1">
                <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
              </div>
            ) : isSignedIn ? (
              <UserMenu />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95">
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-iridescent px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer transition-all">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-600 hover:text-primary cursor-pointer active:scale-95 transition-all">
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
      className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors relative group"
    >
      {icon}
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
    </Link>
  );
}

function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Brief close delay so brushing the cursor between trigger and menu doesn't dismiss it
  const handleEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href="/coloring-pages"
        className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors relative group"
      >
        <LayoutGrid className="w-4 h-4" />
        Categories
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
      </Link>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4">
          <div className="w-[420px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map(cat => {
                const count = themesByCategory(cat.slug).length;
                return (
                  <Link
                    key={cat.slug}
                    href={`/coloring-pages/${cat.slug}`}
                    className="group/item flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 group-hover/item:text-primary transition-colors truncate">
                        {cat.title}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {count} {count === 1 ? "page" : "pages"}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
            <Link
              href="/coloring-pages"
              className="block mt-2 px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-center text-xs font-bold uppercase tracking-widest text-primary transition-colors"
            >
              Browse all coloring pages →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
