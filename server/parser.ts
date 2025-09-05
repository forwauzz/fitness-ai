import { FOOD_DB, ALIASES } from "./foodDb.js";

// Very small unit parser
const unitMap: Record<string, string> = {
  gram: "g", grams: "g", g: "g",
  ml: "ml",
  tsp: "tsp", tbsp: "tbsp",
  scoop: "scoop", scoops: "scoop",
  item: "item", items: "item",
  piece: "piece", pieces: "piece",
  link: "link", links: "link",
  cup: "cup", cups: "cup"
};

function aliasKey(s: string): string {
  const k = s.trim().toLowerCase();
  return ALIASES[k] ?? k;
}

type Macro = { P: number; C: number; F: number };
type Est = { macros: Macro; ok: boolean };

function estimateOne(food: string, qty: string): Est {
  const key = aliasKey(food);
  const def = FOOD_DB[key];
  if (!def) return { macros: { P:0, C:0, F:0 }, ok: false };

  // parse "60 g", "1/2 scoop", "1 tbsp", "3"
  let num = 1;
  let unit = "";
  const half = /\b1\/2\b/i.test(qty) ? 0.5 : null;
  const m = /([\d.]+)\s*([A-Za-z]+)?/.exec(qty || "");
  if (m) {
    num = parseFloat(m[1]);
    unit = (m[2] || "").toLowerCase();
  }
  if (half !== null && (!m || m[1] === "1")) num = 0.5; // handle "1/2 scoop"

  unit = unitMap[unit] ?? unit;

  if (def.per === "100g") {
    // allow grams or ml (treat ml≈g)
    let grams = num;
    if (unit && unit !== "g" && unit !== "ml") return { macros: { P:0, C:0, F:0 }, ok: false };
    const factor = grams / 100;
    return { macros: { P: def.P*factor, C: def.C*factor, F: def.F*factor }, ok: true };
  } else {
    // per item/scoop/etc; if user gave grams for a per-item thing, convert
    let items = num;
    if (unit === "g" && def.g_per_item) items = num / def.g_per_item;
    return { macros: { P: def.P*items, C: def.C*items, F: def.F*items }, ok: true };
  }
}

export type ParsedMeal = {
  meal_type: string;
  items: string[];
  quantities: string[];
  P: number; C: number; F: number; kcal: number;
  estimated_any: boolean;
};

export function parseTextToMeals(raw: string): ParsedMeal[] {
  // split by lines, a line defines a meal section: "<meal>:" then items
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const meals: ParsedMeal[] = [];
  for (const line of lines) {
    const [left, right] = line.split(":");
    if (!right) continue;
    const meal_type = left.trim().toLowerCase();  // e.g., "pre workout", "breakfast"
    const parts = right.split(",").map(s => s.trim()).filter(Boolean);

    const items: string[] = [];
    const quantities: string[] = [];
    let P=0, C=0, F=0;
    let any = false;

    // parts like "1 banana", "60 g oats", "150 g yogurt"
    for (const p of parts) {
      // Try to find quantity at the beginning
      const numMatch = /^(\d[\d./]*\s*[A-Za-z]*)\s+(.+)$/.exec(p.trim());
      let food, qty;
      
      if (numMatch) {
        qty = numMatch[1].trim();
        food = numMatch[2].trim();
      } else {
        // No quantity found, assume 1 item
        food = p.trim();
        qty = "1";
      }
      
      food = food.replace(/^and\s+/i, "").trim();
      if (!food) continue;

      items.push(food);
      quantities.push(qty);

      const est = estimateOne(food, qty);
      P += est.macros.P; C += est.macros.C; F += est.macros.F;
      any = any || est.ok;
    }
    const kcal = 4*P + 4*C + 9*F;
    meals.push({ meal_type, items, quantities, P, C, F, kcal, estimated_any: any });
  }
  return meals;
}
