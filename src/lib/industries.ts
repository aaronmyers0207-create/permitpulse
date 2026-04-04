/**
 * Industry → permit category mapping.
 * When a user picks their industry, we know which permit categories
 * are most relevant to them as sales leads.
 */

export interface Industry {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Primary permit categories this industry cares about */
  categories: string[];
  /** Color accent for the industry (tailwind classes) */
  accent: string;
}

export const INDUSTRIES: Industry[] = [
  {
    id: "hvac",
    label: "HVAC",
    description: "Heating, cooling, and ventilation",
    icon: "🌡️",
    categories: ["hvac"],
    accent: "green",
  },
  {
    id: "roofing",
    label: "Roofing",
    description: "Roof replacement and repair",
    icon: "🏠",
    categories: ["roofing"],
    accent: "orange",
  },
  {
    id: "electrical",
    label: "Electrical",
    description: "Wiring, panels, and generators",
    icon: "⚡",
    categories: ["electrical"],
    accent: "yellow",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    description: "Pipes, water heaters, and drains",
    icon: "🔧",
    categories: ["plumbing"],
    accent: "blue",
  },
  {
    id: "solar",
    label: "Solar",
    description: "Solar panels and energy storage",
    icon: "☀️",
    categories: ["solar"],
    accent: "amber",
  },
  {
    id: "general_contractor",
    label: "General Contracting",
    description: "New builds, renovations, additions",
    icon: "🏗️",
    categories: ["new_construction", "renovation", "general", "demolition", "concrete"],
    accent: "purple",
  },
  {
    id: "windows_doors",
    label: "Windows & Doors",
    description: "Impact windows, doors, shutters",
    icon: "🪟",
    categories: ["windows_doors"],
    accent: "sky",
  },
  {
    id: "pool",
    label: "Pool & Spa",
    description: "Pools, spas, enclosures",
    icon: "🏊",
    categories: ["pool"],
    accent: "cyan",
  },
  {
    id: "insulation",
    label: "Insulation",
    description: "Spray foam, blown-in, weatherization",
    icon: "🧱",
    categories: ["insulation"],
    accent: "pink",
  },
  {
    id: "fire_protection",
    label: "Fire Protection",
    description: "Sprinklers, alarms, suppression",
    icon: "🔥",
    categories: ["fire"],
    accent: "red",
  },
  {
    id: "all_trades",
    label: "All Industries",
    description: "See every permit type",
    icon: "📋",
    categories: [],  // empty = show everything
    accent: "green",
  },
];

export const INDUSTRY_MAP = Object.fromEntries(INDUSTRIES.map((i) => [i.id, i]));

/** US states with Socrata data sources */
export const COVERED_STATES = [
  { code: "CA", name: "California" },
  { code: "FL", name: "Florida" },
  { code: "IL", name: "Illinois" },
  { code: "LA", name: "Louisiana" },
  { code: "MD", name: "Maryland" },
  { code: "NY", name: "New York" },
  { code: "OH", name: "Ohio" },
  { code: "TX", name: "Texas" },
  { code: "WA", name: "Washington" },
];
