import { AIProvider } from "./interface";
import { MockProvider } from "./providers/mock-provider";

class AIBridge {
  private provider: AIProvider;

  constructor() {
    // In the future, we can switch based on process.env.AI_PROVIDER
    // For now, default to MockProvider as we're in "Antigravity Dev Mode"
    this.provider = new MockProvider();
  }

  async generate(prompt: string) {
    console.log(`[AIBridge] Generating with ${this.provider.name}: ${prompt}`);
    return await this.provider.generateLineart(prompt);
  }
}

export const aiBridge = new AIBridge();
