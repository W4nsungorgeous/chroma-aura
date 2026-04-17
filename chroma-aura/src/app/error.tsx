"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="glass-card p-12 rounded-[40px] border border-border-subtle shadow-xl max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>

          <h1 className="text-3xl font-bold font-heading text-foreground mb-3">
            Something went wrong
          </h1>
          <p className="text-text-muted mb-2 leading-relaxed">
            An unexpected error occurred. It&apos;s not you — we&apos;ve logged it and will look into it.
          </p>
          {error.digest && (
            <p className="text-xs text-text-muted/50 font-mono mb-8">
              Error ID: {error.digest}
            </p>
          )}
          {!error.digest && <div className="mb-8" />}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 border border-border-subtle text-foreground font-bold text-sm hover:bg-foreground/10 active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
