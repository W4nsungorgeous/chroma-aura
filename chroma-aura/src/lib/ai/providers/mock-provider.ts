import { AIProvider, AIResponse, EnhanceResponse } from "../interface";

export class MockProvider implements AIProvider {
  name = "Antigravity (Local Mode)";

  private modifiers = [
    "highly detailed lineart",
    "coloring book style",
    "sharp clean outlines",
    "intricate patterns",
    "professional illustration",
    "white background",
    "no shading",
    "8k resolution"
  ];

  async generateLineart(prompt: string): Promise<AIResponse> {
    // Simulate latency for "AI Generation"
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // For local dev, we point to a specific file that the Assistant will fulfill
    const timestamp = Date.now();
    return {
      imageUrl: `/ai/latest_lineart.png?t=${timestamp}`,
      revisedPrompt: `A professional lineart of ${prompt}, ${this.modifiers.join(", ")}`,
      success: true,
    };
  }

  async enhancePrompt(prompt: string): Promise<EnhanceResponse> {
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const enhanced = `${prompt}, ${this.modifiers.slice(0, 4).join(", ")}, ultra-fine borders, perfect for children and adults coloring.`;
    
    return {
      enhanced,
      success: true
    };
  }

  async autoColor(imageUrl: string): Promise<AIResponse> {
    // Simulate latency for "AI Vision & Painting"
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const timestamp = Date.now();
    return {
      imageUrl: `/ai/latest_autocolor.png?t=${timestamp}`,
      success: true
    };
  }
}
