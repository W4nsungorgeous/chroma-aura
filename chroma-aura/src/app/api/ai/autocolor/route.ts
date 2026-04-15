import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";
import { resolveQuotaKey, checkDrawingQuota, consumeDrawingQuota } from "@/lib/server-quota";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Image data is required" }, { status: 400 });
    }

    // Validate that imageUrl is a plausible URL (http/https) or a data URL, not arbitrary input
    if (
      typeof imageUrl !== "string" ||
      imageUrl.length > 2_000_000 ||
      (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("data:"))
    ) {
      return NextResponse.json({ success: false, error: "Invalid image URL" }, { status: 400 });
    }

    const { key, tier } = await resolveQuotaKey(req);
    if (!checkDrawingQuota(key, tier)) {
      return NextResponse.json(
        { success: false, error: "Drawing quota exceeded. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const response = await aiBridge.autoColor(imageUrl);

    if (response.success) {
      consumeDrawingQuota(key);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API AI Auto-Color Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
