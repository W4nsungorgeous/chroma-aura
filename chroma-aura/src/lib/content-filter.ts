export interface FilterResult {
  allowed: boolean;
  reason?: string;
}

// Short terms requiring whole-word match (avoids "class"→"ass", "Essex"→"sex")
const BLOCKED_WORDS: string[] = [
  // Sexual
  "porn", "porno", "xxx", "nude", "naked", "nudity",
  "sex", "rape", "erotic", "hentai", "ecchi", "ahegao",
  "lolicon", "shotacon", "fetish", "bdsm", "bondage",
  "penis", "vagina", "vulva", "anus", "rectum", "nipple", "nipples",
  // Violence
  "gore", "gory", "snuff",
  // Drugs
  "cocaine", "heroin", "meth",
];

// Longer terms matched as substrings (catches inflections & compounds)
const BLOCKED_SUBSTRINGS: string[] = [
  "pornograph", "masturbat", "ejaculat", "orgasm",
  "intercourse", "genital", "dominatrix", "submissive",
  "molestat", "nsfw",
  "decapitat", "dismember", "mutilat",
  "methamphetamine", "crystal meth",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pre-compile all regex patterns at module load time (not on every filterPrompt call)
const BLOCKED_WORD_PATTERNS = BLOCKED_WORDS.map(
  (word) => new RegExp(`\\b${escapeRegex(word)}\\b`)
);

export function filterPrompt(prompt: string): FilterResult {
  const trimmed = prompt.trim();

  if (trimmed.length < 2) {
    return { allowed: false, reason: "Prompt is too short." };
  }
  if (trimmed.length > 500) {
    return { allowed: false, reason: "Prompt exceeds 500 characters." };
  }

  const lower = trimmed.toLowerCase();

  for (const pattern of BLOCKED_WORD_PATTERNS) {
    if (pattern.test(lower)) {
      return { allowed: false, reason: "Your prompt contains content that violates our content policy." };
    }
  }

  for (const sub of BLOCKED_SUBSTRINGS) {
    if (lower.includes(sub)) {
      return { allowed: false, reason: "Your prompt contains content that violates our content policy." };
    }
  }

  return { allowed: true };
}
