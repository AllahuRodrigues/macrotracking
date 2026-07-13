/** OpenAI vision food analysis — turns a meal photo into structured macro items. */

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// Per-1M-token prices (USD). Defaults track gpt-4o-mini; override via env.
const PRICE_IN = parseFloat(process.env.OPENAI_PRICE_IN_PER_M ?? "0.15");
const PRICE_OUT = parseFloat(process.env.OPENAI_PRICE_OUT_PER_M ?? "0.60");

export type AnalyzedItem = {
  name: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: "low" | "medium" | "high";
};

export type AnalyzeResult = {
  items: AnalyzedItem[];
  summary: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  cost_usd: number;
};

const SYSTEM_PROMPT = `You are a precise sports-nutrition assistant that estimates macros from a food photo.
Rules:
- Identify each distinct food/drink item you can see.
- Estimate realistic portion sizes for a lean, muscular 5'6", 188 lb man cutting on ~2200 kcal.
- Give calories, protein (g), carbs (g), fat (g) per item. Be accurate, not generous.
- If unsure of portion, pick the most likely and set confidence "low".
- Respond ONLY as strict minified JSON matching:
{"items":[{"name":str,"quantity":str,"calories":num,"protein":num,"carbs":num,"fat":num,"confidence":"low|medium|high"}],"summary":str}
No markdown, no prose outside the JSON.`;

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

/**
 * Send a base64 data URL (or remote URL) to OpenAI and parse the macro items.
 * Uses "low" image detail to keep cost minimal.
 */
export async function analyzeFoodImage(
  imageUrl: string,
  hint?: string
): Promise<AnalyzeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set on the server");

  const userText = hint
    ? `Analyze this meal. Extra context from the user: ${hint}`
    : "Analyze this meal and estimate the macros.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";

  let parsed: { items?: AnalyzedItem[]; summary?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Could not parse AI response");
  }

  const items: AnalyzedItem[] = (parsed.items ?? []).map((it) => ({
    name: String(it.name ?? "Food"),
    quantity: it.quantity ? String(it.quantity) : undefined,
    calories: round(Number(it.calories) || 0),
    protein: round(Number(it.protein) || 0),
    carbs: round(Number(it.carbs) || 0),
    fat: round(Number(it.fat) || 0),
    confidence: it.confidence,
  }));

  const totals = items.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const usage = data.usage ?? {};
  const cost_usd =
    ((usage.prompt_tokens ?? 0) / 1_000_000) * PRICE_IN +
    ((usage.completion_tokens ?? 0) / 1_000_000) * PRICE_OUT;

  return {
    items,
    summary: parsed.summary ?? "",
    totals: {
      calories: round(totals.calories),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
    },
    cost_usd,
  };
}
