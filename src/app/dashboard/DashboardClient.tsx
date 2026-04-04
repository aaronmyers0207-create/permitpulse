"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  hvac: "HVAC", roofing: "Roofing", electrical: "Electrical", plumbing: "Plumbing",
  solar: "Solar", fire: "Fire Protection", demolition: "Demolition", pool: "Pool/Spa",
  fence: "Fence", concrete: "Concrete", windows_doors: "Windows/Doors",
  insulation: "Insulation", new_construction: "New Construction",
  renovation: "Renovation", general: "General",
};

const CATEGORY_COLORS: Record<string, string> = {
  hvac: "bg-green-500/10 text-green-400 border-green-500/20",
  roofing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  electrical: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  plumbing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  solar: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  fire: "bg-red-500/10 text-red-400 border-red-500/20",
  demolition: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  pool: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  fence: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  concrete: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  windows_doors: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  insulation: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  new_construction: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  renovation: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  general: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

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

  const [filterCategory, setFilterCategory] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [starredMap, setStarredMap] = useState(initialViews);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const totalPages = Math.ceil(total / pageSize);

  // Fetch page from API
  const fetchPage = useCallback(async (p: number, cat: string, st: string, city: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    if (cat) params.set("category", cat);
    if (st) params.set("state", st);
    if (city) params.set("city", city);

    try {
      const res = await fetch(`/api/permits?${params.toString()}`);
      const data = await res.json();
      if (data.permits) {
        setPermits(data.permits);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch permits", err);
    }
    setLoading(false);
  }, [pageSize]);

  // When filters change, reset to page 1
  useEffect(() => {
    setPage(1);
    fetchPage(1, filterCategory, filterState, filterCity);
  }, [filterCategory, filterState, filterCity, fetchPage]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchPage(p, filterCategory, filterState, filterCity);
  };

  // Client-side starred filter (applies on top of server results)
  const displayPermits = showStarredOnly
    ? permits.filter((p: any) => starredMap[p.id]?.starred)
    : permits;

  const starredCount = Object.values(starredMap).filter((v: any) => v.starred).length;

  const toggleStar = async (permitId: string) => {
    const current = starredMap[permitId];
    const newStarred = !current?.starred;
    setStarredMap((prev: any) => ({ ...prev, [permitId]: { starred: newStarred, notes: current?.notes || null } }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("permit_views").upsert({ user_id: user.id, permit_id: permitId, starred: newStarred, viewed_at: new Date().toISOString() });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const exportCSV = () => {
    const headers = ["Category", "Type", "Address", "City", "State", "Zip", "Filed Date", "Est Value", "Contractor", "Description"];
    const rows = displayPermits.map((p: any) => [
      p.category, p.permit_type, `"${(p.address || "").replace(/"/g, '""')}"`,
      p.city, p.state, p.zip_code, p.filed_date, p.estimated_value,
      `"${(p.contractor_name || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "permitpulse-export.csv"; a.click();
  };

  // Build page numbers for pagination
  const pageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">P</div>
          <span className="text-white font-semibold tracking-tight">PermitPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{profile?.company_name}</span>
          <a href="/admin" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Admin</a>
          <button onClick={handleLogout} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total permits", value: total.toLocaleString() },
            { label: "Showing", value: displayPermits.length },
            { label: "Starred", value: starredCount },
            { label: "Page", value: `${page} / ${totalPages || 1}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 rounded-lg px-5 py-4">
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setFilterCity(""); }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">All states</option>
            {["CA", "FL", "IL", "LA", "MD", "NY", "OH", "TX", "WA"].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${showStarredOnly ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"}`}
          >
            {showStarredOnly ? "★ Starred" : "☆ Starred"}
          </button>

          <div className="flex-1" />
          <span className="text-zinc-500 text-sm">{total.toLocaleString()} total</span>
          <button onClick={exportCSV} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">Export CSV</button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-zinc-500 animate-pulse">Loading permits...</div>
          </div>
        ) : displayPermits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-white text-lg font-semibold mb-2">No permits found</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              {total === 0 ? (
                <>Head to the <a href="/admin" className="text-green-400 underline">Admin panel</a> and hit Sync to pull in permit data.</>
              ) : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">Filed</th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider text-right">Est. value</th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">Contractor</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPermits.map((permit: any) => (
                    <tr key={permit.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStar(permit.id)} className="text-lg">
                          {starredMap[permit.id]?.starred ? "⭐" : "☆"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"inline-block px-2.5 py-1 rounded-full text-xs font-medium border " + (CATEGORY_COLORS[permit.category] || CATEGORY_COLORS.general)}>
                          {CATEGORY_LABELS[permit.category] || permit.category || "Permit"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white text-sm">{permit.address}</div>
                        <div className="text-zinc-500 text-xs">{permit.city}, {permit.state} {permit.zip_code}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{permit.filed_date}</td>
                      <td className="px-4 py-3 text-right text-green-400 text-sm font-mono font-medium">
                        {permit.estimated_value ? "$" + Number(permit.estimated_value).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{permit.contractor_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {pageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-zinc-600">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        p === page
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
