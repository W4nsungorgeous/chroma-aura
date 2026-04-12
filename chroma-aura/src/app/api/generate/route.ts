import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const response = await aiBridge.generate(prompt);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
