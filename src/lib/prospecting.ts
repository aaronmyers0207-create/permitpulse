/**
 * Prospecting modes and replacement cycle intelligence.
 *
 * "New Permits" = active/recent permits → competitors are working here,
 *   homeowner is in buying mode, or they need complementary services.
 *
 * "Replacement Ready" = old closed permits → the installed system
 *   is aging out and the homeowner will need a replacement soon.
 */

export interface ReplacementCycle {
  category: string;
  label: string;
  /** Typical lifespan in years */
  lifespan: number;
  /** Start looking this many years after install */
  prospectAfter: number;
  /** Sales pitch angle */
  pitch: string;
}

export const REPLACEMENT_CYCLES: ReplacementCycle[] = [
  {
    category: "hvac",
    label: "HVAC Systems",
    lifespan: 15,
    prospectAfter: 8,
    pitch: "AC units installed 8-15 years ago are losing efficiency and approaching end of life. Homeowners are receptive to replacement quotes before their system fails in peak summer.",
  },
  {
    category: "roofing",
    label: "Roofing",
    lifespan: 25,
    prospectAfter: 15,
    pitch: "Shingle roofs 15-25 years old are showing wear — granule loss, curling, potential leaks. Storm season is the trigger for these homeowners to finally pull the trigger.",
  },
  {
    category: "windows_doors",
    label: "Windows & Doors",
    lifespan: 20,
    prospectAfter: 12,
    pitch: "Windows and doors from 12-20 years ago lack modern energy efficiency and impact ratings. Energy bills and storm prep drive replacements.",
  },
  {
    category: "plumbing",
    label: "Water Heaters",
    lifespan: 12,
    prospectAfter: 8,
    pitch: "Tank water heaters last 8-12 years. Homeowners often don't think about it until it fails. Proactive outreach catches them before the emergency.",
  },
  {
    category: "electrical",
    label: "Electrical Panels",
    lifespan: 30,
    prospectAfter: 20,
    pitch: "Panels from 20+ years ago may not meet current code, can't support EV chargers or modern loads. Safety and capacity are the selling points.",
  },
  {
    category: "insulation",
    label: "Insulation",
    lifespan: 20,
    prospectAfter: 15,
    pitch: "Insulation degrades over 15-20 years — settling, moisture damage, pest intrusion. Energy audit upsells drive these replacements.",
  },
  {
    category: "pool",
    label: "Pool Equipment",
    lifespan: 10,
    prospectAfter: 7,
    pitch: "Pool pumps, heaters, and surfaces last 7-10 years. Resurfacing and equipment upgrades are a recurring revenue stream.",
  },
  {
    category: "solar",
    label: "Solar Inverters",
    lifespan: 12,
    prospectAfter: 8,
    pitch: "Solar inverters fail before panels do — 8-12 year lifespan vs 25+ for panels. Owners need inverter replacements and battery add-ons.",
  },
  {
    category: "fire",
    label: "Fire Systems",
    lifespan: 20,
    prospectAfter: 12,
    pitch: "Fire sprinkler and alarm systems require inspection and replacement after 12-20 years to maintain code compliance.",
  },
];

export const CYCLE_MAP = Object.fromEntries(REPLACEMENT_CYCLES.map((c) => [c.category, c]));

/**
 * For a given category, return the date range to search for
 * "replacement ready" permits.
 */
export function getReplacementDateRange(category: string): { from: string; to: string } | null {
  const cycle = CYCLE_MAP[category];
  if (!cycle) return null;

  const now = new Date();
  const toYear = now.getFullYear() - cycle.prospectAfter;
  const fromYear = now.getFullYear() - cycle.lifespan;

  return {
    from: `${fromYear}-01-01`,
    to: `${toYear}-12-31`,
  };
}
