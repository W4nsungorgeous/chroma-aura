import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Using system fonts to bypass Turbopack font resolution bug
const inter = { variable: "--font-inter" };
const outfit = { variable: "--font-outfit" };

export const metadata: Metadata = {
  title: "Chroma Aura | AI Multi-modal Coloring & Storybook Platform",
  description: "Experience the next generation of creativity. Generate line art from voice, text, or photos and color them in an immersive AI-powered studio.",
  keywords: ["AI coloring", "AI storybook", "digital coloring book", "creative AI", "kids AI", "coloring pages"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
