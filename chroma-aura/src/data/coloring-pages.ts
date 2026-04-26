/**
 * pSEO data source — programmatic SEO matrix for /coloring-pages/[category]/[slug].
 *
 * Each Theme corresponds to one statically-generated URL. Modifiers/audiences are
 * arrays so we can later expand each theme into multiple long-tail variants
 * (e.g. /coloring-pages/animals/axolotl/cute-for-kids).
 */

export type CategorySlug =
  | "pop-culture"
  | "gaming"
  | "animals"
  | "fantasy"
  | "vehicles"
  | "space"
  | "aesthetic"
  | "toys"
  | "mandalas";

export interface Category {
  slug: CategorySlug;
  title: string;
  description: string;
}

export interface Theme {
  category: CategorySlug;
  slug: string;
  title: string;
  /** Core long-tail keyword targeted by this page (lowercased, exact match). */
  primaryKeyword: string;
  /** Estimated monthly US search volume — used for prioritizing batch generation. */
  searchVolume: number;
  /** Style/attribute modifiers (drives H2 sections + future variant URLs). */
  modifiers: string[];
  /** Target audiences (drives schema.org audience + variant URLs). */
  audiences: string[];
  /** AI image-generation prompt for batch pre-rendering line art. */
  aiPrompt: string;
  /** 1-line page description for <meta name="description">. */
  metaDescription: string;
}

export const CATEGORIES: Category[] = [
  { slug: "pop-culture", title: "Pop Culture",  description: "Trending TV shows, movies, and celebrity-themed coloring pages." },
  { slug: "gaming",      title: "Gaming",        description: "Roblox, Minecraft, Pokemon and more — built for young gamers." },
  { slug: "animals",     title: "Animals",       description: "Cute and realistic animal coloring pages for every age." },
  { slug: "fantasy",     title: "Fantasy",       description: "Unicorns, mermaids, fairies and magical worlds." },
  { slug: "vehicles",    title: "Vehicles",      description: "Monster trucks, race cars, and high-action transport scenes." },
  { slug: "space",       title: "Space & STEM",  description: "Astronauts, planets, and educational space adventures." },
  { slug: "aesthetic",   title: "Aesthetic",     description: "Kawaii, cottagecore, and aesthetic-style coloring sheets." },
  { slug: "toys",        title: "Toys",          description: "Plush toys, collectibles, and merch-inspired coloring fun." },
  { slug: "mandalas",    title: "Mandalas",      description: "Detailed mandala patterns for focus and relaxation." },
];

