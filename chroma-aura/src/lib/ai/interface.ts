export interface AIResponse {
  imageUrl: string;
  revisedPrompt?: string;
  success: boolean;
  error?: string;
}

export interface EnhanceResponse {
  enhanced: string;
  success: boolean;
  error?: string;
}

export interface AIProvider {
  name: string;
  /** Optional `endpoint` lets the bridge pick which model on the provider to use. */
  generateLineart(prompt: string, endpoint?: string): Promise<AIResponse>;
  enhancePrompt(prompt: string): Promise<EnhanceResponse>;
  autoColor(imageUrl: string): Promise<AIResponse>;
}
