import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SEO_PAGES: Record<string, { title: string; h1: string; description: string; keywords: string[]; content: string[] }> = {
  hvac: {
    title: "HVAC Permit Leads — Find Homeowners Who Need HVAC Work",
    h1: "HVAC Permit Leads",
    description: "Get real-time HVAC building permit data with homeowner contact info. Find AC replacements, heat pump installs, and mechanical permits filed in your area. Skip trace included.",
    keywords: ["HVAC leads", "HVAC permits", "AC replacement leads", "mechanical permit data", "HVAC contractor leads", "air conditioning permits"],
    content: [
      "Every time a homeowner pulls an HVAC permit, it's a signal — they need work done. Permit Tracer tracks these permits across 12+ cities in real time and gives you the homeowner's name, phone number, and email before your competition even knows about it.",
      "Our Replacement Ready feature finds HVAC systems installed 8-15 years ago that are approaching end of life. These homeowners are the most receptive to replacement quotes — especially before their AC fails in the middle of summer.",
      "Stop cold-calling. Start knocking doors where you know the homeowner needs exactly what you sell. Permit Tracer covers Orlando, Tampa, Austin, Dallas, Chicago, San Francisco, Seattle, and more.",
    ],
  },
  roofing: {
    title: "Roofing Permit Leads — Storm Claims & Roof Replacement Data",
    h1: "Roofing Permit Leads",
    description: "Access real-time roofing permit data with property owner contact info. Find re-roofs, storm damage claims, and roof replacement permits. Perfect for roofing contractors and storm chasers.",
    keywords: ["roofing leads", "roof permit data", "storm damage leads", "re-roof permits", "roofing contractor leads", "roof replacement leads", "storm claims data"],
    content: [
      "Roofing permits are filed every day in your market — re-roofs, storm damage repairs, new construction. Each one represents a homeowner who is spending money on their roof right now. Permit Tracer puts those leads in your hands with one-click skip tracing.",
      "For storm chasers: combine permit data with weather intelligence to find neighborhoods where hail and wind damage claims are surging. Know exactly where to knock before the competition shows up.",
      "Our database includes 6,000+ roofing permits in Florida alone — Orlando, Tampa, Gainesville — plus Texas, Illinois, California, New York, and more. Updated daily from city open data APIs.",
    ],
  },
  solar: {
    title: "Solar Permit Leads — Find Homeowners Ready for Solar",
    h1: "Solar Permit Leads",
    description: "Real-time solar permit data for solar sales teams. Find new roof permits (perfect solar upsell), track competitor installs, and identify homes with aging inverters due for replacement.",
    keywords: ["solar leads", "solar permit data", "solar sales leads", "new roof solar leads", "solar contractor leads", "solar permit tracking"],
    content: [
      "The best solar lead isn't someone who answered a Facebook ad — it's a homeowner who just got a new roof. Their roof is fresh, they're already spending, and they don't need to reroof before install. Permit Tracer finds these leads automatically.",
      "Track competitor installs in your area — see which solar companies are pulling permits and where. Identify homes with solar systems from 8-12 years ago where the inverter is approaching end of life — perfect for battery storage and inverter replacement upsells.",
      "Over 5,000 solar permits in our Florida database alone. Coverage across Orlando, Tampa, Austin, Dallas, San Francisco, Seattle, and growing weekly.",
    ],
  },
  electrical: {
    title: "Electrical Permit Leads — Panel Upgrades & Wiring Work",
    h1: "Electrical Permit Leads",
    description: "Access electrical building permit data with homeowner contact info. Find panel upgrades, EV charger installations, service upgrades, and new construction electrical work.",
    keywords: ["electrical leads", "electrical permit data", "panel upgrade leads", "EV charger permits", "electrician leads", "electrical contractor leads"],
    content: [
      "Electrical permits signal major home upgrades — panel upgrades for EV chargers, service upgrades for solar installs, rewiring for renovations. Permit Tracer tracks these in real time across 12+ cities.",
      "Solar installations often require electrical panel upgrades. Many solar companies subcontract this work. Follow solar permits and offer your electrical services to solar installers and homeowners.",
      "Coverage includes 1,500+ electrical permits in Florida and thousands more across Texas, Illinois, California, New York, Washington, and Ohio.",
    ],
  },
  plumbing: {
    title: "Plumbing Permit Leads — Water Heater & Re-Pipe Data",
    h1: "Plumbing Permit Leads",
    description: "Real-time plumbing permit data with property owner contact info. Find water heater replacements, re-pipes, sewer line work, and new construction plumbing permits.",
    keywords: ["plumbing leads", "plumbing permit data", "water heater leads", "re-pipe permits", "plumber leads", "plumbing contractor leads"],
    content: [
      "Water heater permits, re-pipes, sewer line replacements, gas line work — every plumbing permit represents a homeowner who needs a licensed plumber. Permit Tracer gives you their name and phone number.",
      "Our Replacement Ready feature finds water heater permits from 8-12 years ago. Tank water heaters have a 10-year average lifespan — these homeowners will need a replacement soon, and proactive outreach catches them before the emergency.",
      "Track renovation permits in your area — kitchen and bathroom renovations almost always involve plumbing work. Follow the permit trail.",
    ],
  },
  florida: {
    title: "Florida Building Permit Leads — Orlando, Tampa, Gainesville",
    h1: "Florida Building Permit Leads",
    description: "Access 21,000+ building permits in Florida with homeowner contact data. Coverage in Orlando, Tampa, and Gainesville for HVAC, roofing, solar, electrical, and plumbing contractors.",
    keywords: ["Florida permit leads", "Orlando permits", "Tampa permits", "Florida contractor leads", "FL building permits", "Florida roofing permits", "Florida HVAC permits"],
    content: [
      "Permit Tracer covers 21,000+ building permits across Florida with real-time data from Orlando (15,000+ permits), Tampa (4,800+ permits), and Gainesville (1,000+ permits). Updated daily.",
      "Florida's hot climate drives massive demand for HVAC, roofing, and solar work. Our database includes 6,000+ roofing permits, 5,000+ solar permits, 1,300+ HVAC permits, and 1,500+ electrical permits — all with skip trace capability to get homeowner phone numbers.",
      "Whether you're a solar installer in Orlando, a roofer in Tampa, or an HVAC contractor in Gainesville — Permit Tracer gives you the permit intelligence to find and close more deals.",
    ],
  },
  texas: {
    title: "Texas Building Permit Leads — Austin, Dallas, Collin County",
    h1: "Texas Building Permit Leads",
    description: "Access building permit data in Austin, Dallas, and Collin County TX with homeowner contact info. Solar, roofing, HVAC, electrical, and plumbing permits for contractors.",
    keywords: ["Texas permit leads", "Austin permits", "Dallas permits", "TX building permits", "Texas contractor leads", "Texas roofing permits"],
    content: [
      "Permit Tracer covers thousands of building permits across Texas — Austin, Dallas, and Collin County. From new construction in the suburbs to solar installs in Austin, we track the permits that matter to your business.",
      "Texas's booming construction market means new permits every day. Our database includes roofing, solar, HVAC, electrical, plumbing, and new construction permits with property owner information and skip trace capability.",
      "Filter by category, search by address or contractor, and skip trace homeowners with one click. Start your free trial today.",
    ],
  },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = SEO_PAGES[slug];
  if (!page) return { title: "Not Found" };
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: `/permits/${slug}` },
    openGraph: { title: page.title, description: page.description, url: `https://permittracer.com/permits/${slug}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(SEO_PAGES).map((slug) => ({ slug }));
}

export default async function PermitSEOPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = SEO_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><img src="/logo.png" alt="Permit Tracer" className="h-8 object-contain"/></Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#6E6E73] text-sm">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl">Start Free</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-[#1D1D1F] text-3xl sm:text-4xl font-bold mb-4">{page.h1}</h1>
        <p className="text-[#6E6E73] text-lg mb-8 leading-relaxed">{page.description}</p>

        {page.content.map((p, i) => (
          <p key={i} className="text-[#1D1D1F] text-base leading-relaxed mb-6">{p}</p>
        ))}

        <div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm p-8 mt-12 text-center">
          <h2 className="text-[#1D1D1F] text-2xl font-bold mb-3">Start finding {slug} leads today</h2>
          <p className="text-[#6E6E73] mb-6">Free trial — no credit card required. 100 permits + 3 skip traces included.</p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors">
            Create Free Account
          </Link>
        </div>
      </article>

      <footer className="border-t border-black/[0.04] px-6 py-6 text-center text-[#A1A1A6] text-xs">
        Permit Tracer &copy; {new Date().getFullYear()} &middot;{" "}
        {Object.entries(SEO_PAGES).map(([s, p]) => (
          <Link key={s} href={`/permits/${s}`} className="hover:text-[#01696F] mx-1">{p.h1}</Link>
        ))}
      </footer>
    </div>
  );
}
