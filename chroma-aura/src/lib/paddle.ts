/**
 * Server-side Paddle SDK singleton.
 *
 * Usage (server components / API routes only):
 *   import { getPaddleInstance } from "@/lib/paddle";
 *   const paddle = getPaddleInstance();
 *   const eventData = await paddle.webhooks.unmarshal(body, secret, signature);
 *
 * Required environment variables:
 *   PADDLE_API_KEY              — Server-side secret key (never expose to client)
 *   NEXT_PUBLIC_PADDLE_ENV      — "sandbox" | "production"
 */

import { Paddle, Environment } from "@paddle/paddle-node-sdk";

let instance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (instance) return instance;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Paddle] PADDLE_API_KEY is not set. Add it to your environment variables."
    );
  }

  const env =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? Environment.production
      : Environment.sandbox;

  instance = new Paddle(apiKey, { environment: env });
  return instance;
}
