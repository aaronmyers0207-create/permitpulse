"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  hvac_changeout: "HVAC Change-out",
  hvac_new_install: "New HVAC Install",
  new_construction: "New Construction",
  renovation_mechanical: "Renovation",
  general_mechanical: "Mechanical",
};

const CATEGORY_COLORS: Record<string, string> = {
  hvac_changeout: "bg-green-500/10 text-green-400 border-green-500/20",
  hvac_new_install: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  new_construction: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  renovation_mechanical: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  general_mechanical: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function DashboardClient({ profile, permits, territories, viewsMap: initialViews }: any) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterZip, setFilterZip] = useState("all");
  const [starredMap, setStarredMap] = useState(initialViews);
  const router = useRouter();
  const supabase = createClient();

  const filteredPermits = permits.filter((p: any) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterZip !== "all" && p.zip_code !== filterZip) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = permits.filter((p: any) => p.filed_date === todayStr).length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = permits.filter((p: any) => new Date(p.filed_date) >= weekAgo).length;
  const starredCount = Object.values(starredMap).filter((v: any) => v.starred).length;
  const pipelineValue = permits.reduce((sum: number, p: any) => sum + (p.estimated_value || 0), 0);

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
    const headers = ["Type","Category","Address","City","Zip","County","Filed Date","Est. Value","Contractor","Description"];
    const rows = filteredPermits.map((p: any) => [p.permit_type,p.category,p.address,p.city,p.zip_code,p.county,p.filed_date,p.estimated_value,p.contractor_name,p.description]);
    const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `permitpulse-export-${todayStr}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">P</div>
          <span className="text-white font-semibold tracking-tight">PermitPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{profile.company_name}</span>
          <button onClick={handleLogout} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{label:"New today",value:todayCount},{label:"This week",value:weekCount},{label:"Starred",value:starredCount},{label:"Pipeline value",value:`$${pipelineValue.toLocaleString()}`}].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 rounded-lg px-5 py-4">
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold font-mono">{stat.value}</p>
            </div>
          ))
cat > src/app/dashboard/DashboardClient.tsx << 'DASHEOF'
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  hvac_changeout: "HVAC Change-out",
  hvac_new_install: "New HVAC Install",
  new_construction: "New Construction",
  renovation_mechanical: "Renovation",
  general_mechanical: "Mechanical",
};

const CATEGORY_COLORS: Record<string, string> = {
  hvac_changeout: "bg-green-500/10 text-green-400 border-green-500/20",
  hvac_new_install: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  new_construction: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  renovation_mechanical: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  general_mechanical: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function DashboardClient({ profile, permits, territories, viewsMap: initialViews }: any) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterZip, setFilterZip] = useState("all");
  const [starredMap, setStarredMap] = useState(initialViews);
  const router = useRouter();
  const supabase = createClient();

  const filteredPermits = permits.filter((p: any) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterZip !== "all" && p.zip_code !== filterZip) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = permits.filter((p: any) => p.filed_date === todayStr).length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = permits.filter((p: any) => new Date(p.filed_date) >= weekAgo).length;
  const starredCount = Object.values(starredMap).filter((v: any) => v.starred).length;
  const pipelineValue = permits.reduce((sum: number, p: any) => sum + (p.estimated_value || 0), 0);

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
    const headers = ["Type","Category","Address","City","Zip","County","Filed Date","Est. Value","Contractor","Description"];
    const rows = filteredPermits.map((p: any) => [p.permit_type,p.category,p.address,p.city,p.zip_code,p.county,p.filed_date,p.estimated_value,p.contractor_name,p.description]);
    const csv = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `permitpulse-export-${todayStr}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">P</div>
          <span className="text-white font-semibold tracking-tight">PermitPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{profile.company_name}</span>
          <button onClick={handleLogout} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{label:"New today",value:todayCount},{label:"This week",value:weekCount},{label:"Starred",value:starredCount},{label:"Pipeline value",value:`$${pipelineValue.toLocaleString()}`}].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 rounded-lg px-5 py-4">
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="all">All permit types</option>
            <option value="hvac_changeout">HVAC Change-out</option>
            <option value="hvac_new_install">New HVAC Install</option>
            <option value="new_construction">New Construction</option>
            <option value="renovation_mechanical">Renovation</option>
            <option value="general_mechanical">Mechanical</option>
          </select>
          <select value={filterZip} onChange={(e) => setFilterZip(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
            <option value="all">All zip codes</option>
            {territories.map((t: any) => (<option key={t.id} value={t.zip_code}>{t.zip_code} — {t.county}</option>))}
          </select>
          <div className="flex-1" />
          <span className="text-zinc-500 text-sm">{filteredPermits.length} permits</span>
          <button onClick={exportCSV} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">Export CSV</button>
        </div>

        {filteredPermits.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-white text-lg font-semibold mb-2">No permits yet</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">We&apos;re pulling permits for your territory. New data comes in twice daily — check back soon.</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">Type</th>
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
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[permit.category] || CATEGORY_COLORS.general_mechanical}`}>
                          {CATEGORY_LABELS[permit.category] || permit.permit_type || "Permit"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><div className="text-white text-sm">{permit.address}</div><div className="text-zinc-500 text-xs">{permit.city}, FL {permit.zip_code}</div></td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{permit.filed_date}</td>
                      <td className="px-4 py-3 text-right text-green-400 text-sm font-mono font-medium">{permit.estimated_value ? `$${permit.estimated_value.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{permit.contractor_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
