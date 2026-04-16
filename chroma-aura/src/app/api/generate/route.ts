import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";
import { filterPrompt } from "@/lib/content-filter";
import {
  resolveQuotaKey,
  checkGenerationQuota,
  consumeGenerationQuota,
  consumePermanentCredit,
} from "@/lib/server-quota";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const filter = filterPrompt(prompt);
    if (!filter.allowed) {
      return NextResponse.json({ success: false, error: filter.reason }, { status: 422 });
    }

    const { key, tier, userId, permanentCredits } = await resolveQuotaKey(req);

    const planHasQuota = checkGenerationQuota(key, tier);
    const canUseCredit = !planHasQuota && permanentCredits > 0 && userId !== null;

    if (!planHasQuota && !canUseCredit) {
      return NextResponse.json(
        {
          success: false,
          error:
            tier === "guest"
              ? "Free generation limit reached. Sign up for a free account to get more."
              : "Weekly generation quota exceeded. Resets every Monday.",
        },
        { status: 429 }
      );
    }

    const response = await aiBridge.generate(prompt);

    if (response.success) {
      if (planHasQuota) {
        consumeGenerationQuota(key, tier);
      } else {
        // Deduct one permanent credit as fallback
        await consumePermanentCredit(userId!);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
