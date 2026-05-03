"use client";

import { useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type Temp = "hot" | "warm" | "cold";

interface SkipResult {
  name: string;
  phone: string;
  dnc: boolean;
  email: string;
}

interface Lead {
  id: number;
  address: string;
  city: string;
  state: string;
  permitType: string;
  category: string;
  estimatedValue: number;
  filedLabel: string;
  filedDaysAgo: number; // used for freshness dot
  score: number;
  temp: Temp;
  skipResult: SkipResult;
}

/* ─────────────────────────────────────────────────────────────
   Fake lead data
───────────────────────────────────────────────────────────── */
const LEADS: Lead[] = [
  {
    id: 1,
    address: "4711 N Fern Creek Ave",
    city: "Orlando",
    state: "FL",
    permitType: "Roofing",
    category: "roofing",
    estimatedValue: 22500,
    filedLabel: "2 hours ago",
    filedDaysAgo: 0,
    score: 94,
    temp: "hot",
    skipResult: {
      name: "Rodriguez, Maria & Carlos",
      phone: "(407) 555-0182",
      dnc: false,
      email: "maria.r@gmail.com",
    },
  },
  {
    id: 2,
    address: "8832 Cypress Creek Pkwy",
    city: "Houston",
    state: "TX",
    permitType: "HVAC",
    category: "hvac",
    estimatedValue: 14200,
    filedLabel: "yesterday",
    filedDaysAgo: 1,
    score: 78,
    temp: "hot",
    skipResult: {
      name: "Williams, James T.",
      phone: "(832) 555-0441",
      dnc: false,
      email: "jwilliams@yahoo.com",
    },
  },
  {
    id: 3,
    address: "1204 Seminole Blvd",
    city: "Largo",
    state: "FL",
    permitType: "Solar",
    category: "solar",
    estimatedValue: 38000,
    filedLabel: "3 days ago",
    filedDaysAgo: 3,
    score: 72,
    temp: "hot",
    skipResult: {
      name: "Patel, Priya & Raj",
      phone: "(727) 555-0293",
      dnc: false,
      email: "patelroof@gmail.com",
    },
  },
  {
    id: 4,
    address: "2291 Westheimer Rd",
    city: "Houston",
    state: "TX",
    permitType: "Electrical",
    category: "electrical",
    estimatedValue: 8750,
    filedLabel: "4 days ago",
    filedDaysAgo: 4,
    score: 58,
    temp: "warm",
    skipResult: {
      name: "Thompson, Carol",
      phone: "(713) 555-0187",
      dnc: true,
      email: "c.thompson@hotmail.com",
    },
  },
  {
    id: 5,
    address: "3390 Curry Ford Rd",
    city: "Orlando",
    state: "FL",
    permitType: "Plumbing",
    category: "plumbing",
    estimatedValue: 6200,
    filedLabel: "5 days ago",
    filedDaysAgo: 5,
    score: 45,
    temp: "warm",
    skipResult: {
      name: "Martinez, Luis & Ana",
      phone: "(407) 555-0374",
      dnc: false,
      email: "luismtz@gmail.com",
    },
  },
  {
    id: 6,
    address: "9021 Dale Mabry Hwy",
    city: "Tampa",
    state: "FL",
    permitType: "Roofing",
    category: "roofing",
    estimatedValue: 31000,
    filedLabel: "6 days ago",
    filedDaysAgo: 6,
    score: 82,
    temp: "hot",
    skipResult: {
      name: "Johnson, Robert K.",
      phone: "(813) 555-0528",
      dnc: false,
      email: "rjohnson@comcast.net",
    },
  },
  {
    id: 7,
    address: "5544 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    permitType: "Windows/Doors",
    category: "windows_doors",
    estimatedValue: 19500,
    filedLabel: "1 week ago",
    filedDaysAgo: 7,
    score: 41,
    temp: "warm",
    skipResult: {
      name: "Chen, Wei & Mei",
      phone: "(305) 555-0619",
      dnc: false,
      email: "wchen@gmail.com",
    },
  },
  {
    id: 8,
    address: "7712 W Broad St",
    city: "Richmond",
    state: "VA",
    permitType: "HVAC",
    category: "hvac",
    estimatedValue: 11800,
    filedLabel: "8 days ago",
    filedDaysAgo: 8,
    score: 38,
    temp: "warm",
    skipResult: {
      name: "Davis, Patricia",
      phone: "(804) 555-0733",
      dnc: false,
      email: "pdavis@aol.com",
    },
  },
];

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const CAT_STYLES: Record<string, string> = {
  roofing:      "bg-orange-50 text-orange-700 border-orange-200/60",
  hvac:         "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  solar:        "bg-yellow-50 text-yellow-700 border-yellow-200/60",
  electrical:   "bg-amber-50 text-amber-700 border-amber-200/60",
  plumbing:     "bg-blue-50 text-blue-700 border-blue-200/60",
  windows_doors:"bg-sky-50 text-sky-700 border-sky-200/60",
};

function freshnessDot(daysAgo: number): string {
  if (daysAgo <= 0) return "bg-emerald-400 animate-pulse";
  if (daysAgo <= 3) return "bg-emerald-400";
  if (daysAgo <= 7) return "bg-yellow-400";
  return "bg-gray-300";
}

function tempBadge(temp: Temp) {
  if (temp === "hot")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold border border-red-200/60">
        🔥 Hot
      </span>
    );
  if (temp === "warm")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[11px] font-semibold border border-amber-200/60">
        ☀️ Warm
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px] font-semibold border border-gray-200/60">
      Cold
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-component: LeadCard
───────────────────────────────────────────────────────────── */
function LeadCard({ lead }: { lead: Lead }) {
  const [tracing, setTracing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSkipTrace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (revealed) return;
    setTracing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTracing(false);
    setRevealed(true);
  };

  const catStyle = CAT_STYLES[lead.category] ?? "bg-gray-100 text-gray-600 border-gray-200/60";

  return (
    <div
      className={`bg-white/70 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all ${
        lead.temp === "hot"
          ? "border-[#01696F]/25 ring-1 ring-[#01696F]/5"
          : "border-black/[0.04]"
      }`}
    >
      <div className="px-4 py-4 flex items-start gap-3">
        {/* Score column */}
        <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0 w-8">
          <div className={`w-3 h-3 rounded-full ${freshnessDot(lead.filedDaysAgo)}`} />
          <span className="text-[10px] font-mono text-[#A1A1A6] leading-none">{lead.score}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${catStyle}`}>
              {lead.permitType}
            </span>
            {tempBadge(lead.temp)}
            <div className={`w-2 h-2 rounded-full ${freshnessDot(lead.filedDaysAgo)}`} />
            <span className="text-[11px] text-[#A1A1A6]">{lead.filedLabel}</span>
          </div>

          {/* Address */}
          <h3 className="text-[#1D1D1F] text-sm font-semibold leading-snug">{lead.address}</h3>
          <p className="text-[#A1A1A6] text-xs mb-2">
            {lead.city}, {lead.state}
          </p>

          {/* Value + score */}
          <div className="flex items-center gap-3 text-xs mb-3">
            <span className="text-[#01696F] font-bold font-mono">
              ${lead.estimatedValue.toLocaleString()}
            </span>
            <span className="text-[#A1A1A6]">
              Score{" "}
              <span className="font-semibold text-[#6E6E73]">{lead.score}/100</span>
            </span>
          </div>

          {/* Skip Trace area */}
          {!revealed ? (
            <div className="flex items-center gap-3">
              {/* Blurred placeholder */}
              <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                {/* Lock icon */}
                <svg
                  className="w-3.5 h-3.5 text-[#A1A1A6] shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                {/* Blurred name/phone rows */}
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 rounded bg-gray-200/80 blur-[3px] w-32" />
                  <div className="h-2 rounded bg-gray-200/60 blur-[3px] w-24" />
                </div>
              </div>

              <button
                onClick={handleSkipTrace}
                disabled={tracing}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 ${
                  tracing
                    ? "bg-[#01696F]/60 text-white cursor-not-allowed"
                    : "bg-[#01696F] text-white hover:bg-[#0C4E54] active:scale-95"
                }`}
              >
                {tracing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Tracing…</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Skip Trace
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Revealed contact */
            <div
              className="rounded-xl border border-[#01696F]/20 bg-[#01696F]/[0.04] overflow-hidden"
              style={{
                animation: "fadeSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              <div className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[#1D1D1F] text-sm font-bold leading-tight">
                    {lead.skipResult.name}
                  </p>
                  {lead.skipResult.dnc ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-semibold border border-red-200/60">
                      DNC ⚠️
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-semibold border border-green-200/60">
                      NOT DNC ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${lead.skipResult.phone}`}
                    onClick={(e) => e.preventDefault()}
                    className="text-[#01696F] text-sm font-mono font-semibold hover:underline"
                  >
                    {lead.skipResult.phone}
                  </a>
                  <span className="text-[#A1A1A6] text-xs">·</span>
                  <span className="text-[#6E6E73] text-xs">{lead.skipResult.email}</span>
                </div>
              </div>

              {/* Save nudge */}
              <div className="border-t border-[#01696F]/10 px-3 py-2 flex items-center justify-between">
                <p className="text-[#6E6E73] text-[11px]">
                  💾 Sign up to save this contact
                </p>
                <Link
                  href="/signup"
                  className="text-[#01696F] text-[11px] font-semibold hover:underline"
                >
                  Create account →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function DemoPage() {
  const hotCount = LEADS.filter((l) => l.temp === "hot").length;
  const warmCount = LEADS.filter((l) => l.temp === "warm").length;

  return (
    <>
      {/* Keyframe for reveal animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-[#F7F6F2]">
        {/* ── Nav ─────────────────────────────────────── */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 py-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              {/* Logo wordmark */}
              <div className="flex items-center gap-2">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  aria-label="Permit Tracer"
                >
                  <rect width="28" height="28" rx="7" fill="#01696F" />
                  <path
                    d="M8 20V8h7a4 4 0 010 8H8"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="19" cy="18" r="2.5" fill="white" fillOpacity="0.6" />
                  <circle cx="19" cy="18" r="1.2" fill="white" />
                </svg>
                <span className="text-[#1D1D1F] font-semibold text-sm tracking-tight">
                  Permit Tracer
                </span>
              </div>
              <div className="h-5 w-px bg-black/[0.08] hidden sm:block" />
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-semibold">
                Demo Mode
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-[#6E6E73] text-sm hover:bg-black/[0.03] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-lg bg-[#01696F] text-white text-sm font-semibold hover:bg-[#0C4E54] transition-colors shadow-sm"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Demo banner ──────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#01696F]/[0.09] to-[#01696F]/[0.03] border-b border-[#01696F]/10">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔍</span>
              <p className="text-[#1D1D1F] text-sm">
                <span className="font-semibold">You&rsquo;re in demo mode</span>{" "}
                — this is sample data.{" "}
                <span className="text-[#6E6E73]">Sign up free to see real permits in your area.</span>
              </p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#01696F] text-white text-sm font-semibold hover:bg-[#0C4E54] transition-colors shadow-sm"
            >
              Create Free Account
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-6">

          {/* Header card */}
          <div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm mb-5 overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-[#1D1D1F] text-2xl font-bold tracking-tight">
                    Fresh Leads
                  </h1>
                  <span className="px-2.5 py-1 rounded-lg bg-[#01696F]/[0.08] text-[#01696F] text-sm font-bold font-mono">
                    {LEADS.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-semibold">
                    Sample data
                  </span>
                </div>
                <p className="text-[#6E6E73] text-sm">
                  All trades · FL &amp; TX · Demo sandbox
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#01696F] text-white text-sm font-semibold hover:bg-[#0C4E54] transition-colors shadow-sm"
              >
                Get Real Permits
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="border-t border-black/[0.04] px-6 py-2.5 flex items-center gap-6 text-xs">
              <span className="text-[#6E6E73]">
                🔥{" "}
                <span className="font-semibold text-[#1D1D1F]">{hotCount}</span> hot
              </span>
              <span className="text-[#6E6E73]">
                ☀️{" "}
                <span className="font-semibold text-[#1D1D1F]">{warmCount}</span> warm
              </span>
              <span className="text-[#6E6E73]">
                📍{" "}
                <span className="font-semibold text-[#1D1D1F]">FL, TX, VA</span>
              </span>
              <span className="text-[#6E6E73]">
                🔎 Click{" "}
                <span className="font-semibold text-[#1D1D1F]">Skip Trace</span> to reveal homeowner
              </span>
            </div>
          </div>

          {/* Lead grid */}
          <div className="grid gap-3">
            {LEADS.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 bg-gradient-to-br from-[#01696F] to-[#0C4E54] rounded-2xl px-6 py-8 text-center shadow-lg">
            <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-widest">
              Ready to close more jobs?
            </p>
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">
              See real permits in your area
            </h2>
            <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
              Every permit above is a homeowner who just spent money on their home — and probably needs more work done. Get their phone number the moment a permit is filed.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#01696F] text-base font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              Create Free Account — No Credit Card
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-white/40 text-xs mt-3">
              Free plan includes 10 leads/month · No credit card required
            </p>
          </div>

          {/* Bottom spacing for mobile sticky CTA */}
          <div className="h-20 sm:h-4" />
        </div>

        {/* ── Mobile sticky CTA ────────────────────────── */}
        <div className="fixed bottom-0 inset-x-0 sm:hidden z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F7F6F2] via-[#F7F6F2]/90 to-transparent pointer-events-none">
          <Link
            href="/signup"
            className="pointer-events-auto flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#01696F] text-white text-sm font-bold shadow-lg hover:bg-[#0C4E54] transition-colors active:scale-[0.98]"
          >
            Want real leads? Sign up free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
