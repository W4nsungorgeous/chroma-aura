import { AIProvider } from "./interface";
import { MockProvider } from "./providers/mock-provider";

class AIBridge {
  private provider: AIProvider;

  constructor() {
    this.provider = new MockProvider();
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
