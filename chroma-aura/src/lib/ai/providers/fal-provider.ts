import { fal } from "@fal-ai/client";
import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

const LINEART_MODIFIERS = [
  "black and white lineart",
  "coloring book style",
  "sharp clean outlines",
  "no shading",
  "no color fill",
  "white background",
  "bold strokes",
  "professional illustration",
];

export class FalProvider implements AIProvider {
  name = "fal.ai (Flux Dev)";

  constructor() {
    fal.config({
      credentials: process.env.FAL_API_KEY,
    });
  }

  async generateLineart(prompt: string): Promise<AIResponse> {
    try {
      const enhancedPrompt = `${prompt}, ${LINEART_MODIFIERS.join(", ")}`;

      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: enhancedPrompt,
          image_size: "square_hd",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        },
      });

      const imageUrl = (result.data as any)?.images?.[0]?.url;
      if (!imageUrl) {
        return { success: false, error: "No image returned from fal.ai", imageUrl: "" };
      }

      return {
        imageUrl,
        revisedPrompt: enhancedPrompt,
        success: true,
      };
    } catch (error) {
      console.error("[FalProvider] generateLineart error:", error);
      return { success: false, error: String(error), imageUrl: "" };
    }
  }

  async enhancePrompt(prompt: string): Promise<EnhanceResponse> {
    const enhanced = `${prompt}, ${LINEART_MODIFIERS.slice(0, 4).join(", ")}, intricate details, perfect for coloring`;
    return { enhanced, success: true };
  }

  async autoColor(imageUrl: string): Promise<AIResponse> {
    try {
      const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
          image_url: imageUrl,
          prompt: "beautifully colored, vibrant harmonious colors, professional digital art, soft shading",
          strength: 0.7,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        },
      });

      const resultImageUrl = (result.data as any)?.images?.[0]?.url;
      if (!resultImageUrl) {
        return { success: false, error: "No image returned from fal.ai", imageUrl: "" };
      }

      return { imageUrl: resultImageUrl, success: true };
    } catch (error) {
      console.error("[FalProvider] autoColor error:", error);
      return { success: false, error: String(error), imageUrl: "" };
    }
  }
}