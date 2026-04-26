import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CATEGORIES,
  findTheme,
  allThemeParams,
} from "@/data/coloring-pages";
import ColoringPageClient from "./ColoringPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromaaura.com";

interface RouteParams {
  params: Promise<{ category: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return allThemeParams();
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { category, slug } = await params;
  const theme = findTheme(category, slug);
  if (!theme) return {};

  const cat = CATEGORIES.find(c => c.slug === theme.category);
  const title = `Free Printable ${theme.title} Coloring Pages | Chroma Aura`;
  const url = `${SITE_URL}/coloring-pages/${theme.category}/${theme.slug}`;

  return {
    title,
    description: theme.metaDescription,
    keywords: [theme.primaryKeyword, ...theme.modifiers, ...theme.audiences, cat?.title ?? ""].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: theme.metaDescription,
      siteName: "Chroma Aura",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: theme.metaDescription,
    },
  };
}

export default async function Page({ params }: RouteParams) {
  const { category, slug } = await params;
  const theme = findTheme(category, slug);
  if (!theme) notFound();

  const cat = CATEGORIES.find(c => c.slug === theme.category);
  if (!cat) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: `${theme.title} Coloring Page`,
            description: theme.metaDescription,
            url: `${SITE_URL}/coloring-pages/${theme.category}/${theme.slug}`,
            keywords: theme.primaryKeyword,
            license: "https://creativecommons.org/licenses/by-nc/4.0/",
            isFamilyFriendly: true,
            audience: {
              "@type": "Audience",
              audienceType: theme.audiences.join(", "),
            },
            publisher: {
              "@type": "Organization",
              name: "Chroma Aura",
              url: SITE_URL,
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Coloring Pages", item: `${SITE_URL}/coloring-pages` },
                { "@type": "ListItem", position: 2, name: cat.title, item: `${SITE_URL}/coloring-pages/${cat.slug}` },
                { "@type": "ListItem", position: 3, name: theme.title },
              ],
            },
          }),
        }}
      />
      <ColoringPageClient theme={theme} category={cat} />
    </>
  );
}
