import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

/**
 * OpenAI image generation via gpt-image-1.
 * Calls the REST endpoint directly to avoid pulling in the `openai` SDK.
 *
 * Returns a `data:` URL because gpt-image-1 responds with base64 by default.
 * The canvas/loadCanvasData path accepts both http(s) and data URLs.
 */
export class OpenAIProvider implements AIProvider {
  name = "OpenAI (gpt-image-1)";

  private buildLineartPrompt(subject: string): string {
    return (
      `A highly detailed coloring book page illustration of ${subject}. ` +
      `Clean bold black ink outlines on pure white background, no shading, no color, ` +
      `every region a fully sealed closed loop suitable for flood-fill coloring, ` +
      `intricate decorative subdivisions, professional adult coloring book style.`
    );
  }

  async generateLineart(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        imageUrl: "",
        error: "OPENAI_API_KEY is not configured. Add it to .env.local to use ChatGPT Image.",
      };
    }

    try {
      const enhancedPrompt = this.buildLineartPrompt(prompt);
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, imageUrl: "", error: `OpenAI ${res.status}: ${errText.slice(0, 200)}` };
      }

      const json = await res.json() as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = json.data?.[0];
      if (!item) return { success: false, imageUrl: "", error: "No image returned from OpenAI" };

      const imageUrl = item.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : item.url ?? "";
      if (!imageUrl) return { success: false, imageUrl: "", error: "OpenAI response missing image data" };

      return { imageUrl, revisedPrompt: enhancedPrompt, success: true };
    } catch (error) {
      console.error("[OpenAIProvider] generateLineart error:", error);
      return { success: false, imageUrl: "", error: String(error) };
    }
  }

  async enhancePrompt(prompt: string): Promise<EnhanceResponse> {
    return { enhanced: prompt, success: true };
  }

  async autoColor(): Promise<AIResponse> {
    return { success: false, imageUrl: "", error: "Auto-color not implemented for OpenAI provider." };
  }
}
