import { fal } from "@fal-ai/client";
import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

/**
 * Wraps the user's subject into a full coloring-page prompt for Flux Dev.
 * Key constraints for coloring-book UX:
 *   – closed loops      : every outline must be a fully sealed path (flood-fill requirement)
 *   – maximum cells     : decompose every large shape into as many small enclosed sub-regions as
 *                         aesthetically possible — the more independently-colorable areas the better
 *   – micro-detail      : fine interior lines, filigree, scales, petals, tiles, geometric lattices
 *                         all subdivide large shapes into distinct cells without looking cluttered
 *   – structural beauty : density of cells must serve the composition, not fight it — patterns
 *                         should feel intentional and decorative, not random
 *   – flat B&W          : no shading, no gradients, no halftones — pure black on white
 */
function buildLineartPrompt(subject: string): string {
  return (
    `A highly detailed coloring book page illustration of ${subject}. ` +
    `Clean, bold black ink outlines on a pure white background. ` +
    `Smooth flowing linework with intricate decorative details and elegant repeated patterns. ` +
    `Uniform line weight throughout, crisp sharp edges, no sketchy or rough marks. ` +

    // ── Closed-loop constraint (flood-fill requirement) ──────────────────────
    `Every single outline must form a perfectly closed loop with absolutely zero gaps or open ends — ` +
    `each enclosed region must be fully sealed so it can be flood-filled independently with a single tap. ` +

    // ── Maximum enclosed regions (core coloring-book quality metric) ─────────
    `Decompose the entire composition into the maximum possible number of small, distinct, ` +
    `independently-colorable enclosed cells. ` +
    `Break every large shape into many smaller sub-regions using decorative interior lines: ` +
    `add fine filigree, repeating geometric lattices, organic petal subdivisions, scale patterns, ` +
    `tile mosaics, leaf venation, feather barbs, architectural brickwork, or any other motif ` +
    `that naturally fits the subject — so that coloring each cell feels rewarding and purposeful. ` +
    `No large region should remain as a single undivided white area; ` +
    `every surface must be richly subdivided into a mosaic of closed shapes. ` +

    // ── Aesthetic balance ────────────────────────────────────────────────────
    `The density of enclosed regions must enhance the visual beauty of the composition — ` +
    `patterns should look intentional, harmonious, and decorative, never random or chaotic. ` +
    `Aim for the intricate detail level of high-quality adult coloring books or zentangle art. ` +

    // ── Flat monochrome requirement ──────────────────────────────────────────
    `Absolutely no color fills, no grey tones, no shading, no gradients, no cross-hatching, no halftones. ` +
    `Flat monochrome line drawing only. ` +
    `Centered composition, subject fills the frame. ` +
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
    `maximum enclosed regions, every surface subdivided into many small colorable cells, ` +
    `filigree interior patterns, geometric lattice details, zentangle-style decomposition, ` +
    `all outlines fully closed, no shading, no color fills, black and white only, ` +
    `professional adult coloring book illustration, print-ready`
  );
}

export class FalProvider implements AIProvider {
  name = "fal.ai (Flux Dev)";

  constructor() {
    fal.config({
      credentials: process.env.FAL_API_KEY,
    });
  }

  async generateLineart(prompt: string, endpoint = "fal-ai/flux/dev"): Promise<AIResponse> {
    try {
      const enhancedPrompt = buildLineartPrompt(prompt);

      // Per-endpoint input shapes — Flux variants and Nano Banana take slightly different params.
      const input = this.buildInput(endpoint, enhancedPrompt);

      const result = await fal.subscribe(endpoint, { input });

      const imageUrl = (result.data as any)?.images?.[0]?.url;
      if (!imageUrl) {
        return { success: false, error: `No image returned from ${endpoint}`, imageUrl: "" };
      }

      return {
        imageUrl,
        revisedPrompt: enhancedPrompt,
        success: true,
      };
    } catch (error) {
      console.error(`[FalProvider] generateLineart error (${endpoint}):`, error);
      return { success: false, error: String(error), imageUrl: "" };
    }
  }

  private buildInput(endpoint: string, prompt: string): Record<string, unknown> {
    const input: Record<string, unknown> = { prompt };

    if (endpoint.includes("schnell") || endpoint.includes("turbo")) {
      input.image_size = "square_hd";
      input.num_inference_steps = 4;
      input.num_images = 1;
      input.enable_safety_checker = true;
    } else if (endpoint.includes("flux-pro") || endpoint.includes("flux-2-pro")) {
      input.image_size = "square_hd";
      input.num_images = 1;
      input.enable_safety_checker = true;
      input.safety_tolerance = "3";
    } else if (endpoint.includes("nano-banana")) {
      input.num_images = 1;
    } else if (endpoint.includes("seedream")) {
      input.image_size = "square_hd";
      input.num_images = 1;
    } else if (endpoint.includes("openai/")) {
      input.image_size = "square_hd";
      input.num_images = 1;
    } else {
      input.image_size = "square_hd";
      input.num_images = 1;
      input.enable_safety_checker = true;
    }

    return input;
  }

  async enhancePrompt(prompt: string): Promise<EnhanceResponse> {
    const enhanced = buildEnhancedHint(prompt);
    return { enhanced, success: true };
  }

  async autoColor(imageUrl: string): Promise<AIResponse> {
    try {
      // flux-pro/kontext is an image-editing model: it reads the input image and applies
      // text instructions directly, preserving composition without a strength/noise tradeoff.
      const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          image_url: imageUrl,
          prompt:
            "Color this black-and-white coloring book page with vibrant, harmonious colors. " +
            "Fill every enclosed white region with a distinct, beautiful color. " +
            "Keep every black ink outline exactly as-is — all lines must remain crisp, dark, and fully intact. " +
            "Use a rich, saturated palette with gentle shading inside each region. " +
            "Do not add any new elements, do not remove any outlines, do not change the composition in any way. " +
            "The result should look like a professionally hand-colored version of this exact coloring page.",
          guidance_scale: 4.0,
          num_images: 1,
          output_format: "png",
          enhance_prompt: false,
          safety_tolerance: "3",
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