import { AIProvider, AIResponse } from "../interface";

export class MockProvider implements AIProvider {
  name = "Mock (Dev Mode)";

  private samples = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000", // Cyberpunk style
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000", // Abstract/Mandala
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1000", // Fantasy
    "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000", // Nature/Patterns
  ];

  async generateLineart(prompt: string): Promise<AIResponse> {
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Choose a random sample
    const randomSample = this.samples[Math.floor(Math.random() * this.samples.length)];

    return {
      imageUrl: randomSample,
      revisedPrompt: `A professional lineart of ${prompt}, intricate details, coloring book style.`,
      success: true,
    };
  }
}
