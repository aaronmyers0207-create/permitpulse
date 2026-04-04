"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRY_MAP, COVERED_STATES } from "@/lib/industries";
import { getUserTier } from "@/lib/tiers";
import { CYCLE_MAP, getUpsellsForIndustry, type UpsellOpportunity } from "@/lib/prospecting";

const CAT: Record<string, { label: string; bg: string; dot: string }> = {
  hvac:              { label: "HVAC",             bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-400" },
  roofing:           { label: "Roofing",          bg: "bg-orange-50 text-orange-700 border-orange-200/60", dot: "bg-orange-400" },
  electrical:        { label: "Electrical",       bg: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-400" },
  plumbing:          { label: "Plumbing",         bg: "bg-blue-50 text-blue-700 border-blue-200/60", dot: "bg-blue-400" },
  solar:             { label: "Solar",            bg: "bg-yellow-50 text-yellow-700 border-yellow-200/60", dot: "bg-yellow-400" },
  fire:              { label: "Fire Protection",  bg: "bg-red-50 text-red-700 border-red-200/60", dot: "bg-red-400" },
  demolition:        { label: "Demolition",       bg: "bg-rose-50 text-rose-700 border-rose-200/60", dot: "bg-rose-400" },
  pool:              { label: "Pool/Spa",         bg: "bg-cyan-50 text-cyan-700 border-cyan-200/60", dot: "bg-cyan-400" },
  fence:             { label: "Fence",            bg: "bg-lime-50 text-lime-700 border-lime-200/60", dot: "bg-lime-400" },
  concrete:          { label: "Concrete",         bg: "bg-stone-100 text-stone-700 border-stone-200/60", dot: "bg-stone-400" },
  windows_doors:     { label: "Windows/Doors",    bg: "bg-sky-50 text-sky-700 border-sky-200/60", dot: "bg-sky-400" },
  insulation:        { label: "Insulation",       bg: "bg-pink-50 text-pink-700 border-pink-200/60", dot: "bg-pink-400" },
  new_construction:  { label: "New Construction", bg: "bg-purple-50 text-purple-700 border-purple-200/60", dot: "bg-purple-400" },
  renovation:        { label: "Renovation",       bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60", dot: "bg-indigo-400" },
  general:           { label: "General",          bg: "bg-gray-100 text-gray-600 border-gray-200/60", dot: "bg-gray-400" },
};

function daysAgo(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 0) return "upcoming";
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}yr ago`;
}

function isHot(dateStr: string): boolean {
  if (!dateStr) return false;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diff >= 0 && diff <= 7;
}

interface Props { profile: any; initialPermits: any[]; totalCount: number; pageSize: number; viewsMap: Record<string, { starred: boolean; notes: string | null }>; }

export default function DashboardClient({ profile, initialPermits, totalCount, pageSize, viewsMap: initialViews }: Props) {
  const [permits, setPermits] = useState(initialPermits);
  const [total, setTotal] = useState(totalCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [starredMap, setStarredMap] = useState(initialViews);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);

  const industry = INDUSTRY_MAP[profile?.industry] || null;
  const tier = getUserTier(profile);
  const [mode, setMode] = useState<"new" | "replacement" | "upsell">("new");
  const [activeUpsell, setActiveUpsell] = useState<UpsellOpportunity | null>(null);
  const upsells = industry ? getUpsellsForIndustry(industry.id) : [];
  const [filterCategory, setFilterCategory] = useState("");
  const [filterState, setFilterState] = useState("");
  const [tierLimited, setTierLimited] = useState(false);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);

  const router = useRouter();
  const supabase = createClient();
  const totalPages = Math.ceil(total / pageSize);

  const fetchPage = useCallback(async (p: number, cat: string, st: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    params.set("mode", mode);
    if (mode === "upsell" && activeUpsell) {
      params.set("upsell_category", activeUpsell.lookForCategory);
      params.set("upsell_min_age", String(activeUpsell.minAge));
      params.set("upsell_max_age", String(activeUpsell.maxAge));
    } else if (cat) {
      params.set("category", cat);
    }
    if (st) params.set("state", st);
    if (q) params.set("q", q);
    const userStates = profile?.states as string[] | null;
    if (!st && userStates && userStates.length > 0 && userStates.length < 9) params.set("states", userStates.join(","));
    try {
      const res = await fetch(`/api/permits?${params.toString()}`);
      const data = await res.json();
      if (data.permits) { setPermits(data.permits); setTotal(data.total); setTierLimited(!!data.tierLimited); }
    } catch (err) { console.error("Fetch error", err); }
    setLoading(false);
  }, [pageSize, profile?.states, mode, activeUpsell]);

  useEffect(() => { setPage(1); fetchPage(1, filterCategory, filterState, search); }, [filterCategory, filterState, mode, activeUpsell, fetchPage]);

  const handleSearch = (val: string) => {
    setSearch(val); clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); fetchPage(1, filterCategory, filterState, val); }, 400);
  };

  const goToPage = (p: number) => { if (p < 1 || p > totalPages) return; setPage(p); fetchPage(p, filterCategory, filterState, search); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const toggleStar = async (permitId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = starredMap[permitId]; const newStarred = !current?.starred;
    setStarredMap((prev) => ({ ...prev, [permitId]: { starred: newStarred, notes: current?.notes || null } }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("permit_views").upsert({ user_id: user.id, permit_id: permitId, starred: newStarred, viewed_at: new Date().toISOString() });
  };

  const exportCSV = () => {
    const headers = ["Category","Type","Address","City","State","Zip","Filed","Value","Contractor","Owner","Description"];
    const rows = permits.map((p: any) => [p.category,p.permit_type,`"${(p.address||"").replace(/"/g,'""')}"`,p.city,p.state,p.zip_code,p.filed_date,p.estimated_value,`"${(p.contractor_name||"").replace(/"/g,'""')}"`,`"${(p.applicant_name||"").replace(/"/g,'""')}"`,`"${(p.description||"").replace(/"/g,'""')}"`]);
    const csv = [headers,...rows].map((r)=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`permitpulse-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const pageNums = () => {
    const p:(number|"...")[]=[]; if(totalPages<=7){for(let i=1;i<=totalPages;i++)p.push(i);return p;}
    p.push(1); if(page>3)p.push("..."); for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++)p.push(i);
    if(page<totalPages-2)p.push("..."); p.push(totalPages); return p;
  };

  const starredCount = Object.values(starredMap).filter((v) => v.starred).length;
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };
  const categoryOptions = industry?.categories.length
    ? Object.entries(CAT).sort(([a],[b])=>{const ar=industry.categories.includes(a)?0:1;const br=industry.categories.includes(b)?0:1;return ar-br;})
    : Object.entries(CAT);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-30 border-b border-black/[0.04] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#01696F] flex items-center justify-center text-white font-bold text-sm shadow-sm">P</div>
            <span className="text-[#1D1D1F] font-semibold tracking-tight">PermitPulse</span>
            {industry && <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-[#01696F]/[0.06] text-[#01696F] text-xs font-medium">{industry.icon} {industry.label}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[#6E6E73] text-sm">{profile?.company_name}</span>
            <a href="/settings" className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Settings</a>
            <a href="/admin" className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Admin</a>
            <button onClick={handleLogout} className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero stats */}
        <div className="mb-6">
          <h1 className="text-[#1D1D1F] text-2xl font-bold tracking-tight mb-1">
            {mode === "new" ? "Fresh Leads" : mode === "replacement" ? "Replacement Opportunities" : "Upsell Opportunities"}
          </h1>
          <p className="text-[#6E6E73] text-sm">
            {total.toLocaleString()} permits found &middot; Page {page} of {totalPages || 1} &middot; {starredCount} starred
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="inline-flex bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-xl p-1 shadow-sm">
            <button onClick={() => { setMode("new"); setActiveUpsell(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="new"?"bg-[#01696F] text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Fresh Leads</button>
            <button onClick={() => { setMode("replacement"); setActiveUpsell(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="replacement"?"bg-amber-500 text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Replacement</button>
            {upsells.length > 0 && <button onClick={() => { setMode("upsell"); if (!activeUpsell && upsells[0]) setActiveUpsell(upsells[0]); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="upsell"?"bg-purple-500 text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Upsell</button>}
          </div>
        </div>

        {/* Upsell selector */}
        {mode==="upsell"&&upsells.length>0&&(
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {upsells.map((u, i) => (
                <button key={i} onClick={() => setActiveUpsell(u)} className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all shadow-sm ${activeUpsell === u ? "bg-purple-50 border-purple-300 text-purple-700 ring-1 ring-purple-200" : "bg-white border-gray-200 text-[#6E6E73] hover:border-gray-300"}`}>{u.lookForLabel}</button>
              ))}
            </div>
            {activeUpsell && (
              <div className="bg-purple-50/80 border border-purple-200/40 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-purple-800 text-sm font-medium mb-1">🎯 {activeUpsell.lookForLabel}</p>
                <p className="text-purple-700/70 text-sm leading-relaxed">{activeUpsell.pitch}</p>
              </div>
            )}
          </div>
        )}

        {/* Replacement pitch */}
        {mode==="replacement"&&filterCategory&&CYCLE_MAP[filterCategory]&&(
          <div className="bg-amber-50/80 border border-amber-200/40 rounded-2xl px-5 py-4 mb-5 shadow-sm">
            <p className="text-amber-800 text-sm font-medium mb-1">💡 {CYCLE_MAP[filterCategory].label} — {CYCLE_MAP[filterCategory].prospectAfter}-{CYCLE_MAP[filterCategory].lifespan} years old</p>
            <p className="text-amber-700/70 text-sm leading-relaxed">{CYCLE_MAP[filterCategory].pitch}</p>
          </div>
        )}
        {mode==="replacement"&&!filterCategory&&(
          <div className="bg-amber-50/50 border border-amber-200/30 rounded-2xl px-5 py-4 mb-5 shadow-sm text-amber-700 text-sm">Pick a category below to find systems due for replacement.</div>
        )}

        {/* Tier limit */}
        {tierLimited&&(
          <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between shadow-sm">
            <div><p className="text-[#1D1D1F] text-sm font-medium">You've hit your {tier.name} plan limit</p><p className="text-[#A1A1A6] text-xs mt-0.5">Upgrade for more permits and skip traces.</p></div>
            <a href="/settings" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl transition-colors shadow-sm shrink-0">Upgrade</a>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" value={search} onChange={(e)=>handleSearch(e.target.value)} placeholder="Search address, contractor, owner..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 shadow-sm transition-all"/>
          </div>
          {mode !== "upsell" && (
            <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#01696F] shadow-sm">
              <option value="">All categories</option>
              {categoryOptions.map(([key,c])=>(<option key={key} value={key}>{industry?.categories.includes(key)?`★ ${c.label}`:c.label}</option>))}
            </select>
          )}
          <select value={filterState} onChange={(e)=>setFilterState(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#01696F] shadow-sm">
            <option value="">All states</option>
            {COVERED_STATES.map((st)=>(<option key={st.code} value={st.code}>{st.code} — {st.name}</option>))}
          </select>
          <div className="hidden sm:block flex-1"/>
          <button onClick={exportCSV} className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#6E6E73] rounded-xl text-sm font-medium transition-colors shadow-sm">Export CSV</button>
        </div>

        {/* Lead cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-[#01696F]/30 border-t-[#01696F] rounded-full animate-spin"/></div>
        ) : permits.length===0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📋</span></div>
            <h3 className="text-[#1D1D1F] text-lg font-semibold mb-1">No permits found</h3>
            <p className="text-[#6E6E73] text-sm">{total===0?<>Sync data from the <a href="/admin" className="text-[#01696F] underline">Admin panel</a>.</>:"Try adjusting your filters or switching modes."}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {permits.map((p: any) => {
                const c = CAT[p.category] || CAT.general;
                const starred = starredMap[p.id]?.starred;
                const hot = isHot(p.filed_date);
                const hasOwner = !!p.applicant_name;
                const hasContractor = !!p.contractor_name;
                const val = p.estimated_value ? Number(p.estimated_value) : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPermit(p)}
                    className={`bg-white/70 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                      hot ? "border-[#01696F]/20 ring-1 ring-[#01696F]/5" : "border-black/[0.04]"
                    }`}
                  >
                    <div className="px-5 py-4 flex items-start gap-4">
                      {/* Star */}
                      <button onClick={(e) => toggleStar(p.id, e)} className={`mt-1 text-lg transition-all hover:scale-110 ${starred ? "" : "opacity-20 group-hover:opacity-50"}`}>
                        {starred ? "⭐" : "☆"}
                      </button>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${c.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
                            {c.label}
                          </span>
                          {hot && <span className="px-2 py-0.5 rounded-md bg-[#01696F]/10 text-[#01696F] text-xs font-medium">🔥 New</span>}
                          {val >= 100000 && <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">💰 High Value</span>}
                          <span className="text-[#A1A1A6] text-xs">{daysAgo(p.filed_date)}</span>
                        </div>

                        <h3 className="text-[#1D1D1F] text-[15px] font-semibold leading-snug mb-0.5 truncate">{p.address}</h3>
                        <p className="text-[#6E6E73] text-xs mb-2">{p.city}, {p.state} {p.zip_code}</p>

                        <div className="flex items-center gap-4 flex-wrap">
                          {val > 0 && <span className="text-[#01696F] text-sm font-bold font-mono">${val.toLocaleString()}</span>}
                          {hasOwner && (
                            <span className="flex items-center gap-1 text-xs text-[#6E6E73]">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                              {p.applicant_name}
                            </span>
                          )}
                          {hasContractor && (
                            <span className="flex items-center gap-1 text-xs text-[#A1A1A6]">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                              {p.contractor_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right arrow */}
                      <svg className="w-5 h-5 text-[#A1A1A6] opacity-0 group-hover:opacity-100 transition-opacity mt-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6">
                <button onClick={()=>goToPage(page-1)} disabled={page===1} className="px-3.5 py-2 text-sm rounded-xl bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 transition-colors shadow-sm">Prev</button>
                {pageNums().map((n,i)=>n==="..."?(<span key={`d${i}`} className="px-2 text-gray-300">...</span>):(<button key={n} onClick={()=>goToPage(n as number)} className={`px-3.5 py-2 text-sm rounded-xl border transition-colors shadow-sm ${n===page?"bg-[#01696F] border-[#01696F] text-white":"bg-white border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{n}</button>))}
                <button onClick={()=>goToPage(page+1)} disabled={page===totalPages} className="px-3.5 py-2 text-sm rounded-xl bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 transition-colors shadow-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedPermit&&(
        <div className="fixed inset-0 z-50 flex justify-end" onClick={()=>setSelectedPermit(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"/>
          <div className="relative w-full max-w-lg bg-[#F7F6F2] border-l border-black/[0.06] overflow-y-auto shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="glass-strong sticky top-0 border-b border-black/[0.04] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-[#1D1D1F] font-semibold">Lead Details</h2>
              <button onClick={()=>setSelectedPermit(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#6E6E73] transition-colors">&times;</button>
            </div>
            <div className="px-6 py-6 space-y-5">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {(()=>{const c=CAT[selectedPermit.category]||CAT.general;return<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{c.label}</span>;})()}
                {isHot(selectedPermit.filed_date) && <span className="px-2 py-1 rounded-lg bg-[#01696F]/10 text-[#01696F] text-xs font-medium">🔥 New Lead</span>}
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200/60 text-[#6E6E73] text-xs">{selectedPermit.status}</span>
              </div>

              {/* Address hero */}
              <div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl p-5 shadow-sm">
                <p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1">Property</p>
                <p className="text-[#1D1D1F] text-xl font-bold leading-snug">{selectedPermit.address}</p>
                <p className="text-[#6E6E73] text-sm mt-1">{selectedPermit.city}, {selectedPermit.state} {selectedPermit.zip_code}</p>
                {selectedPermit.estimated_value && <p className="text-[#01696F] text-2xl font-bold font-mono mt-3">${Number(selectedPermit.estimated_value).toLocaleString()}</p>}
              </div>

              {/* Key details */}
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Filed",value:selectedPermit.filed_date?`${selectedPermit.filed_date} (${daysAgo(selectedPermit.filed_date)})`:"—"},{label:"Issued",value:selectedPermit.issued_date||"—"},{label:"Type",value:selectedPermit.permit_type||"—"},{label:"Status",value:selectedPermit.status||"—"}].map((d)=>(
                  <div key={d.label} className="bg-white/50 rounded-xl px-3 py-2.5">
                    <p className="text-[#A1A1A6] text-xs mb-0.5">{d.label}</p>
                    <p className="text-[#1D1D1F] text-sm font-medium">{d.value}</p>
                  </div>))}
              </div>

              {/* People - make them pop */}
              {selectedPermit.applicant_name && (
                <div className="bg-white/70 backdrop-blur-xl border border-[#01696F]/10 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#01696F]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#01696F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                    <div>
                      <p className="text-[#A1A1A6] text-xs">Property Owner</p>
                      <p className="text-[#1D1D1F] text-sm font-semibold">{selectedPermit.applicant_name}</p>
                    </div>
                  </div>
                </div>
              )}
              {selectedPermit.contractor_name && (
                <div className="bg-white/50 border border-black/[0.04] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#6E6E73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div>
                      <p className="text-[#A1A1A6] text-xs">Contractor</p>
                      <p className="text-[#1D1D1F] text-sm font-medium">{selectedPermit.contractor_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedPermit.description && (
                <div><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1">Description</p><p className="text-[#6E6E73] text-sm leading-relaxed">{selectedPermit.description}</p></div>
              )}

              {/* Skip Trace CTA */}
              <div className="bg-gradient-to-br from-[#01696F]/[0.06] to-[#01696F]/[0.02] border border-[#01696F]/15 rounded-2xl p-5">
                <p className="text-[#1D1D1F] font-semibold text-sm mb-1">Skip Trace</p>
                <p className="text-[#6E6E73] text-xs mb-3">Get phone numbers, emails, and mailing address for this property owner.</p>
                {selectedPermit.skip_trace_data && Object.keys(selectedPermit.skip_trace_data).length > 0 ? (
                  <div className="bg-white/80 rounded-xl px-4 py-3">
                    <p className="text-emerald-600 text-sm font-medium">Skip trace submitted</p>
                    <p className="text-[#A1A1A6] text-xs mt-1">Status: {selectedPermit.skip_trace_data.status} &middot; Queue: {selectedPermit.skip_trace_data.queue_id}</p>
                  </div>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation(); const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Tracing...";
                      try {
                        const res = await fetch("/api/skip-trace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId: selectedPermit.id }) });
                        const data = await res.json();
                        if (data.ok) { setSelectedPermit({ ...selectedPermit, skip_trace_data: data.data }); btn.textContent = "Submitted"; }
                        else { alert(data.error || "Skip trace failed"); btn.disabled = false; btn.textContent = "Skip Trace Owner"; }
                      } catch { btn.disabled = false; btn.textContent = "Skip Trace Owner"; }
                    }}
                    disabled={!selectedPermit.applicant_name}
                    className="w-full py-3 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {selectedPermit.applicant_name ? "Skip Trace Owner" : "No owner name available"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={()=>toggleStar(selectedPermit.id)} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm ${starredMap[selectedPermit.id]?.starred?"bg-amber-50 border border-amber-200/60 text-amber-700":"bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{starredMap[selectedPermit.id]?.starred?"★ Starred":"☆ Save Lead"}</button>
                <button onClick={exportCSV} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-[#6E6E73] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">Export</button>
              </div>

              <div className="pt-3 border-t border-black/[0.04]"><p className="text-[#A1A1A6] text-xs">Source: {selectedPermit.source_id} &middot; {selectedPermit.source_permit_id}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
