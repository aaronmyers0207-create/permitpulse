/* ───────────────────────────────────────────────────────
 * Permit classifier — assigns a category + sub-category
 * to every permit based on keyword matching.
 *
 * Categories cover the major trades that buy leads from
 * permit data: HVAC, roofing, electrical, plumbing,
 * solar, general construction, and more.
 * ─────────────────────────────────────────────────────── */

const KW: Record<string, string[]> = {
  hvac: [
    "hvac", "air conditioning", "a/c", "ac unit", "mechanical",
    "heat pump", "furnace", "duct", "ductwork", "condenser",
    "air handler", "split system", "mini split", "package unit",
    "changeout", "change-out", "change out", "cooling", "heating",
    "refrigeration", "boiler", "chiller", "thermostat", "ventilation",
  ],
  roofing: [
    "roof", "roofing", "re-roof", "reroof", "shingle", "tile roof",
    "metal roof", "flat roof", "roof replacement", "roof repair",
    "tpo", "epdm", "standing seam", "roof deck", "fascia", "soffit",
  ],
  electrical: [
    "electrical", "electric", "wiring", "panel upgrade", "circuit",
    "breaker", "meter", "transformer", "generator", "ev charger",
    "charging station", "lighting", "switchgear", "conduit",
    "service upgrade", "electrical service",
  ],
  plumbing: [
    "plumbing", "plumber", "sewer", "water heater", "tankless",
    "water line", "drain", "septic", "backflow", "gas line",
    "gas piping", "water main", "re-pipe", "repipe", "fixture",
  ],
  solar: [
    "solar", "photovoltaic", "pv system", "pv install", "solar panel",
    "solar array", "net meter", "inverter", "battery storage",
    "energy storage", "solar roof",
  ],
  fire: [
    "fire alarm", "fire sprinkler", "fire suppression", "fire protection",
    "fire line", "fireline", "sprinkler system", "standpipe",
  ],
  demolition: [
    "demolition", "demo", "tear down", "teardown", "remove structure",
    "razing", "wreck",
  ],
  pool: [
    "pool", "spa", "hot tub", "swimming pool", "pool deck",
    "pool enclosure", "screen enclosure",
  ],
  fence: [
    "fence", "fencing", "gate", "chain link", "privacy fence",
    "wood fence", "aluminum fence",
  ],
  concrete: [
    "concrete", "slab", "foundation", "driveway", "sidewalk",
    "flatwork", "footings", "retaining wall",
  ],
  windows_doors: [
    "window", "windows", "door", "doors", "glass", "glazing",
    "impact window", "impact door", "shutter", "shutters",
    "window replacement", "sliding door",
  ],
  insulation: [
    "insulation", "spray foam", "blown-in", "batt insulation",
    "radiant barrier", "weatherization", "attic insulation",
  ],
};

const SUB_KW: Record<string, string[]> = {
  changeout:        ["changeout", "change-out", "change out", "replacement", "replace"],
  new_construction: ["new construction", "new residential", "new single", "new dwelling", "new home", "new commercial", "new building"],
  renovation:       ["renovation", "addition", "remodel", "alteration", "improvement", "tenant improvement", "build-out", "buildout"],
  repair:           ["repair", "fix", "patch", "emergency"],
  commercial:       ["commercial", "office", "retail", "warehouse", "industrial", "tenant"],
  residential:      ["residential", "single family", "multi-family", "multifamily", "townhouse", "condo", "apartment", "dwelling"],
};

export type PermitCategory =
  | "hvac" | "roofing" | "electrical" | "plumbing" | "solar"
  | "fire" | "demolition" | "pool" | "fence" | "concrete"
  | "windows_doors" | "insulation"
  | "new_construction" | "renovation" | "general"
  | "other";

export interface Classification {
  category: PermitCategory;
  subcategory: string;        // e.g. "changeout", "new_construction", "commercial"
  tags: string[];             // all matched trade keywords
}

export function classifyPermit(permitType: string, description: string): Classification {
  const text = `${permitType} ${description}`.toLowerCase();

  // Find all matching trades
  const matchedTrades: string[] = [];
  for (const [trade, keywords] of Object.entries(KW)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matchedTrades.push(trade);
    }
  }

  // Find sub-category
  let subcategory = "general";
  for (const [sub, keywords] of Object.entries(SUB_KW)) {
    if (keywords.some((kw) => text.includes(kw))) {
      subcategory = sub;
      break;
    }
  }

  // Primary category = first matched trade, or fallback
  let category: PermitCategory;
  if (matchedTrades.length > 0) {
    category = matchedTrades[0] as PermitCategory;
  } else if (subcategory === "new_construction") {
    category = "new_construction";
  } else if (subcategory === "renovation") {
    category = "renovation";
  } else {
    category = "general";
  }

  return { category, subcategory, tags: matchedTrades };
}

/** Rough value estimate when the source doesn't provide one */
export function estimateValue(category: PermitCategory): number {
  const ranges: Record<string, [number, number]> = {
    hvac:              [5000, 15000],
    roofing:           [6000, 20000],
    electrical:        [1500, 8000],
    plumbing:          [2000, 10000],
    solar:             [10000, 35000],
    fire:              [3000, 12000],
    demolition:        [5000, 25000],
    pool:              [15000, 50000],
    fence:             [2000, 8000],
    concrete:          [3000, 15000],
    windows_doors:     [3000, 15000],
    insulation:        [1500, 6000],
    new_construction:  [100000, 400000],
    renovation:        [10000, 60000],
    general:           [2000, 10000],
    other:             [0, 0],
  };
  const [min, max] = ranges[category] ?? [0, 0];
  if (min === 0) return 0;
  return Math.round(min + Math.random() * (max - min));
}
