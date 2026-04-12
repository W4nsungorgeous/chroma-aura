export interface AIResponse {
  imageUrl: string;
  revisedPrompt?: string;
  success: boolean;
  error?: string;
}

export interface AIProvider {
  name: string;
  generateLineart(prompt: string): Promise<AIResponse>;
}
