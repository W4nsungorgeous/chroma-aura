"use client";

import { useUser, SignOutButton, useClerk } from "@clerk/nextjs";
import { useQuota } from "@/hooks/useQuota";
import { 
  User, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  LogOut, 
  ChevronDown,
  Zap,
  Star,
  Diamond
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { tier, generationQuota, expiresAt } = useQuota();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted || !isLoaded || !user) return null;

  const planInfo = {
    guest: { label: "Free Guest", icon: <Zap className="w-4 h-4 text-yellow-500" />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    member: { label: "Creative Pro", icon: <Star className="w-4 h-4 text-primary" />, color: "text-primary", bg: "bg-primary/10" },
    vip: { label: "VIP Artist", icon: <Diamond className="w-4 h-4 text-accent" />, color: "text-accent", bg: "bg-accent/10" },
  }[tier] || { label: tier, icon: <Sparkles className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group active:scale-95"
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-shadow border-2 border-transparent group-hover:border-primary/20">
          <img
            src={user.imageUrl}
            alt={user.fullName || "User"}
            className="w-full h-full object-cover"
          />
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="absolute right-0 mt-4 w-72 bg-background border border-border-subtle rounded-3xl overflow-hidden shadow-2xl z-50 p-2 origin-top-right"
          >
            {/* Header / Profile section */}
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-inner">
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-slate-800 truncate">{user.fullName}</h4>
                <p className="text-xs text-slate-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>

            <div className="mx-2 mb-2 p-4 rounded-2xl bg-section-muted border border-border-subtle space-y-4">
              {/* Plan Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Plan</span>
                </div>
                <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm", planInfo.bg, planInfo.color)}>
                  {planInfo.icon}
                  {planInfo.label}
                </div>
              </div>

              {/* Credits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {generationQuota.remaining} / {generationQuota.limit}
                  </span>
                </div>
                {/* Credit Bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(generationQuota.remaining / generationQuota.limit) * 100}%` }}
                    className="h-full bg-iridescent rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  />
                </div>
              </div>

              {/* Expiration */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</span>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString() : (tier === "guest" ? "1 Day" : "Permanent")}
                </span>
              </div>
            </div>

            <div className="p-2 border-t border-slate-100/50 space-y-1">
              <button 
                onClick={() => {
                  openUserProfile();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:text-primary hover:bg-primary/5 transition-all font-medium text-sm cursor-pointer group/manage"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover/manage:bg-primary/10 flex items-center justify-center transition-colors">
                  <User className="w-4 h-4" />
                </div>
                Manage Account
              </button>

              <SignOutButton>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all font-medium text-sm cursor-pointer group/logout">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover/logout:bg-red-100 flex items-center justify-center transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
