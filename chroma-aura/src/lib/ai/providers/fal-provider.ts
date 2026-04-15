import { fal } from "@fal-ai/client";
import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

/**
 * Wraps the user's subject into a full coloring-page prompt.
 * Written for Flux Dev: natural-language sentences outperform tag-soup for this model.
 * The instruction set covers:
 *   – medium & style  (clean ink line art, coloring book)
 *   – line quality    (bold uniform weight, smooth flowing strokes, crisp edges)
 *   – content rules   (no fills, no shading, no grey, no halftones)
 *   – composition     (centered, fills the frame, generous white negative space)
 *   – quality bar     (professional illustrator, print-ready)
 */
function buildLineartPrompt(subject: string): string {
  return (
    `A highly detailed coloring book page illustration of ${subject}. ` +
    `Clean, bold black ink outlines on a pure white background. ` +
    `Smooth flowing linework with intricate decorative details and elegant repeated patterns. ` +
    `Uniform line weight throughout, crisp sharp edges, no sketchy or rough marks. ` +
    `Absolutely no color fills, no grey tones, no shading, no gradients, no cross-hatching, no halftones. ` +
    `Flat monochrome line drawing only. ` +
    `Centered composition, subject fills the frame with generous white negative space inside shapes. ` +
    `Professional adult coloring book style, print-ready quality.`
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