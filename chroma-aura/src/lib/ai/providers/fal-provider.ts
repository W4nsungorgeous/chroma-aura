import { fal } from "@fal-ai/client";
import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

/**
 * Wraps the user's subject into a full coloring-page prompt for Flux Dev.
 * Key constraints for coloring-book UX:
 *   – closed loops   : every line must form a completely enclosed path (flood-fill requirement)
 *   – enclosed cells : numerous small interlocking sections give colorists variety
 *   – flat 2D vector : no shading, no gradients, no grayscale — pure black on white
 *   – crisp linework : uniform weight, high contrast, print-ready
 */
function buildLineartPrompt(subject: string): string {
  return (
    `Professional coloring book illustration of ${subject}. ` +
    `Clean, precise bold black line art on a pure white background, flat 2D vector style, high contrast. ` +
    `Every line forms a completely closed loop with no gaps, breaks, or open ends to enable precise flood-fill coloring. ` +
    `Intricate decorative patterns with numerous small, distinct, interlocking enclosed sections throughout. ` +
    `Smooth uniform linework, crisp sharp edges. ` +
    `Strictly no shading, no gradients, no grayscale, no cross-hatching, no color fills. ` +
    `Centered composition, subject fills the frame. Print-ready quality.`
  );
}

/**
 * Quick prompt enhancement: enriches a short user phrase with coloring-page context
 * without making an additional API call (purely local).
 */
function buildEnhancedHint(subject: string): string {
  return (
    `${subject}, intricate lineart coloring page, bold clean outlines, ` +
    `detailed decorative patterns, no shading, no color fills, black and white only, ` +
    `professional illustration, print-ready`
  );
}

export class FalProvider implements AIProvider {
  name = "fal.ai (Flux Dev)";

  constructor() {
    fal.config({
      credentials: process.env.FAL_API_KEY,
    });
  }

  async generateLineart(prompt: string): Promise<AIResponse> {
    try {
      const enhancedPrompt = buildLineartPrompt(prompt);

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
    const enhanced = buildEnhancedHint(prompt);
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