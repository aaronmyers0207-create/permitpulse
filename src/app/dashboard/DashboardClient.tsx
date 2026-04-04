"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRY_MAP, COVERED_STATES } from "@/lib/industries";
import { getUserTier } from "@/lib/tiers";
import { CYCLE_MAP } from "@/lib/prospecting";

const CAT: Record<string, { label: string; bg: string }> = {
  hvac:              { label: "HVAC",             bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  roofing:           { label: "Roofing",          bg: "bg-orange-50 text-orange-700 border-orange-200/60" },
  electrical:        { label: "Electrical",       bg: "bg-amber-50 text-amber-700 border-amber-200/60" },
  plumbing:          { label: "Plumbing",         bg: "bg-blue-50 text-blue-700 border-blue-200/60" },
  solar:             { label: "Solar",            bg: "bg-yellow-50 text-yellow-700 border-yellow-200/60" },
  fire:              { label: "Fire Protection",  bg: "bg-red-50 text-red-700 border-red-200/60" },
  demolition:        { label: "Demolition",       bg: "bg-rose-50 text-rose-700 border-rose-200/60" },
  pool:              { label: "Pool/Spa",         bg: "bg-cyan-50 text-cyan-700 border-cyan-200/60" },
  fence:             { label: "Fence",            bg: "bg-lime-50 text-lime-700 border-lime-200/60" },
  concrete:          { label: "Concrete",         bg: "bg-stone-100 text-stone-700 border-stone-200/60" },
  windows_doors:     { label: "Windows/Doors",    bg: "bg-sky-50 text-sky-700 border-sky-200/60" },
  insulation:        { label: "Insulation",       bg: "bg-pink-50 text-pink-700 border-pink-200/60" },
  new_construction:  { label: "New Construction", bg: "bg-purple-50 text-purple-700 border-purple-200/60" },
  renovation:        { label: "Renovation",       bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60" },
  general:           { label: "General",          bg: "bg-gray-100 text-gray-600 border-gray-200/60" },
};

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
  const [mode, setMode] = useState<"new" | "replacement">("new");
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
    if (cat) params.set("category", cat);
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
  }, [pageSize, profile?.states, mode]);

  useEffect(() => { setPage(1); fetchPage(1, filterCategory, filterState, search); }, [filterCategory, filterState, mode, fetchPage]);

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
    a.download=`permitpulse-${filterCategory||"all"}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Leads", value: total.toLocaleString(), sub: `across ${new Set(permits.map((p:any)=>p.state)).size} states` },
            { label: "Showing", value: String(permits.length), sub: `page ${page} of ${totalPages||1}` },
            { label: "Starred", value: String(starredCount), sub: "saved leads" },
            { label: "Sources", value: "12", sub: "city data feeds" },
          ].map((s) => (
            <div key={s.label} className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm px-4 py-3.5">
              <p className="text-[#A1A1A6] text-xs mb-0.5">{s.label}</p>
              <p className="text-[#1D1D1F] text-xl font-bold font-mono leading-tight">{s.value}</p>
              <p className="text-[#A1A1A6] text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-xl p-1 shadow-sm">
            <button onClick={() => setMode("new")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="new"?"bg-[#01696F] text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>New Permits</button>
            <button onClick={() => setMode("replacement")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode==="replacement"?"bg-amber-500 text-white shadow-sm":"text-[#6E6E73] hover:text-[#1D1D1F]"}`}>Replacement Ready</button>
          </div>
          {mode==="replacement"&&filterCategory&&CYCLE_MAP[filterCategory]&&<span className="text-[#6E6E73] text-xs ml-2">Showing {CYCLE_MAP[filterCategory].label} permits from {CYCLE_MAP[filterCategory].prospectAfter}-{CYCLE_MAP[filterCategory].lifespan} years ago</span>}
          {mode==="replacement"&&!filterCategory&&<span className="text-amber-600/60 text-xs ml-2">Select a category to see replacement-ready permits</span>}
        </div>

        {/* Replacement pitch */}
        {mode==="replacement"&&filterCategory&&CYCLE_MAP[filterCategory]&&(
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/40 rounded-2xl px-5 py-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-amber-600 text-lg mt-0.5">💡</span>
              <div>
                <p className="text-amber-800 text-sm font-medium mb-1">Sales Angle: {CYCLE_MAP[filterCategory].label}</p>
                <p className="text-amber-700/70 text-sm leading-relaxed">{CYCLE_MAP[filterCategory].pitch}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tier limit */}
        {tierLimited&&(
          <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[#1D1D1F] text-sm font-medium">You've reached your {tier.name} plan limit</p>
              <p className="text-[#A1A1A6] text-xs mt-0.5">Upgrade to see more permits and unlock additional skip traces.</p>
            </div>
            <a href="/settings" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl transition-colors shadow-sm shrink-0">Upgrade</a>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" value={search} onChange={(e)=>handleSearch(e.target.value)} placeholder="Search address, contractor..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 shadow-sm transition-all"/>
          </div>
          <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#01696F] shadow-sm">
            <option value="">All categories</option>
            {categoryOptions.map(([key,c])=>(<option key={key} value={key}>{industry?.categories.includes(key)?`★ ${c.label}`:c.label}</option>))}
          </select>
          <select value={filterState} onChange={(e)=>setFilterState(e.target.value)} className="bg-white border border-gray-200 text-[#1D1D1F] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#01696F] shadow-sm">
            <option value="">All states</option>
            {COVERED_STATES.map((st)=>(<option key={st.code} value={st.code}>{st.code} — {st.name}</option>))}
          </select>
          <div className="hidden sm:block flex-1"/>
          <span className="text-[#A1A1A6] text-xs">{total.toLocaleString()} results</span>
          <button onClick={exportCSV} className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#6E6E73] rounded-xl text-sm transition-colors shadow-sm">Export</button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#01696F]/30 border-t-[#01696F] rounded-full animate-spin"/></div>
        ) : permits.length===0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">📋</p>
            <h3 className="text-[#1D1D1F] text-lg font-semibold mb-1">No permits found</h3>
            <p className="text-[#6E6E73] text-sm">{total===0?<>Sync data from the <a href="/admin" className="text-[#01696F] underline">Admin panel</a>.</>:"Try adjusting your filters."}</p>
          </div>
        ) : (
          <>
            <div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-3 py-3"/>
                    <th className="px-3 py-3 text-left text-[#A1A1A6] text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-left text-[#A1A1A6] text-xs font-medium uppercase tracking-wider">Address</th>
                    <th className="px-3 py-3 text-left text-[#A1A1A6] text-xs font-medium uppercase tracking-wider hidden md:table-cell">Filed</th>
                    <th className="px-3 py-3 text-right text-[#A1A1A6] text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Value</th>
                    <th className="px-3 py-3 text-left text-[#A1A1A6] text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Contractor</th>
                    <th className="px-3 py-3 text-left text-[#A1A1A6] text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {permits.map((p:any)=>{const c=CAT[p.category]||CAT.general;const isStarred=starredMap[p.id]?.starred;return(
                    <tr key={p.id} onClick={()=>setSelectedPermit(p)} className="hover:bg-[#01696F]/[0.02] cursor-pointer transition-colors group">
                      <td className="px-3 py-3"><button onClick={(e)=>toggleStar(p.id,e)} className={`text-base transition-transform hover:scale-110 ${isStarred?"":"opacity-20 group-hover:opacity-50"}`}>{isStarred?"⭐":"☆"}</button></td>
                      <td className="px-3 py-3"><span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${c.bg}`}>{c.label}</span></td>
                      <td className="px-3 py-3"><div className="text-[#1D1D1F] text-sm leading-tight">{p.address}</div><div className="text-[#A1A1A6] text-xs">{p.city}, {p.state} {p.zip_code}</div></td>
                      <td className="px-3 py-3 text-[#6E6E73] text-sm hidden md:table-cell">{p.filed_date}</td>
                      <td className="px-3 py-3 text-right text-[#01696F] text-sm font-mono font-medium hidden sm:table-cell">{p.estimated_value?"$"+Number(p.estimated_value).toLocaleString():"—"}</td>
                      <td className="px-3 py-3 text-[#6E6E73] text-sm hidden lg:table-cell truncate max-w-[180px]">{p.contractor_name||"—"}</td>
                      <td className="px-3 py-3 text-[#6E6E73] text-sm hidden lg:table-cell truncate max-w-[180px]">{p.applicant_name||"—"}</td>
                    </tr>);})}
                </tbody>
              </table>
            </div>

            {totalPages>1&&(
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <button onClick={()=>goToPage(page-1)} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 transition-colors shadow-sm">Prev</button>
                {pageNums().map((n,i)=>n==="..."?(<span key={`d${i}`} className="px-1.5 text-gray-300">...</span>):(<button key={n} onClick={()=>goToPage(n as number)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors shadow-sm ${n===page?"bg-[#01696F] border-[#01696F] text-white":"bg-white border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{n}</button>))}
                <button onClick={()=>goToPage(page+1)} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50 disabled:opacity-25 transition-colors shadow-sm">Next</button>
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
            <div className="glass-strong sticky top-0 border-b border-black/[0.04] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#1D1D1F] font-semibold">Permit Details</h2>
              <button onClick={()=>setSelectedPermit(null)} className="text-[#A1A1A6] hover:text-[#1D1D1F] text-xl transition-colors">&times;</button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center gap-2.5">
                {(()=>{const c=CAT[selectedPermit.category]||CAT.general;return<span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${c.bg}`}>{c.label}</span>;})()}
                <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-100 border-gray-200 text-[#6E6E73]">{selectedPermit.status}</span>
              </div>
              <div>
                <p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1">Property Address</p>
                <p className="text-[#1D1D1F] text-lg font-medium leading-snug">{selectedPermit.address}</p>
                <p className="text-[#6E6E73] text-sm">{selectedPermit.city}, {selectedPermit.state} {selectedPermit.zip_code}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{label:"Filed Date",value:selectedPermit.filed_date||"—"},{label:"Issued Date",value:selectedPermit.issued_date||"—"},{label:"Est. Value",value:selectedPermit.estimated_value?`$${Number(selectedPermit.estimated_value).toLocaleString()}`:"—"},{label:"Permit Type",value:selectedPermit.permit_type||"—"}].map((d)=>(
                  <div key={d.label}><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-0.5">{d.label}</p><p className="text-[#1D1D1F] text-sm font-medium">{d.value}</p></div>))}
              </div>
              <div className="space-y-3">
                {selectedPermit.applicant_name&&(<div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-xl px-4 py-3 shadow-sm"><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-0.5">Property Owner</p><p className="text-[#1D1D1F] text-sm font-medium">{selectedPermit.applicant_name}</p></div>)}
                {selectedPermit.contractor_name&&(<div className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-xl px-4 py-3 shadow-sm"><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-0.5">Contractor</p><p className="text-[#1D1D1F] text-sm font-medium">{selectedPermit.contractor_name}</p></div>)}
              </div>
              {selectedPermit.description&&(<div><p className="text-[#A1A1A6] text-xs uppercase tracking-wider mb-1">Description</p><p className="text-[#6E6E73] text-sm leading-relaxed">{selectedPermit.description}</p></div>)}
              <div className="flex gap-2">
                <button onClick={()=>toggleStar(selectedPermit.id)} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm ${starredMap[selectedPermit.id]?.starred?"bg-amber-50 border border-amber-200/60 text-amber-700":"bg-white border border-gray-200 text-[#6E6E73] hover:bg-gray-50"}`}>{starredMap[selectedPermit.id]?.starred?"★ Starred":"☆ Star this lead"}</button>
                <button onClick={exportCSV} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-[#6E6E73] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">Export</button>
              </div>
              <div className="pt-4 border-t border-black/[0.04]"><p className="text-[#A1A1A6] text-xs">Source: {selectedPermit.source_id} &middot; ID: {selectedPermit.source_permit_id}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
