/**
 * Prospecting modes — three ways to use permit data for lead generation.
 *
 * 1. "New Permits" — recent activity, competitors at work, homeowner buying mode
 * 2. "Replacement Ready" — old permits where installed systems are aging out
 * 3. "Upsell Ready" — permits in OTHER categories that signal opportunity for YOUR trade
 */

export interface ReplacementCycle {
  category: string;
  label: string;
  lifespan: number;
  prospectAfter: number;
  pitch: string;
}

export interface UpsellOpportunity {
  /** The user's industry / what they sell */
  forIndustry: string;
  /** The permit category to look for (different from what they sell) */
  lookForCategory: string;
  lookForLabel: string;
  /** How old the permit should be (0 = recent is fine) */
  minAge: number;
  maxAge: number;
  pitch: string;
}

/* ── Replacement Cycles ─────────────────────────────── */

export const REPLACEMENT_CYCLES: ReplacementCycle[] = [
  { category: "hvac", label: "HVAC Systems", lifespan: 15, prospectAfter: 8, pitch: "AC units installed 8-15 years ago are losing efficiency and nearing end of life. Homeowners are receptive to replacement quotes before their system fails mid-summer." },
  { category: "roofing", label: "Roofing", lifespan: 25, prospectAfter: 15, pitch: "Shingle roofs 15-25 years old show wear — granule loss, curling, potential leaks. Storm season is when these homeowners finally pull the trigger." },
  { category: "windows_doors", label: "Windows & Doors", lifespan: 20, prospectAfter: 12, pitch: "Windows from 12-20 years ago lack modern energy efficiency and impact ratings. Energy bills and storm prep drive replacements." },
  { category: "plumbing", label: "Water Heaters", lifespan: 12, prospectAfter: 8, pitch: "Tank water heaters last 8-12 years. Homeowners don't think about it until it fails. Proactive outreach catches them before the emergency." },
  { category: "electrical", label: "Electrical Panels", lifespan: 30, prospectAfter: 20, pitch: "Panels from 20+ years ago can't support modern loads — EVs, smart home, etc. Safety and capacity are the selling points." },
  { category: "insulation", label: "Insulation", lifespan: 20, prospectAfter: 15, pitch: "Insulation degrades over 15-20 years. Energy audits and rising utility costs drive these replacements." },
  { category: "pool", label: "Pool Equipment", lifespan: 10, prospectAfter: 7, pitch: "Pool pumps, heaters, and surfaces last 7-10 years. Resurfacing and equipment upgrades are recurring revenue." },
  { category: "solar", label: "Solar Inverters", lifespan: 12, prospectAfter: 8, pitch: "Solar inverters fail before panels — 8-12 year lifespan vs 25+ for panels. Owners need inverter replacements and battery add-ons." },
  { category: "fire", label: "Fire Systems", lifespan: 20, prospectAfter: 12, pitch: "Fire sprinkler and alarm systems need inspection and replacement after 12-20 years for code compliance." },
];

export const CYCLE_MAP = Object.fromEntries(REPLACEMENT_CYCLES.map((c) => [c.category, c]));

/* ── Upsell Opportunities ───────────────────────────── */

