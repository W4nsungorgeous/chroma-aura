import { AIProvider } from "./interface";
import { MockProvider } from "./providers/mock-provider";
import { FalProvider } from "./providers/fal-provider";
import { OpenAIProvider } from "./providers/openai-provider";
import { getModel, ModelId } from "./models";

class AIBridge {
  private fal: AIProvider;
  private openai: AIProvider;
  /** Default provider used by autoColor + enhance — these don't have a user-facing model selector. */
  private defaultProvider: AIProvider;

  constructor() {
    this.fal = process.env.FAL_API_KEY ? new FalProvider() : new MockProvider();
    this.openai = new OpenAIProvider();
    this.defaultProvider = this.fal;
    console.log(`[AIBridge] Default provider: ${this.defaultProvider.name}`);
  }

  async generate(prompt: string, modelId?: string) {
    const model = getModel(modelId);
    console.log(`[AIBridge] Generate via ${model.label} (${model.id})`);
    if (model.provider === "openai") {
      return await this.openai.generateLineart(prompt);
    }
    return await this.fal.generateLineart(prompt, model.endpoint);
  }

  async enhance(prompt: string) {
    return await this.defaultProvider.enhancePrompt(prompt);
  }

  async autoColor(imageUrl: string) {
    return await this.defaultProvider.autoColor(imageUrl);
  }
}

export const aiBridge = new AIBridge();
export type { ModelId };
