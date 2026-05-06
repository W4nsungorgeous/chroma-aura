import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/models";
import { aiBridge } from "@/lib/ai/bridge";
import { filterPrompt } from "@/lib/content-filter";
import {
  resolveQuotaKey,
  checkQuota,
  consumeQuota,
  consumePermanentCredit,
} from "@/lib/server-quota";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const filter = filterPrompt(prompt);
    if (!filter.allowed) {
      return NextResponse.json({ success: false, error: filter.reason }, { status: 422 });
    }

    const modelConfig = getModel(model);
    const cost = modelConfig.cost;

    const { key, tier, userId, permanentCredits } = await resolveQuotaKey(req);

    const planHasQuota = await checkQuota(key, tier, cost);
    const canUseCredit = !planHasQuota && permanentCredits >= cost && userId !== null;

    if (!planHasQuota && !canUseCredit) {
      return NextResponse.json(
        {
          success: false,
          error:
            tier === "guest"
              ? `This model requires ${cost} credits. Sign up for a free account to get more.`
              : `Insufficient credits. You need ${cost} credits to generate with this model.`,
        },
        { status: 429 }
      );
    }

    const response = await aiBridge.generate(prompt, model);

    if (response.success) {
      if (planHasQuota) {
        await consumeQuota(key, tier, cost);
      } else {
        await consumePermanentCredit(userId!, cost);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
