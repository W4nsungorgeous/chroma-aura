import { NextRequest, NextResponse } from "next/server";
import { aiBridge } from "@/lib/ai/bridge";
import {
  resolveQuotaKey,
  checkQuota,
  consumeQuota,
  consumePermanentCredit,
} from "@/lib/server-quota";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Image data is required" }, { status: 400 });
    }

    if (
      typeof imageUrl !== "string" ||
      imageUrl.length > 2_000_000 ||
      (!imageUrl.startsWith("http://") &&
        !imageUrl.startsWith("https://") &&
        !imageUrl.startsWith("data:"))
    ) {
      return NextResponse.json({ success: false, error: "Invalid image URL" }, { status: 400 });
    }

    const { key, tier, userId, permanentCredits } = await resolveQuotaKey(req);

    const planHasQuota = await checkQuota(key, tier);
    const canUseCredit = !planHasQuota && permanentCredits > 0 && userId !== null;

    if (!planHasQuota && !canUseCredit) {
      return NextResponse.json(
        {
          success: false,
          error:
            tier === "guest"
              ? "Auto-color is available to registered users. Sign up for free."
              : "Weekly quota exceeded. Resets every Monday.",
        },
        { status: 429 }
      );
    }

    const response = await aiBridge.autoColor(imageUrl);

    if (response.success) {
      if (planHasQuota) {
        await consumeQuota(key, tier);
      } else {
        await consumePermanentCredit(userId!);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API AI Auto-Color Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
