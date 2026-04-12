import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Using system fonts to bypass Turbopack font resolution bug
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Chroma Aura | AI Multi-modal Coloring & Storybook Platform",
  description: "Experience the next generation of creativity. Generate line art from voice, text, or photos and color them in an immersive AI-powered studio.",
  keywords: ["AI coloring", "AI storybook", "digital coloring book", "creative AI", "kids AI", "coloring pages"],
};

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClerkProvider>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
