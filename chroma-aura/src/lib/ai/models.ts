/**
 * Registry of user-selectable image-generation models.
 *
 * `provider` decides which backend handles the request:
 *   - "fal":    routed through FalProvider with the given `endpoint`
 *   - "openai": routed through OpenAIProvider (gpt-image-1)
 *
 * Adding a new fal model = add an entry. Adding a non-fal provider = add a new
 * branch in bridge.ts and a new provider file under providers/.
 */

export type ModelId =
  | "gpt-image-2"
  | "nano-banana-2"
  | "nano-banana-pro"
  | "flux-2-pro"
  | "seedream-v4-5"
  | "flux-2-turbo"
  | "flux-1-schnell";

export interface ModelConfig {
  id: ModelId;
  label: string;
  description: string;
  provider: "fal" | "openai";
  /** fal endpoint slug, only used when provider === "fal" */
  endpoint?: string;
  emoji: string;
  cost: number;
  isNew?: boolean;
}

export const MODELS: ModelConfig[] = [
  {
    id: "flux-2-turbo",
    label: "Flux 2 Turbo",
    description: "Fast high-quality output",
    provider: "fal",
    endpoint: "fal-ai/flux-2/turbo",
    emoji: "🚀",
    cost: 1,
  },
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    description: "OpenAI GPT Image 2 Model",
    provider: "fal",
    endpoint: "openai/gpt-image-2",
    emoji: "🤖",
    cost: 12,
    isNew: true,
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    description: "Fast optimized image generation",
    provider: "fal",
    endpoint: "fal-ai/nano-banana-2",
    emoji: "🍌",
    cost: 5,
  },
  {
    id: "flux-1-schnell",
    label: "Flux 1 Schnell",
    description: "Fastest 4-step inference",
    provider: "fal",
    endpoint: "fal-ai/flux-1/schnell",
    emoji: "🏎️",
    cost: 1,
  },
  {
    id: "seedream-v4-5",
    label: "Seedream V4.5",
    description: "High-fidelity generation",
    provider: "fal",
    endpoint: "seedream/v4.5",
    emoji: "✨",
    cost: 3,
  },
  {
    id: "flux-2-pro",
    label: "Flux 2 Pro",
    description: "Professional visual quality",
    provider: "fal",
    endpoint: "fal-ai/flux-2-pro",
    emoji: "💎",
    cost: 2,
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "High quality image generation",
    provider: "fal",
    endpoint: "fal-ai/nano-banana-pro",
    emoji: "🍌",
    cost: 8,
  },

];

export const DEFAULT_MODEL: ModelId = "flux-2-turbo";

export function getModel(id: string | undefined): ModelConfig {
  return MODELS.find((m) => m.id === id) ?? MODELS.find((m) => m.id === DEFAULT_MODEL)!;
}