export const THEMES: Theme[] = [
  // ─── Animals (现代流行) ─────────────────────────────────────────
  {
    category: "animals",
    slug: "cute-axolotl",
    title: "Cute Axolotl",
    primaryKeyword: "cute axolotl coloring pages for kids",
    searchVolume: 18100,
    modifiers: ["cute", "kawaii", "easy"],
    audiences: ["for kids", "for toddlers"],
    aiPrompt: "cute axolotl coloring page, simple bold outlines, kawaii style, clean line art, white background, no shading",
    metaDescription: "Free printable cute axolotl coloring pages for kids. High-quality line art ready to download as PDF and PNG.",
  },
  {
    category: "animals",
    slug: "capybara-boba",
    title: "Capybara Drinking Boba",
    primaryKeyword: "cute capybara drinking boba coloring page",
    searchVolume: 9900,
    modifiers: ["cute", "kawaii"],
    audiences: ["for kids", "for tweens"],
    aiPrompt: "cute capybara holding a boba bubble tea cup, coloring page, simple bold outlines, kawaii style, clean line art, white background",
    metaDescription: "Adorable capybara drinking boba tea coloring page. Free printable kawaii line art for kids and tweens.",
  },
  {
    category: "animals",
    slug: "realistic-t-rex",
    title: "Realistic T-Rex Dinosaur",
    primaryKeyword: "realistic t-rex dinosaur coloring pages for older boys",
    searchVolume: 8100,
    modifiers: ["realistic", "detailed"],
    audiences: ["for older boys", "for kids"],
    aiPrompt: "realistic tyrannosaurus rex dinosaur coloring page, detailed scales and muscles, anatomically accurate, fine line art, white background",
    metaDescription: "Realistic T-Rex dinosaur coloring pages for older boys. Detailed, anatomically-correct line art — free printable PDF.",
  },

  // ─── Pop Culture (TV/Movies/Celebrities) ────────────────────────
  {
    category: "pop-culture",
    slug: "bluey-family",
    title: "Bluey Family",
    primaryKeyword: "free printable bluey family coloring pages",
    searchVolume: 60500,
    modifiers: ["free", "printable"],
    audiences: ["for toddlers", "for kids"],
    aiPrompt: "Bluey blue heeler dog family cartoon coloring page, simple thick outlines, kid-friendly, clean line art, white background",
    metaDescription: "Free printable Bluey family coloring pages. Download Bluey, Bingo, Bandit and Chilli line art as PDF — perfect for toddlers.",
  },
  {
    category: "pop-culture",
    slug: "gabbys-dollhouse",
    title: "Gabby's Dollhouse Characters",
    primaryKeyword: "gabby's dollhouse characters coloring pages pdf",
    searchVolume: 33100,
    modifiers: ["cute"],
    audiences: ["for kids", "for toddlers"],
    aiPrompt: "Gabby's Dollhouse cat characters coloring page, cute kawaii style, simple bold outlines, kid-friendly line art, white background",
    metaDescription: "Gabby's Dollhouse characters coloring pages PDF. Free printable line art of Pandy Paws, MerCat, and friends.",
  },
  {
    category: "pop-culture",
    slug: "spidey-amazing-friends",
    title: "Spidey and His Amazing Friends",
    primaryKeyword: "spidey and his amazing friends coloring sheets",
    searchVolume: 22200,
    modifiers: ["easy", "simple"],
    audiences: ["for toddlers", "for kids"],
    aiPrompt: "Spidey and His Amazing Friends preschool Spider-Man coloring page, simple thick outlines, toddler-friendly, clean line art, white background",
    metaDescription: "Free Spidey and His Amazing Friends coloring sheets. Preschool-friendly Spider-Man line art — printable PDF.",
  },
  {
    category: "pop-culture",
    slug: "rubble-and-crew",
    title: "Paw Patrol Rubble and Crew",
    primaryKeyword: "simple paw patrol rubble and crew coloring pages",
    searchVolume: 14800,
    modifiers: ["simple", "easy"],
    audiences: ["for toddlers", "for kids"],
    aiPrompt: "Paw Patrol Rubble and Crew construction puppies coloring page, simple thick outlines, toddler-friendly, clean line art, white background",
    metaDescription: "Simple Paw Patrol Rubble and Crew coloring pages. Free printable construction-puppy line art for toddlers.",
  },
  {
    category: "pop-culture",
    slug: "mario-bros-movie",
    title: "Super Mario Bros Movie Characters",
    primaryKeyword: "super mario bros movie characters coloring to print",
    searchVolume: 27100,
    modifiers: ["printable"],
    audiences: ["for kids"],
    aiPrompt: "Super Mario Bros movie characters group coloring page, Mario Luigi Princess Peach Bowser, bold outlines, clean line art, white background",
    metaDescription: "Super Mario Bros movie characters coloring pages to print. Free Mario, Luigi, Peach and Bowser line art — PDF download.",
  },
  {
    category: "pop-culture",
    slug: "baby-yoda-grogu",
    title: "Baby Yoda Grogu",
    primaryKeyword: "cute baby yoda grogu coloring pages free",
    searchVolume: 49500,
    modifiers: ["cute", "free"],
    audiences: ["for kids"],
    aiPrompt: "cute Baby Yoda Grogu Star Wars coloring page, big eyes, simple bold outlines, kawaii style, clean line art, white background",
    metaDescription: "Free cute Baby Yoda Grogu coloring pages. Adorable Star Wars line art ready to print as PDF — kid-friendly.",
  },
  {
    category: "pop-culture",
    slug: "taylor-swift-eras-tour",
    title: "Taylor Swift Eras Tour",
    primaryKeyword: "taylor swift eras tour coloring pages for tweens",
    searchVolume: 12100,
    modifiers: ["aesthetic"],
    audiences: ["for tweens", "for adults"],
    aiPrompt: "Taylor Swift Eras Tour stage performance coloring page, microphone and sparkly outfit, fashion line art, fine details, white background",
    metaDescription: "Taylor Swift Eras Tour coloring pages for tweens. Free printable Swiftie-themed line art — PDF & PNG download.",
  },

  // ─── Gaming ────────────────────────────────────────────────────
  {
    category: "gaming",
    slug: "roblox-adopt-me",
    title: "Roblox Adopt Me Pets",
    primaryKeyword: "roblox adopt me pets coloring pages printable",
    searchVolume: 40500,
    modifiers: ["printable", "cute"],
    audiences: ["for kids", "for tweens"],
    aiPrompt: "Roblox Adopt Me virtual pet coloring page, blocky cute pet character, simple outlines, clean line art, white background",
    metaDescription: "Free printable Roblox Adopt Me pets coloring pages. Cute virtual pet line art — PDF download for kids and tweens.",
  },
  {
    category: "gaming",
    slug: "minecraft-creeper-axolotl",
    title: "Minecraft Creeper and Axolotl",
    primaryKeyword: "minecraft creeper and axolotl coloring pages",
    searchVolume: 14800,
    modifiers: ["pixelated"],
    audiences: ["for kids"],
    aiPrompt: "Minecraft creeper and axolotl pixelated voxel block style coloring page, square outlines, clean line art, white background",
    metaDescription: "Minecraft Creeper and Axolotl coloring pages. Free printable pixelated block-style line art for young gamers.",
  },
  {
    category: "gaming",
    slug: "pokemon-sv-starters",
    title: "Pokemon Scarlet & Violet Starters",
    primaryKeyword: "pokemon sv starter pokemon coloring pages",
    searchVolume: 6600,
    modifiers: ["cute"],
    audiences: ["for kids", "for tweens"],
    aiPrompt: "Pokemon Scarlet Violet starter trio Sprigatito Fuecoco Quaxly coloring page, cute character line art, clean outlines, white background",
    metaDescription: "Pokemon Scarlet & Violet starter Pokemon coloring pages. Sprigatito, Fuecoco, Quaxly free printable line art.",
  },

  // ─── Toys ──────────────────────────────────────────────────────
  {
    category: "toys",
    slug: "squishmallow",
    title: "Squishmallow",
    primaryKeyword: "easy squishmallow coloring pages for toddlers",
    searchVolume: 22200,
    modifiers: ["easy", "cute", "kawaii"],
    audiences: ["for toddlers", "for kids"],
    aiPrompt: "Squishmallow plush toy coloring page, round chubby cute character, simple thick outlines, kawaii style, clean line art, white background",
    metaDescription: "Easy Squishmallow coloring pages for toddlers. Free printable cute plushie line art — chunky outlines, toddler-friendly.",
  },

  // ─── Aesthetic ─────────────────────────────────────────────────
  {
    category: "aesthetic",
    slug: "kawaii-food-drinks",
    title: "Kawaii Food and Drinks",
    primaryKeyword: "kawaii aesthetic food and drinks coloring pages",
    searchVolume: 14800,
    modifiers: ["kawaii", "aesthetic", "cute"],
    audiences: ["for kids", "for tweens", "for adults"],
    aiPrompt: "kawaii aesthetic food and drinks set, cute sushi boba donut ice cream with smiley faces, coloring page, simple outlines, clean line art, white background",
    metaDescription: "Kawaii aesthetic food and drinks coloring pages. Free printable cute sushi, boba, donut and ice cream line art.",
  },

  // ─── Fantasy ───────────────────────────────────────────────────
  {
    category: "fantasy",
    slug: "unicorn-mermaid-princess",
    title: "Unicorn Mermaid Princess",
    primaryKeyword: "unicorn mermaid princess coloring pages pdf",
    searchVolume: 18100,
    modifiers: ["cute", "magical"],
    audiences: ["for kids", "for toddlers"],
    aiPrompt: "unicorn mermaid princess fantasy coloring page, magical underwater scene with stars and shells, fine line art, white background",
    metaDescription: "Unicorn mermaid princess coloring pages PDF. Free printable magical fantasy line art combining all three girl-favorite themes.",
  },
  {
    category: "fantasy",
    slug: "fairy-mushroom-house",
    title: "Fairy Mushroom House",
    primaryKeyword: "cute fairy mushroom house coloring pages",
    searchVolume: 5400,
    modifiers: ["cute", "cottagecore", "detailed"],
    audiences: ["for kids", "for tweens", "for adults"],
    aiPrompt: "cute fairy mushroom cottage house in a forest, cottagecore aesthetic coloring page, detailed whimsical line art, white background",
    metaDescription: "Cute fairy mushroom house coloring pages. Free printable cottagecore line art — whimsical and detailed for all ages.",
  },

  // ─── Vehicles ──────────────────────────────────────────────────
  {
    category: "vehicles",
    slug: "monster-truck-grave-digger",
    title: "Monster Truck Grave Digger",
    primaryKeyword: "monster trucks grave digger coloring pages",
    searchVolume: 9900,
    modifiers: ["detailed", "realistic"],
    audiences: ["for kids", "for older boys"],
    aiPrompt: "Grave Digger monster truck with giant tires crushing cars, action coloring page, detailed bold outlines, clean line art, white background",
    metaDescription: "Monster Truck Grave Digger coloring pages. Free printable action-packed line art — detailed and bold for big-truck fans.",
  },

  // ─── Space ─────────────────────────────────────────────────────
  {
    category: "space",
    slug: "astronaut-planets",
    title: "Astronaut in Space with Planets",
    primaryKeyword: "astronaut in space with planets coloring sheet",
    searchVolume: 8100,
    modifiers: ["educational", "detailed"],
    audiences: ["for kids"],
    aiPrompt: "astronaut floating in space with all eight planets of solar system, educational STEM coloring page, clean line art, white background",
    metaDescription: "Astronaut in space with planets coloring sheet. Free printable STEM line art featuring all 8 planets — perfect for classrooms.",
  },

  // ─── Mandalas ──────────────────────────────────────────────────
  {
    category: "mandalas",
    slug: "mandala-animals",
    title: "Detailed Mandala Animals",
    primaryKeyword: "detailed mandala animal coloring pages for kids",
    searchVolume: 12100,
    modifiers: ["detailed", "intricate"],
    audiences: ["for kids", "for tweens", "for adults"],
    aiPrompt: "detailed mandala animal coloring page, lion or elephant outline filled with intricate mandala patterns, fine line art, white background",
    metaDescription: "Detailed mandala animal coloring pages for kids. Free printable intricate line art combining mandala patterns with animal silhouettes.",
  },
];

/** Lookup by composite key for getStaticParams + dynamic route. */
export function findTheme(category: string, slug: string): Theme | undefined {
  return THEMES.find(t => t.category === category && t.slug === slug);
}

/** All static params for generateStaticParams(). */
export function allThemeParams(): Array<{ category: string; slug: string }> {
  return THEMES.map(t => ({ category: t.category, slug: t.slug }));
}

/** Themes within a category, sorted by search volume desc — for category landing pages. */
export function themesByCategory(category: CategorySlug): Theme[] {
  return THEMES
    .filter(t => t.category === category)
    .sort((a, b) => b.searchVolume - a.searchVolume);
}
