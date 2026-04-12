import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Image data is required" }, { status: 400 });
    }

    const response = await aiBridge.autoColor(imageUrl);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API AI Auto-Color Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
