import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";
import { filterPrompt } from "@/lib/content-filter";
import { resolveQuotaKey, checkGenerationQuota, consumeGenerationQuota } from "@/lib/server-quota";

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

    const { key, tier } = await resolveQuotaKey(req);
    if (!checkGenerationQuota(key, tier)) {
      return NextResponse.json(
        { success: false, error: "Generation quota exceeded. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const response = await aiBridge.generate(prompt);

    if (response.success) {
      consumeGenerationQuota(key, tier);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
