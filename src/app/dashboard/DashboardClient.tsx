"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  roofing: "Roofing",
  electrical: "Electrical",
  plumbing: "Plumbing",
  solar: "Solar",
  fire: "Fire Protection",
  demolition: "Demolition",
  pool: "Pool/Spa",
  fence: "Fence",
  concrete: "Concrete",
  windows_doors: "Windows/Doors",
  insulation: "Insulation",
  new_construction: "New Construction",
  renovation: "Renovation",
  general: "General",
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

export default function DashboardClient({ profile, permits, viewsMap: initialViews }: any) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [starredMap, setStarredMap] = useState(initialViews);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const filteredPermits = permits.filter((p: any) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterCity !== "all" && p.city !== filterCity) return false;
    if (filterState !== "all" && p.state !== filterState) return false;
    if (showStarredOnly && !starredMap[p.id]?.starred) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = permits.filter((p: any) => p.filed_date === todayStr).length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = permits.filter((p: any) => new Date(p.filed_date) >= weekAgo).length;
  const starredCount = Object.values(starredMap).filter((v: any) => v.starred).length;
  const pipelineValue = filteredPermits.reduce((sum: number, p: any) => sum + (p.estimated_value || 0), 0);

  // Build filter options from actual data
  const states = [...new Set(permits.map((p: any) => p.state).filter(Boolean))].sort() as string[];
  const categories = [...new Set(permits.map((p: any) => p.category).filter(Boolean))].sort() as string[];
  const cities = [...new Set(
    permits
      .filter((p: any) => filterState === "all" || p.state === filterState)
      .map((p: any) => p.city)
      .filter(Boolean)
  )].sort() as string[];

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
    const rows = filteredPermits.map((p: any) => [
      p.category, p.permit_type, `"${(p.address || "").replace(/"/g, '""')}"`,
      p.city, p.state, p.zip_code, p.filed_date, p.estimated_value,
      `"${(p.contractor_name || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "permitpulse-export-" + todayStr + ".csv"; a.click();
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
            { label: "New today", value: todayCount },
            { label: "This week", value: weekCount },
            { label: "Starred", value: starredCount },
            { label: "Pipeline value", value: "$" + pipelineValue.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 rounded-lg px-5 py-4">
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
            ))}
          </select>

          <select value={filterState} onChange={(e) => { setFilterState(e.target.value); setFilterCity("all"); }} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="all">All states</option>
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${showStarredOnly ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"}`}
          >
            {showStarredOnly ? "★ Starred" : "☆ Starred"}
          </button>

          <div className="flex-1" />
          <span className="text-zinc-500 text-sm">{filteredPermits.length} permits</span>
          <button onClick={exportCSV} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">Export CSV</button>
        </div>

        {/* Table */}
        {filteredPermits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-white text-lg font-semibold mb-2">No permits yet</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">Head to the <a href="/admin" className="text-green-400 underline">Admin panel</a> and hit Sync to pull in permit data.</p>
          </div>
        ) : (
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
                {filteredPermits.map((permit: any) => (
                  <tr key={permit.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3"><button onClick={() => toggleStar(permit.id)} className="text-lg">{starredMap[permit.id]?.starred ? "⭐" : "☆"}</button></td>
                    <td className="px-4 py-3"><span className={"inline-block px-2.5 py-1 rounded-full text-xs font-medium border " + (CATEGORY_COLORS[permit.category] || CATEGORY_COLORS.general)}>{CATEGORY_LABELS[permit.category] || permit.category || "Permit"}</span></td>
                    <td className="px-4 py-3"><div className="text-white text-sm">{permit.address}</div><div className="text-zinc-500 text-xs">{permit.city}, {permit.state} {permit.zip_code}</div></td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{permit.filed_date}</td>
                    <td className="px-4 py-3 text-right text-green-400 text-sm font-mono font-medium">{permit.estimated_value ? "$" + Number(permit.estimated_value).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{permit.contractor_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
