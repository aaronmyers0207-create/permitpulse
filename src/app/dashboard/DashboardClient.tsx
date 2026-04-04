"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRY_MAP, COVERED_STATES } from "@/lib/industries";
import { getUserTier } from "@/lib/tiers";
import { CYCLE_MAP } from "@/lib/prospecting";

/* ── Category config ────────────────────────────────── */

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  hvac:              { label: "HVAC",             color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  roofing:           { label: "Roofing",          color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  electrical:        { label: "Electrical",       color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  plumbing:          { label: "Plumbing",         color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  solar:             { label: "Solar",            color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  fire:              { label: "Fire Protection",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
  demolition:        { label: "Demolition",       color: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20" },
  pool:              { label: "Pool/Spa",         color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  fence:             { label: "Fence",            color: "text-lime-400",   bg: "bg-lime-500/10 border-lime-500/20" },
  concrete:          { label: "Concrete",         color: "text-stone-400",  bg: "bg-stone-500/10 border-stone-500/20" },
  windows_doors:     { label: "Windows/Doors",    color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/20" },
  insulation:        { label: "Insulation",       color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20" },
  new_construction:  { label: "New Construction", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  renovation:        { label: "Renovation",       color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  general:           { label: "General",          color: "text-zinc-400",   bg: "bg-zinc-500/10 border-zinc-500/20" },
};

/* ── Props ──────────────────────────────────────────── */

interface Props {
  profile: any;
  initialPermits: any[];
  totalCount: number;
  pageSize: number;
  viewsMap: Record<string, { starred: boolean; notes: string | null }>;
}

export default function DashboardClient({ profile, initialPermits, totalCount, pageSize, viewsMap: initialViews }: Props) {
  const [permits, setPermits] = useState(initialPermits);
  const [total, setTotal] = useState(totalCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [starredMap, setStarredMap] = useState(initialViews);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);

  // Filters + mode
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

  /* ── Data fetching ──────────────────────────────── */

  const fetchPage = useCallback(async (p: number, cat: string, st: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    params.set("mode", mode);
    if (cat) params.set("category", cat);
    if (st) params.set("state", st);
    if (q) params.set("q", q);

    // Apply user's state preferences if no specific state filter
    const userStates = profile?.states as string[] | null;
    if (!st && userStates && userStates.length > 0 && userStates.length < 9) {
      params.set("states", userStates.join(","));
    }

    try {
      const res = await fetch(`/api/permits?${params.toString()}`);
      const data = await res.json();
      if (data.permits) { setPermits(data.permits); setTotal(data.total); setTierLimited(!!data.tierLimited); }
    } catch (err) { console.error("Fetch error", err); }
    setLoading(false);
  }, [pageSize, profile?.states, mode]);

  useEffect(() => {
    setPage(1);
    fetchPage(1, filterCategory, filterState, search);
  }, [filterCategory, filterState, mode, fetchPage]); // search triggers via debounce

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, filterCategory, filterState, val);
    }, 400);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchPage(p, filterCategory, filterState, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Star toggle ────────────────────────────────── */

  const toggleStar = async (permitId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = starredMap[permitId];
    const newStarred = !current?.starred;
    setStarredMap((prev) => ({ ...prev, [permitId]: { starred: newStarred, notes: current?.notes || null } }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("permit_views").upsert({ user_id: user.id, permit_id: permitId, starred: newStarred, viewed_at: new Date().toISOString() });
    }
  };

  /* ── CSV export ─────────────────────────────────── */

  const exportCSV = () => {
    const headers = ["Category", "Type", "Address", "City", "State", "Zip", "Filed", "Value", "Contractor", "Owner", "Description"];
    const rows = permits.map((p: any) => [
      p.category, p.permit_type, `"${(p.address || "").replace(/"/g, '""')}"`,
      p.city, p.state, p.zip_code, p.filed_date, p.estimated_value,
      `"${(p.contractor_name || "").replace(/"/g, '""')}"`,
      `"${(p.applicant_name || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `permitpulse-${filterCategory || "all"}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  /* ── Pagination numbers ─────────────────────────── */

  const pageNums = () => {
    const p: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) p.push(i); return p; }
    p.push(1);
    if (page > 3) p.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) p.push(i);
    if (page < totalPages - 2) p.push("...");
    p.push(totalPages);
    return p;
  };

  const starredCount = Object.values(starredMap).filter((v) => v.starred).length;
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  /* ── Industry-specific category list for filter ── */

  const categoryOptions = industry?.categories.length
    ? Object.entries(CAT).sort(([a], [b]) => {
        const aRelevant = industry.categories.includes(a) ? 0 : 1;
        const bRelevant = industry.categories.includes(b) ? 0 : 1;
        return aRelevant - bRelevant;
      })
    : Object.entries(CAT);

  /* ── Render ─────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Nav ──────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="text-white font-semibold tracking-tight">PermitPulse</span>
            {industry && (
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">
                {industry.icon} {industry.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-zinc-500 text-sm">{profile?.company_name}</span>
            <a href="/settings" className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">Settings</a>
            <a href="/admin" className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">Admin</a>
            <button onClick={handleLogout} className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Stats row ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Leads", value: total.toLocaleString(), sub: `across ${new Set(permits.map((p: any) => p.state)).size} states` },
            { label: "Showing", value: String(permits.length), sub: `page ${page} of ${totalPages || 1}` },
            { label: "Starred", value: String(starredCount), sub: "saved leads" },
            { label: "Sources", value: "12", sub: "city data feeds" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3.5">
              <p className="text-zinc-500 text-xs mb-0.5">{s.label}</p>
              <p className="text-white text-xl font-bold font-mono leading-tight">{s.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Prospecting Mode Toggle ────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setMode("new")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              mode === "new"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
            }`}
          >
            New Permits
          </button>
          <button
            onClick={() => setMode("replacement")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              mode === "replacement"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
            }`}
          >
            Replacement Ready
          </button>
          {mode === "replacement" && filterCategory && CYCLE_MAP[filterCategory] && (
            <span className="text-zinc-500 text-xs ml-2">
              Showing {CYCLE_MAP[filterCategory].label} permits from {CYCLE_MAP[filterCategory].prospectAfter}-{CYCLE_MAP[filterCategory].lifespan} years ago
            </span>
          )}
          {mode === "replacement" && !filterCategory && (
            <span className="text-amber-500/60 text-xs ml-2">
              Select a category to see replacement-ready permits
            </span>
          )}
        </div>

        {/* ── Replacement pitch card ─────────────── */}
        {mode === "replacement" && filterCategory && CYCLE_MAP[filterCategory] && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg mt-0.5">💡</span>
              <div>
                <p className="text-amber-300/90 text-sm font-medium mb-1">Sales Angle: {CYCLE_MAP[filterCategory].label}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{CYCLE_MAP[filterCategory].pitch}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tier limit banner ──────────────────── */}
        {tierLimited && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">You've reached your {tier.name} plan limit</p>
              <p className="text-zinc-500 text-xs mt-0.5">Upgrade to see more permits and unlock additional skip traces.</p>
            </div>
            <a href="/settings" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors shrink-0">
              Upgrade
            </a>
          </div>
        )}

        {/* ── Filters ────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search address, contractor..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm placeholder-zinc-600 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50">
            <option value="">All categories</option>
            {categoryOptions.map(([key, c]) => (
              <option key={key} value={key}>
                {industry?.categories.includes(key) ? `★ ${c.label}` : c.label}
              </option>
            ))}
          </select>

          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50">
            <option value="">All states</option>
            {COVERED_STATES.map((st) => (
              <option key={st.code} value={st.code}>{st.code} — {st.name}</option>
            ))}
          </select>

          <div className="hidden sm:block flex-1" />
          <span className="text-zinc-600 text-xs">{total.toLocaleString()} results</span>
          <button onClick={exportCSV} className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded-lg text-sm transition-colors">
            Export
          </button>
        </div>

        {/* ── Table ──────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : permits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">📋</p>
            <h3 className="text-white text-lg font-semibold mb-1">No permits found</h3>
            <p className="text-zinc-500 text-sm">{total === 0 ? <>Sync data from the <a href="/admin" className="text-green-400 underline">Admin panel</a>.</> : "Try adjusting your filters."}</p>
          </div>
        ) : (
          <>
            <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
                    <th className="w-10 px-3 py-3"></th>
                    <th className="px-3 py-3 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider">Address</th>
                    <th className="px-3 py-3 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Filed</th>
                    <th className="px-3 py-3 text-right text-zinc-500 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Value</th>
                    <th className="px-3 py-3 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Contractor</th>
                    <th className="px-3 py-3 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((p: any) => {
                    const c = CAT[p.category] || CAT.general;
                    const isStarred = starredMap[p.id]?.starred;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPermit(p)}
                        className="border-b border-zinc-800/30 hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-3 py-3">
                          <button onClick={(e) => toggleStar(p.id, e)} className={`text-base transition-transform hover:scale-110 ${isStarred ? "" : "opacity-30 group-hover:opacity-60"}`}>
                            {isStarred ? "⭐" : "☆"}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${c.bg}`}>
                            {c.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-white text-sm leading-tight">{p.address}</div>
                          <div className="text-zinc-600 text-xs">{p.city}, {p.state} {p.zip_code}</div>
                        </td>
                        <td className="px-3 py-3 text-zinc-500 text-sm hidden md:table-cell">{p.filed_date}</td>
                        <td className="px-3 py-3 text-right text-green-400/80 text-sm font-mono hidden sm:table-cell">
                          {p.estimated_value ? "$" + Number(p.estimated_value).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-3 text-zinc-500 text-sm hidden lg:table-cell truncate max-w-[180px]">{p.contractor_name || "—"}</td>
                        <td className="px-3 py-3 text-zinc-500 text-sm hidden lg:table-cell truncate max-w-[180px]">{p.applicant_name || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-800 disabled:opacity-25 transition-colors">
                  Prev
                </button>
                {pageNums().map((n, i) =>
                  n === "..." ? (
                    <span key={`d${i}`} className="px-1.5 text-zinc-700">...</span>
                  ) : (
                    <button key={n} onClick={() => goToPage(n as number)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${n === page ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800"}`}>
                      {n}
                    </button>
                  )
                )}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-800 disabled:opacity-25 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Drawer ────────────────────────── */}
      {selectedPermit && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedPermit(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Permit Details</h2>
              <button onClick={() => setSelectedPermit(null)} className="text-zinc-500 hover:text-white text-xl transition-colors">&times;</button>
            </div>
            <div className="px-6 py-6 space-y-6">
              {/* Category + Status */}
              <div className="flex items-center gap-2.5">
                {(() => { const c = CAT[selectedPermit.category] || CAT.general; return <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${c.bg}`}>{c.label}</span>; })()}
                <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-zinc-800/50 border-zinc-700 text-zinc-400">{selectedPermit.status}</span>
              </div>

              {/* Address */}
              <div>
                <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Property Address</p>
                <p className="text-white text-lg font-medium leading-snug">{selectedPermit.address}</p>
                <p className="text-zinc-500 text-sm">{selectedPermit.city}, {selectedPermit.state} {selectedPermit.zip_code}</p>
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Filed Date", value: selectedPermit.filed_date || "—" },
                  { label: "Issued Date", value: selectedPermit.issued_date || "—" },
                  { label: "Est. Value", value: selectedPermit.estimated_value ? `$${Number(selectedPermit.estimated_value).toLocaleString()}` : "—" },
                  { label: "Permit Type", value: selectedPermit.permit_type || "—" },
                ].map((d) => (
                  <div key={d.label}>
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">{d.label}</p>
                    <p className="text-white text-sm font-medium">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* People */}
              <div className="space-y-3">
                {selectedPermit.applicant_name && (
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3">
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Property Owner</p>
                    <p className="text-white text-sm font-medium">{selectedPermit.applicant_name}</p>
                  </div>
                )}
                {selectedPermit.contractor_name && (
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3">
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Contractor</p>
                    <p className="text-white text-sm font-medium">{selectedPermit.contractor_name}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedPermit.description && (
                <div>
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Description</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{selectedPermit.description}</p>
                </div>
              )}

              {/* Star + Note */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStar(selectedPermit.id)}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
                    starredMap[selectedPermit.id]?.starred
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {starredMap[selectedPermit.id]?.starred ? "★ Starred" : "☆ Star this lead"}
                </button>
                <button onClick={exportCSV} className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors">
                  Export
                </button>
              </div>

              {/* Source info */}
              <div className="pt-4 border-t border-zinc-800/60">
                <p className="text-zinc-700 text-xs">Source: {selectedPermit.source_id} &middot; ID: {selectedPermit.source_permit_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
