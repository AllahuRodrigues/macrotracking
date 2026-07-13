import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/ai-food";
import { hasBudget, recordUsage, getUsageToday, AI_DAILY_BUDGET_USD } from "@/lib/ai-usage";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET → today's AI spend so the UI can show remaining budget. */
export async function GET() {
  const usage = await getUsageToday();
  return NextResponse.json({
    ...usage,
    budget_usd: AI_DAILY_BUDGET_USD,
    remaining_usd: Math.max(0, AI_DAILY_BUDGET_USD - usage.spent_usd),
  });
}

/**
 * POST { image: dataUrl | httpUrl, hint?: string }
 * Returns detected food items with macro estimates. Guarded by the
 * write-access middleware and a hard daily spend cap.
 */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured. Add OPENAI_API_KEY to the server env." },
      { status: 503 }
    );
  }

  if (!(await hasBudget())) {
    return NextResponse.json(
      { error: `Daily AI budget of $${AI_DAILY_BUDGET_USD.toFixed(2)} reached. Try again tomorrow.` },
      { status: 429 }
    );
  }

  let body: { image?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const image = body.image;
  if (!image || (!image.startsWith("data:") && !image.startsWith("http"))) {
    return NextResponse.json(
      { error: "Provide `image` as a data URL or http URL" },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeFoodImage(image, body.hint);
    await recordUsage(result.cost_usd);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "AI analysis failed" },
      { status: 502 }
    );
  }
}
