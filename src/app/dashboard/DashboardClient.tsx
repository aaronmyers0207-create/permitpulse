"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRY_MAP, COVERED_STATES } from "@/lib/industries";
import { getUserTier } from "@/lib/tiers";
import { CYCLE_MAP, getUpsellsForIndustry, type UpsellOpportunity } from "@/lib/prospecting";
import { scorePermit, LEAD_STATUSES, STATUS_MAP, type LeadScore } from "@/lib/scoring";

/* ── Category config ─────────────────────────────── */
const CAT: Record<string, { label: string; bg: string }> = {
  hvac:"HVAC",roofing:"Roofing",electrical:"Electrical",plumbing:"Plumbing",solar:"Solar",
  fire:"Fire Protection",demolition:"Demolition",pool:"Pool/Spa",fence:"Fence",
  concrete:"Concrete",windows_doors:"Windows/Doors",insulation:"Insulation",
  new_construction:"New Construction",renovation:"Renovation",general:"General",
}.constructor === Object ? {
  hvac:             { label: "HVAC",             bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  roofing:          { label: "Roofing",          bg: "bg-orange-50 text-orange-700 border-orange-200/60" },
  electrical:       { label: "Electrical",       bg: "bg-amber-50 text-amber-700 border-amber-200/60" },
  plumbing:         { label: "Plumbing",         bg: "bg-blue-50 text-blue-700 border-blue-200/60" },
  solar:            { label: "Solar",            bg: "bg-yellow-50 text-yellow-700 border-yellow-200/60" },
  fire:             { label: "Fire Protection",  bg: "bg-red-50 text-red-700 border-red-200/60" },
  demolition:       { label: "Demolition",       bg: "bg-rose-50 text-rose-700 border-rose-200/60" },
  pool:             { label: "Pool/Spa",         bg: "bg-cyan-50 text-cyan-700 border-cyan-200/60" },
  fence:            { label: "Fence",            bg: "bg-lime-50 text-lime-700 border-lime-200/60" },
  concrete:         { label: "Concrete",         bg: "bg-stone-100 text-stone-700 border-stone-200/60" },
  windows_doors:    { label: "Windows/Doors",    bg: "bg-sky-50 text-sky-700 border-sky-200/60" },
  insulation:       { label: "Insulation",       bg: "bg-pink-50 text-pink-700 border-pink-200/60" },
  new_construction: { label: "New Construction", bg: "bg-purple-50 text-purple-700 border-purple-200/60" },
  renovation:       { label: "Renovation",       bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60" },
  general:          { label: "General",          bg: "bg-gray-100 text-gray-600 border-gray-200/60" },
} : {};

function daysAgo(d: string): string {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff < 0) return "Soon"; if (diff === 0) return "Today"; if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`; if (diff < 30) return `${Math.floor(diff/7)}w ago`;
  if (diff < 365) return `${Math.floor(diff/30)}mo ago`; return `${Math.floor(diff/365)}yr ago`;
}

function freshnessColor(d: string): string {
  if (!d) return "bg-gray-300";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff <= 3) return "bg-emerald-400"; if (diff <= 7) return "bg-green-400";
  if (diff <= 30) return "bg-yellow-400"; return "bg-gray-300";
}

interface Props { profile: any; initialPermits: any[]; totalCount: number; pageSize: number; viewsMap: Record<string, { starred: boolean; notes: string | null; status: string }>; newSinceLastVisit: number; }

export default function DashboardClient({ profile, initialPermits, totalCount, pageSize, viewsMap: initialViews, newSinceLastVisit }: Props) {
  const [permits, setPermits] = useState(initialPermits);
  const [total, setTotal] = useState(totalCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewsMap, setViewsMap] = useState(initialViews);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);
  const [drawerNotes, setDrawerNotes] = useState("");
  const [showHero, setShowHero] = useState(newSinceLastVisit > 0);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const industry = INDUSTRY_MAP[profile?.industry] || null;
  const tier = getUserTier(profile);
  const [mode, setMode] = useState<"new" | "replacement" | "upsell" | "traced">("new");
  const [tracedPermits, setTracedPermits] = useState<any[]>([]);
  const [tracedLoading, setTracedLoading] = useState(false);
  const [activeUpsell, setActiveUpsell] = useState<UpsellOpportunity | null>(null);
  const upsells = industry ? getUpsellsForIndustry(industry.id) : [];
  const [filterCategory, setFilterCategory] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [tierLimited, setTierLimited] = useState(false);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);

  const router = useRouter();
  const supabase = createClient();
  const totalPages = Math.ceil(total / pageSize);

  /* ── Fetch ──────────────────────────────────── */
  const fetchPage = useCallback(async (p: number, cat: string, st: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    params.set("mode", mode);
    if (mode === "upsell" && activeUpsell) { params.set("upsell_category", activeUpsell.lookForCategory); params.set("upsell_min_age", String(activeUpsell.minAge)); params.set("upsell_max_age", String(activeUpsell.maxAge)); }
    else if (cat) params.set("category", cat);
    if (st) params.set("state", st);
    if (q) params.set("q", q);
    const userStates = profile?.states as string[] | null;
    if (!st && userStates && userStates.length > 0 && userStates.length < 9) params.set("states", userStates.join(","));
    try {
      const res = await fetch(`/api/permits?${params.toString()}`);
      const data = await res.json();
      if (data.permits) { setPermits(data.permits); setTotal(data.total); setTierLimited(!!data.tierLimited); }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [pageSize, profile?.states, mode, activeUpsell]);

  useEffect(() => { setPage(1); fetchPage(1, filterCategory, filterState, search); }, [filterCategory, filterState, mode, activeUpsell, fetchPage]);

  const handleSearch = (v: string) => { setSearch(v); clearTimeout(searchTimeout.current); searchTimeout.current = setTimeout(() => { setPage(1); fetchPage(1, filterCategory, filterState, v); }, 400); };
  const goToPage = (p: number) => { if (p < 1 || p > totalPages) return; setPage(p); fetchPage(p, filterCategory, filterState, search); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* ── Actions ────────────────────────────────── */
  const toggleStar = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cur = viewsMap[id]; const ns = !cur?.starred;
    setViewsMap((p) => ({ ...p, [id]: { ...p[id], starred: ns, notes: cur?.notes || null, status: cur?.status || "new" } }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("permit_views").upsert({ user_id: user.id, permit_id: id, starred: ns, viewed_at: new Date().toISOString() });
  };

  const updateStatus = async (permitId: string, status: string) => {
    setViewsMap((p) => ({ ...p, [permitId]: { ...p[permitId], starred: p[permitId]?.starred || false, notes: p[permitId]?.notes || null, status } }));
    setStatusDropdown(null);
    await fetch("/api/permit-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId, status }) });
  };

  const saveNotes = async (permitId: string, notes: string) => {
    setViewsMap((p) => ({ ...p, [permitId]: { ...p[permitId], starred: p[permitId]?.starred || false, notes, status: p[permitId]?.status || "new" } }));
    await fetch("/api/permit-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId, notes }) });
  };

  const exportCSV = () => {
    const h = ["Score","Category","Address","City","State","Zip","Filed","Value","Contractor","Owner","Status","Description"];
    const rows = permits.map((p: any) => { const s = scorePermit(p, industry); return [s.score, p.category, `"${(p.address||"").replace(/"/g,'""')}"`, p.city, p.state, p.zip_code, p.filed_date, p.estimated_value, `"${(p.contractor_name||"").replace(/"/g,'""')}"`, `"${(p.applicant_name||"").replace(/"/g,'""')}"`, viewsMap[p.id]?.status||"new", `"${(p.description||"").replace(/"/g,'""')}"`]; });
    const csv = [h,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`permitpulse-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };
  const starredCount = Object.values(viewsMap).filter((v) => v.starred).length;
  const categoryOptions = industry?.categories.length ? Object.entries(CAT).sort(([a],[b])=>{const ar=industry.categories.includes(a)?0:1;const br=industry.categories.includes(b)?0:1;return ar-br;}) : Object.entries(CAT);
  const pageNums = () => { const p:(number|"...")[]=[]; if(totalPages<=7){for(let i=1;i<=totalPages;i++)p.push(i);return p;} p.push(1); if(page>3)p.push("..."); for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++)p.push(i); if(page<totalPages-2)p.push("..."); p.push(totalPages); return p; };

  // Score-based client filter
  const scoredPermits = permits.map((p: any) => ({ ...p, _score: scorePermit(p, industry) }));
  const filteredPermits = scoredPermits.filter((p: any) => {
    if (filterScore === "hot" && p._score.temp !== "hot") return false;
    if (filterScore === "warm" && p._score.temp === "cold") return false;
    return true;
  });

  return (
    <div className="min-h-screen" onClick={() => setStatusDropdown(null)}>
      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-30 border-b border-black/[0.04] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Permit Tracer" className="h-7 object-contain"/>
            {industry && <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-[#01696F]/[0.06] text-[#01696F] text-xs font-medium">{industry.icon} {industry.label}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[#6E6E73] text-sm">{profile?.company_name}</span>
            <a href="/map" className="text-[#01696F] text-sm font-medium hover:text-[#0C4E54] transition-colors">Map</a>
            <a href="/settings" className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Settings</a>
            {tier.id === "admin" && <a href="/admin" className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Admin</a>}
            <button onClick={handleLogout} className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* What's New Hero */}
        {showHero && newSinceLastVisit > 0 && (
          <div className="bg-gradient-to-r from-[#01696F]/[0.08] to-[#01696F]/[0.03] border border-[#01696F]/15 rounded-2xl px-6 py-5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-[#1D1D1F] text-lg font-bold">
                🔥 {newSinceLastVisit.toLocaleString()} new permit{newSinceLastVisit !== 1 ? "s" : ""} since your last visit
              </p>
              <p className="text-[#6E6E73] text-sm mt-0.5">Fresh leads are waiting. The best ones are marked 🔥 Hot.</p>
            </div>
            <button onClick={() => setShowHero(false)} className="text-[#A1A1A6] hover:text-[#6E6E73] text-lg px-2">&times;</button>
          </div>
        )}

        {/* Mode toggle + title */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-[#1D1D1F] text-xl font-bold tracking-tight">{mode==="new"?"Fresh Leads":mode==="replacement"?"Replacement Opportunities":"Upsell Opportunities"}</h1>
            <p className="text-[#6E6E73] text-sm">{total.toLocaleString()} permits &middot; {starredCount} saved &middot; Page {page}/{totalPages||1}</p>
          </div>
          <div className="inline-flex bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-xl p-1 shadow-sm">
            <button onClick={() => { setMode("new"); setActiveUpsell(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="new"?"bg-[#01696F] text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Fresh</button>
            <button onClick={() => { setMode("replacement"); setActiveUpsell(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="replacement"?"bg-amber-500 text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Replace</button>
            {upsells.length > 0 && <button onClick={() => { setMode("upsell"); if (!activeUpsell && upsells[0]) setActiveUpsell(upsells[0]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="upsell"?"bg-purple-500 text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Upsell</button>}
            <button onClick={async () => { setMode("traced"); setTracedLoading(true); try { const r = await fetch("/api/permits/traced"); const d = await r.json(); setTracedPermits(d.permits || []); } catch {} setTracedLoading(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="traced"?"bg-[#01696F] text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Traced</button>
          </div>
        </div>

        {/* Upsell / Replacement cards */}
        {mode==="upsell"&&upsells.length>0&&(
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap gap-2">{upsells.map((u,i)=>(<button key={i} onClick={()=>setActiveUpsell(u)} className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all shadow-sm ${activeUpsell===u?"bg-purple-50 border-purple-300 text-purple-700 ring-1 ring-purple-200":"bg-white border-gray-200 text-[#6E6E73] hover:border-gray-300"}`}>{u.lookForLabel}</button>))}</div>
            {activeUpsell&&(<div className="bg-purple-50/80 border border-purple-200/40 rounded-2xl px-5 py-4 shadow-sm"><p className="text-purple-800 text-sm font-medium mb-1">🎯 {activeUpsell.lookForLabel}</p><p className="text-purple-700/70 text-sm">{activeUpsell.pitch}</p></div>)}
          </div>
        )}
        {mode==="replacement"&&filterCategory&&CYCLE_MAP[filterCategory]&&(<div className="bg-amber-50/80 border border-amber-200/40 rounded-2xl px-5 py-4 mb-5 shadow-sm"><p className="text-amber-800 text-sm font-medium mb-1">💡 {CYCLE_MAP[filterCategory].label}</p><p className="text-amber-700/70 text-sm">{CYCLE_MAP[filterCategory].pitch}</p></div>)}

        {/* Tier banner */}
        {tierLimited&&(<div className="bg-white/70 border border-black/[0.06] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between shadow-sm"><div><p className="text-[#1D1D1F] text-sm font-medium">Plan limit reached</p><p className="text-[#A1A1A6] text-xs">Upgrade for more permits and skip traces.</p></div><a href="/settings" className="px-4 py-2 bg-[#01696F] text-white text-sm rounded-xl shadow-sm">Upgrade</a></div>)}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" value={search} onChange={(e)=>handleSearch(e.target.value)} placeholder="Search address, contractor, owner..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 shadow-sm"/>
          </div>
          {mode!=="upsell"&&(<select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2 text-sm shadow-sm"><option value="">All types</option>{categoryOptions.map(([k,c])=>(<option key={k} value={k}>{industry?.categories.includes(k)?`★ ${c.label}`:c.label}</option>))}</select>)}
          <select value={filterState} onChange={(e)=>setFilterState(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2 text-sm shadow-sm"><option value="">All states</option>{COVERED_STATES.map(s=>(<option key={s.code} value={s.code}>{s.code}</option>))}</select>
          <select value={filterScore} onChange={(e)=>setFilterScore(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2 text-sm shadow-sm"><option value="">All leads</option><option value="hot">🔥 Hot only</option><option value="warm">🟢 Warm+</option></select>
          <div className="hidden sm:block flex-1"/>
          <button onClick={exportCSV} className="px-4 py-2 bg-white border border-gray-200 text-[#6E6E73] rounded-xl text-sm shadow-sm hover:bg-gray-50">Export</button>
        </div>

        {/* Traced leads view */}
        {mode === "traced" ? (
          tracedLoading ? (
            <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-[#01696F]/30 border-t-[#01696F] rounded-full animate-spin"/></div>
          ) : tracedPermits.length === 0 ? (
            <div className="text-center py-20"><div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📱</span></div><h3 className="text-[#1D1D1F] text-lg font-semibold mb-1">No traced leads yet</h3><p className="text-[#6E6E73] text-sm">Skip trace a permit to see results here.</p></div>
          ) : (
            <div className="grid gap-2.5">
              {tracedPermits.map((p: any) => {
                const persons = p.skip_trace_data?.persons || [];
                const firstPerson = persons[0];
                const isHit = p.skip_trace_data?.hit;
                return (
                  <div key={p.id} onClick={() => { setSelectedPermit(p); setDrawerNotes(viewsMap[p.id]?.notes || ""); }}
                    className={`bg-white/70 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer ${isHit ? "border-[#01696F]/20" : "border-black/[0.04] opacity-60"}`}>
                    <div className="px-4 py-3.5 flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${isHit ? "bg-[#01696F]" : "bg-gray-300"}`}/>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#1D1D1F] text-sm font-semibold truncate">{p.address}</h3>
                        <p className="text-[#A1A1A6] text-xs">{p.city}, {p.state}</p>
                        {firstPerson ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-[#1D1D1F] text-sm font-bold">{firstPerson.name}</p>
                            {firstPerson.phones?.[0] && (
                              <div className="flex items-center gap-2">
                                <span className="text-[#01696F] text-sm font-mono font-semibold">{firstPerson.phones[0].number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}</span>
                                <span className="text-[#A1A1A6] text-[10px]">{firstPerson.phones[0].type}{firstPerson.phones[0].dnc ? " \u00b7 DNC" : ""}</span>
                              </div>
                            )}
                            {firstPerson.emails?.[0] && <p className="text-[#6E6E73] text-xs">{firstPerson.emails[0]}</p>}
                          </div>
                        ) : (
                          <p className="text-amber-600 text-xs mt-1">No results</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-[#A1A1A6] mt-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {/* Lead cards */}
        {mode === "traced" ? null : loading ? (<div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-[#01696F]/30 border-t-[#01696F] rounded-full animate-spin"/></div>
        ) : filteredPermits.length===0 ? (
          <div className="text-center py-20"><div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📋</span></div><h3 className="text-[#1D1D1F] text-lg font-semibold mb-1">No leads found</h3><p className="text-[#6E6E73] text-sm">{total===0?<>Sync data from <a href="/admin" className="text-[#01696F] underline">Admin</a>.</>:"Adjust your filters."}</p></div>
        ) : (
          <>
            <div className="grid gap-2.5">
              {filteredPermits.map((p: any) => {
                const sc: LeadScore = p._score;
                const c = CAT[p.category] || CAT.general;
                const starred = viewsMap[p.id]?.starred;
                const status = viewsMap[p.id]?.status || "new";
                const st = STATUS_MAP[status] || LEAD_STATUSES[0];
                const val = Number(p.estimated_value) || 0;

                return (
                  <div key={p.id} onClick={() => { setSelectedPermit(p); setDrawerNotes(viewsMap[p.id]?.notes || ""); }}
                    className={`bg-white/70 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                      sc.temp === "hot" ? "border-[#01696F]/25 ring-1 ring-[#01696F]/5" : "border-black/[0.04]"
                    }`}>
                    <div className="px-4 py-3.5 flex items-start gap-3">
                      {/* Score indicator */}
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className={`w-3 h-3 rounded-full ${sc.temp==="hot"?"bg-red-400 animate-pulse":sc.temp==="warm"?"bg-green-400":"bg-gray-300"}`}/>
                        <span className="text-[10px] font-mono text-[#A1A1A6]">{sc.score}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.bg}`}>{c.label}</span>
                          {sc.temp === "hot" && <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-medium">🔥 Hot</span>}
                          {val >= 100000 && <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium">💰 High</span>}
                          {p.skip_trace_data?.persons?.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-[#01696F]/10 text-[#01696F] text-[11px] font-medium">📱 Traced</span>}
                          <div className={`w-2 h-2 rounded-full ${freshnessColor(p.filed_date)}`}/>
                          <span className="text-[11px] text-[#A1A1A6]">{daysAgo(p.filed_date)}</span>
                          {/* Status pill */}
                          <div className="relative" onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === p.id ? null : p.id); }}>
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer hover:opacity-80 ${st.color}`}>{st.label}</span>
                            {statusDropdown === p.id && (
                              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
                                {LEAD_STATUSES.map((ls) => (
                                  <button key={ls.id} onClick={(e) => { e.stopPropagation(); updateStatus(p.id, ls.id); }}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${ls.color}`}>{ls.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-[#1D1D1F] text-sm font-semibold leading-snug truncate">{p.address}</h3>
                        <p className="text-[#A1A1A6] text-xs mb-1.5">{p.city}, {p.state} {p.zip_code}</p>

                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {val > 0 && <span className="text-[#01696F] font-bold font-mono">${val.toLocaleString()}</span>}
                          {p.applicant_name && <span className="text-[#6E6E73] flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>{p.applicant_name}</span>}
                          {p.contractor_name && <span className="text-[#A1A1A6] flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>{p.contractor_name}</span>}
                        </div>
                        {/* Show traced contact inline */}
                        {p.skip_trace_data?.persons?.[0] && (
                          <div className="flex items-center gap-3 mt-1 px-2.5 py-1.5 rounded-lg bg-[#01696F]/[0.04] border border-[#01696F]/10">
                            <span className="text-[#1D1D1F] text-xs font-semibold">{p.skip_trace_data.persons[0].name}</span>
                            {p.skip_trace_data.persons[0].phones?.[0] && <span className="text-[#01696F] text-xs font-mono">{p.skip_trace_data.persons[0].phones[0].number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}</span>}
                          </div>
                        )}
                      </div>

                      {/* Star + arrow */}
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={(e) => toggleStar(p.id, e)} className={`text-base hover:scale-110 transition-transform ${starred?"":"opacity-20 group-hover:opacity-50"}`}>{starred?"⭐":"☆"}</button>
                        <svg className="w-4 h-4 text-[#A1A1A6] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <button onClick={()=>goToPage(page-1)} disabled={page===1} className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 shadow-sm">Prev</button>
                {pageNums().map((n,i)=>n==="..."?<span key={`d${i}`} className="px-1.5 text-gray-300">...</span>:<button key={n} onClick={()=>goToPage(n as number)} className={`px-3 py-1.5 text-sm rounded-xl border shadow-sm ${n===page?"bg-[#01696F] border-[#01696F] text-white":"bg-white border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{n}</button>)}
                <button onClick={()=>goToPage(page+1)} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 shadow-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedPermit && (() => {
        const sc = scorePermit(selectedPermit, industry);
        const c = CAT[selectedPermit.category] || CAT.general;
        const pStatus = viewsMap[selectedPermit.id]?.status || "new";
        return (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedPermit(null)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"/>
            <div className="relative w-full max-w-lg bg-[#F7F6F2] border-l border-black/[0.06] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="glass-strong sticky top-0 border-b border-black/[0.04] px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-[#1D1D1F] font-semibold">Lead Details</h2>
                <button onClick={() => setSelectedPermit(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#6E6E73]">&times;</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                {/* Score banner */}
                <div className={`rounded-2xl px-5 py-4 ${sc.temp==="hot"?"bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/40":sc.temp==="warm"?"bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/40":"bg-gray-50 border border-gray-200/40"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{sc.temp==="hot"?"🔥":sc.temp==="warm"?"🟢":"⚪"}</span>
                    <span className={`font-bold ${sc.temp==="hot"?"text-red-700":sc.temp==="warm"?"text-green-700":"text-gray-600"}`}>{sc.temp==="hot"?"Hot Lead":sc.temp==="warm"?"Warm Lead":"Cold Lead"} — {sc.score}/100</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">{sc.reasons.map((r,i) => (<span key={i} className="px-2 py-0.5 rounded-md bg-white/60 text-xs text-[#6E6E73]">{r}</span>))}</div>
                </div>

                {/* Status quick-select */}
                <div>
                  <p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-2">Lead Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEAD_STATUSES.map((ls) => (
                      <button key={ls.id} onClick={() => updateStatus(selectedPermit.id, ls.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${pStatus === ls.id ? ls.color + " ring-1 ring-black/5" : "bg-white border-gray-200 text-[#A1A1A6] hover:border-gray-300"}`}>
                        {ls.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property card */}
                <div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl p-5 shadow-sm">
                  <p className="text-[#1D1D1F] text-xl font-bold">{selectedPermit.address}</p>
                  <p className="text-[#6E6E73] text-sm">{selectedPermit.city}, {selectedPermit.state} {selectedPermit.zip_code}</p>
                  {selectedPermit.estimated_value && <p className="text-[#01696F] text-2xl font-bold font-mono mt-2">${Number(selectedPermit.estimated_value).toLocaleString()}</p>}
                  <div className="flex items-center gap-2 mt-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${c.bg}`}>{c.label}</span><span className={`w-2 h-2 rounded-full ${freshnessColor(selectedPermit.filed_date)}`}/><span className="text-xs text-[#A1A1A6]">{daysAgo(selectedPermit.filed_date)} &middot; {selectedPermit.filed_date}</span></div>
                </div>

                {/* People */}
                {selectedPermit.applicant_name && (
                  <div className="bg-white/70 border border-[#01696F]/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#01696F]/10 flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-[#01696F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
                    <div><p className="text-[#A1A1A6] text-xs">Property Owner</p><p className="text-[#1D1D1F] text-sm font-semibold">{selectedPermit.applicant_name}</p></div>
                  </div>
                )}
                {selectedPermit.contractor_name && (
                  <div className="bg-white/50 border border-black/[0.04] rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-[#6E6E73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg></div>
                    <div><p className="text-[#A1A1A6] text-xs">Contractor</p><p className="text-[#1D1D1F] text-sm font-medium">{selectedPermit.contractor_name}</p></div>
                  </div>
                )}

                {selectedPermit.description && (<div><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1">Description</p><p className="text-[#6E6E73] text-sm leading-relaxed">{selectedPermit.description}</p></div>)}

                {/* Notes */}
                <div>
                  <p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1.5">Notes</p>
                  <textarea value={drawerNotes} onChange={(e) => setDrawerNotes(e.target.value)} onBlur={() => saveNotes(selectedPermit.id, drawerNotes)} placeholder="Add notes about this lead..." rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 shadow-sm resize-none"/>
                </div>

                {/* Skip Trace */}
                <div className="bg-gradient-to-br from-[#01696F]/[0.06] to-[#01696F]/[0.02] border border-[#01696F]/15 rounded-2xl p-5">
                  <p className="text-[#1D1D1F] font-semibold text-sm mb-1">Skip Trace</p>
                  <p className="text-[#6E6E73] text-xs mb-3">Get phone numbers, emails, and mailing address.</p>
                  {selectedPermit.skip_trace_data && selectedPermit.skip_trace_data.status && selectedPermit.skip_trace_data.status !== "pending" ? (
                    <div className="space-y-3">
                      {selectedPermit.skip_trace_data.persons?.map((person: any, pi: number) => (
                        <div key={pi} className="bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
                          {/* Person header */}
                          <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-between">
                            <div>
                              <p className="text-[#1D1D1F] text-sm font-bold">{person.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {person.age && <span className="text-[#6E6E73] text-xs">Age {person.age}</span>}
                                {person.property_owner && <span className="text-[#01696F] text-[10px] font-medium bg-[#01696F]/10 px-1.5 py-0.5 rounded">Owner</span>}
                                {person.deceased && <span className="text-red-500 text-[10px] font-medium bg-red-50 px-1.5 py-0.5 rounded">Deceased</span>}
                                {person.litigator && <span className="text-amber-600 text-[10px] font-medium bg-amber-50 px-1.5 py-0.5 rounded">Litigator</span>}
                              </div>
                            </div>
                          </div>
                          {/* Phones */}
                          {person.phones?.length > 0 && (
                            <div className="divide-y divide-black/[0.03]">
                              {person.phones.map((ph: any, i: number) => (
                                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                                  <div>
                                    <p className="text-[#1D1D1F] text-sm font-semibold font-mono">{ph.number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}</p>
                                    <p className="text-[#A1A1A6] text-xs">{ph.type || "Phone"}{ph.dnc ? " \u00b7 \u26d4 DNC" : " \u00b7 \u2705 Not DNC"}</p>
                                  </div>
                                  <a href={`tel:${ph.number}`} className="w-9 h-9 rounded-xl bg-[#01696F] flex items-center justify-center shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Emails */}
                          {person.emails?.length > 0 && (
                            <div className="divide-y divide-black/[0.03]">
                              {person.emails.map((em: string, i: number) => (
                                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                                  <div><p className="text-[#1D1D1F] text-sm">{em}</p><p className="text-[#A1A1A6] text-xs">Email</p></div>
                                  <a href={`mailto:${em}`} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-[#6E6E73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Mailing address */}
                          {person.mailing_address && (
                            <div className="px-4 py-2.5 border-t border-black/[0.03]">
                              <p className="text-[#A1A1A6] text-[10px] uppercase tracking-wider">Mailing Address</p>
                              <p className="text-[#6E6E73] text-xs">{person.mailing_address.street}, {person.mailing_address.city}, {person.mailing_address.state} {person.mailing_address.zip}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!selectedPermit.skip_trace_data.persons?.length) && (
                        <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200/40">
                          <p className="text-amber-700 text-sm font-medium">No results found</p>
                          <p className="text-amber-600/70 text-xs mt-0.5">This address may be an intersection, subdivision name, or commercial property. Try a residential street address for best results.</p>
                          <button onClick={async () => {
                            await fetch("/api/permit-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId: selectedPermit.id }) });
                            setSelectedPermit({ ...selectedPermit, skip_trace_data: null });
                          }} className="mt-2 text-[#01696F] text-xs font-medium underline">Clear and retry</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={async (e) => { e.stopPropagation(); const b=e.currentTarget; b.disabled=true; b.textContent="Tracing..."; try { const r=await fetch("/api/skip-trace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({permitId:selectedPermit.id})}); const d=await r.json(); if(d.ok){setSelectedPermit({...selectedPermit,skip_trace_data:d.data}); setPermits(prev => prev.map(p => p.id === selectedPermit.id ? {...p, skip_trace_data: d.data} : p)); b.textContent="Done";}else{alert(d.error);b.disabled=false;b.textContent="Skip Trace This Address";}}catch{b.disabled=false;b.textContent="Skip Trace This Address";}}}
                      disabled={!selectedPermit.address} className="w-full py-3 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                      Skip Trace This Address
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => toggleStar(selectedPermit.id)} className={`flex-1 py-3 rounded-xl font-medium text-sm shadow-sm ${viewsMap[selectedPermit.id]?.starred?"bg-amber-50 border border-amber-200/60 text-amber-700":"bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{viewsMap[selectedPermit.id]?.starred?"★ Saved":"☆ Save Lead"}</button>
                  <button onClick={exportCSV} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-[#6E6E73] text-sm font-medium hover:bg-gray-50 shadow-sm">Export</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
