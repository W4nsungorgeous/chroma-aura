import { Compass } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-32">
        <div className="glass-card p-12 rounded-[40px] border border-border-subtle shadow-xl max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <Compass className="w-8 h-8 text-primary" />
          </div>

          <p className="text-8xl font-black text-foreground/10 font-heading leading-none mb-4 select-none">
            404
          </p>

          <h1 className="text-3xl font-bold font-heading text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-text-muted mb-10 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/studio"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Open Studio
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 border border-border-subtle text-foreground font-bold text-sm hover:bg-foreground/10 active:scale-95 transition-all"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