export const UPSELL_OPPORTUNITIES: UpsellOpportunity[] = [
  // Solar companies: look for new roofs (perfect for panel install)
  { forIndustry: "solar", lookForCategory: "roofing", lookForLabel: "New Roof → Solar Upsell", minAge: 0, maxAge: 3, pitch: "Homeowner just got a new roof — they're already spending, the roof is fresh, and it's the perfect time to pitch solar. No need to reroof before install." },
  // Solar companies: look for new construction
  { forIndustry: "solar", lookForCategory: "new_construction", lookForLabel: "New Build → Solar", minAge: 0, maxAge: 2, pitch: "New construction homes are ideal for solar — the homeowner is making big decisions and the roof is brand new." },

  // HVAC companies: look for new construction
  { forIndustry: "hvac", lookForCategory: "new_construction", lookForLabel: "New Build → HVAC", minAge: 0, maxAge: 2, pitch: "New construction often needs HVAC system selection. Get in early with the builder or homeowner." },
  // HVAC companies: look for roof replacements (attic access = insulation + HVAC check)
  { forIndustry: "hvac", lookForCategory: "roofing", lookForLabel: "Roof Work → HVAC Check", minAge: 0, maxAge: 1, pitch: "When the roof comes off, it's the cheapest time to replace ductwork or upgrade insulation. Pair with the roofer or follow up right after." },

  // Roofing companies: look for solar permits (roof condition matters)
  { forIndustry: "roofing", lookForCategory: "solar", lookForLabel: "Solar Install → Roof Check", minAge: 0, maxAge: 2, pitch: "Solar installers often find the roof needs work but aren't roofers. Follow up with homeowners who got solar — they may need roof repair or replacement before the warranty kicks in." },
  // Roofing companies: look for new construction
  { forIndustry: "roofing", lookForCategory: "new_construction", lookForLabel: "New Build → Roofing", minAge: 0, maxAge: 2, pitch: "New construction projects need roofing contractors. Get in with builders early." },

  // Electrical: look for solar (needs panel upgrades), new construction, EV chargers
  { forIndustry: "electrical", lookForCategory: "solar", lookForLabel: "Solar → Panel Upgrade", minAge: 0, maxAge: 2, pitch: "Solar installs often require electrical panel upgrades. Many solar companies sub this out — be their go-to electrician." },
  { forIndustry: "electrical", lookForCategory: "new_construction", lookForLabel: "New Build → Electrical", minAge: 0, maxAge: 2, pitch: "Every new build needs full electrical. Get in with the GC." },

  // Plumbing: look for renovation and new construction
  { forIndustry: "plumbing", lookForCategory: "renovation", lookForLabel: "Renovation → Plumbing", minAge: 0, maxAge: 1, pitch: "Kitchen and bath renovations almost always involve plumbing work. Follow the renovation permits." },
  { forIndustry: "plumbing", lookForCategory: "new_construction", lookForLabel: "New Build → Plumbing", minAge: 0, maxAge: 2, pitch: "New construction needs full plumbing rough-in and fixtures." },

  // Pool: look for new construction (backyard is being developed)
  { forIndustry: "pool", lookForCategory: "new_construction", lookForLabel: "New Build → Pool", minAge: 0, maxAge: 3, pitch: "New homeowners in new builds are prime pool buyers — they have a blank backyard and are investing in the property." },

  // Insulation: look for HVAC permits (often paired), roof work
  { forIndustry: "insulation", lookForCategory: "hvac", lookForLabel: "HVAC Work → Insulation", minAge: 0, maxAge: 1, pitch: "HVAC replacement is the perfect time to upgrade insulation — it makes the new system more efficient. Pair with the HVAC contractor." },
  { forIndustry: "insulation", lookForCategory: "roofing", lookForLabel: "Roof Work → Insulation", minAge: 0, maxAge: 1, pitch: "When the roof is open, attic insulation is easy to assess and upgrade. Follow roof permits." },

  // Windows: look for renovation, HVAC (energy efficiency combo)
  { forIndustry: "windows_doors", lookForCategory: "renovation", lookForLabel: "Renovation → Windows", minAge: 0, maxAge: 1, pitch: "Home renovations often include window and door upgrades for aesthetics and energy savings." },
  { forIndustry: "windows_doors", lookForCategory: "hvac", lookForLabel: "HVAC Upgrade → Windows", minAge: 0, maxAge: 2, pitch: "Homeowners who just upgraded HVAC are thinking about energy efficiency. Windows are the logical next step." },

  // General contractor: look for everything
  { forIndustry: "general_contractor", lookForCategory: "new_construction", lookForLabel: "New Construction", minAge: 0, maxAge: 2, pitch: "New construction projects in your area." },
  { forIndustry: "general_contractor", lookForCategory: "renovation", lookForLabel: "Renovations", minAge: 0, maxAge: 2, pitch: "Active renovation permits — homeowners are investing in their properties." },
];

/** Get upsell opportunities for a given industry */
export function getUpsellsForIndustry(industryId: string): UpsellOpportunity[] {
  return UPSELL_OPPORTUNITIES.filter((u) => u.forIndustry === industryId);
}

export function getReplacementDateRange(category: string): { from: string; to: string } | null {
  const cycle = CYCLE_MAP[category];
  if (!cycle) return null;
  const now = new Date();
  return {
    from: `${now.getFullYear() - cycle.lifespan}-01-01`,
    to: `${now.getFullYear() - cycle.prospectAfter}-12-31`,
  };
}

export function getUpsellDateRange(opp: UpsellOpportunity): { from: string; to: string } {
  const now = new Date();
  return {
    from: `${now.getFullYear() - opp.maxAge}-01-01`,
    to: `${now.getFullYear() - opp.minAge}-12-31`,
  };
}
