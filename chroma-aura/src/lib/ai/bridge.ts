import { AIProvider } from "./interface";
import { MockProvider } from "./providers/mock-provider";
import { FalProvider } from "./providers/fal-provider";

class AIBridge {
  private provider: AIProvider;

  constructor() {
    this.provider = process.env.FAL_API_KEY
      ? new FalProvider()
      : new MockProvider();
    console.log(`[AIBridge] Using provider: ${this.provider.name}`);
  }

  async generate(prompt: string) {
    console.log(`[AIBridge] Generating with ${this.provider.name}: ${prompt}`);
    return await this.provider.generateLineart(prompt);
  }

  async enhance(prompt: string) {
    console.log(`[AIBridge] Enhancing with ${this.provider.name}: ${prompt}`);
    return await this.provider.enhancePrompt(prompt);
  }

  async autoColor(imageUrl: string) {
    console.log(`[AIBridge] Auto-coloring with ${this.provider.name}`);
    return await this.provider.autoColor(imageUrl);
  }
}

export const aiBridge = new AIBridge();
