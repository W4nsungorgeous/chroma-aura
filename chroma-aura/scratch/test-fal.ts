import { fal } from "@fal-ai/client";

async function test() {
  const endpoints = [
    "fal-ai/nano-banana-2",
    "openai/gpt-image-2",
    "seedream/v4.5"
  ];

  for (const ep of endpoints) {
    console.log(`Testing ${ep}...`);
    try {
      const result = await Promise.race([
        fal.subscribe(ep, { input: { prompt: "A cat" } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
      console.log(`Success ${ep}:`, result);
    } catch (e) {
      console.error(`Error ${ep}:`, e);
    }
  }
}

test();
