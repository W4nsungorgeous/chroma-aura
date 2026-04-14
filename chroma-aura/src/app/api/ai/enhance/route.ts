import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";
import { filterPrompt } from "@/lib/content-filter";

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

    const response = await aiBridge.enhance(prompt);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API AI Enhance Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
