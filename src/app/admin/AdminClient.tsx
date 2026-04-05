"use client";

import { useEffect, useState, useCallback } from "react";

interface SourceInfo { id: string; name: string; region: string; state: string; endpoint: string; permitCount: number; lastSync: { status: string; permits_fetched: number; permits_upserted: number; error_message?: string; completed_at: string; } | null; }
type SyncStatus = "idle" | "syncing" | "done" | "error";

export default function AdminClient() {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});
  const [syncAllRunning, setSyncAllRunning] = useState(false);
  const [limit, setLimit] = useState(1000);

  const fetchSources = useCallback(async () => { const res = await fetch("/api/admin/sources"); const data = await res.json(); if (data.sources) setSources(data.sources); setLoading(false); }, []);
  useEffect(() => { fetchSources(); }, [fetchSources]);

  const syncOne = async (sourceId: string) => {
    setSyncStatus((p) => ({ ...p, [sourceId]: "syncing" })); setSyncResults((p) => ({ ...p, [sourceId]: null }));
    try { const res = await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId, limit }) }); const data = await res.json(); setSyncStatus((p) => ({ ...p, [sourceId]: data.ok ? "done" : "error" })); setSyncResults((p) => ({ ...p, [sourceId]: data.result })); fetchSources(); } catch (err) { setSyncStatus((p) => ({ ...p, [sourceId]: "error" })); }
  };

  const syncAll = async () => {
    setSyncAllRunning(true); const allS: Record<string, SyncStatus> = {}; sources.forEach((s) => { allS[s.id] = "syncing"; }); setSyncStatus(allS);
    try { const res = await fetch("/api/admin/sync-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit }) }); const data = await res.json(); if (data.results) { const ns: Record<string, SyncStatus> = {}; const nr: Record<string, any> = {}; for (const r of data.results) { ns[r.sourceId] = r.errors > 0 ? "error" : "done"; nr[r.sourceId] = r; } setSyncStatus(ns); setSyncResults(nr); } fetchSources(); } catch { sources.forEach((s) => { setSyncStatus((p) => ({ ...p, [s.id]: "error" })); }); }
    setSyncAllRunning(false);
  };

  const totalPermits = sources.reduce((s, src) => s + src.permitCount, 0);

  const statusBadge = (status: SyncStatus) => {
    const map: Record<SyncStatus, { cls: string; label: string }> = {
      idle: { cls: "bg-gray-100 text-gray-500", label: "Ready" },
      syncing: { cls: "bg-[#01696F]/10 text-[#01696F] animate-pulse", label: "Syncing..." },
      done: { cls: "bg-emerald-50 text-emerald-700", label: "Done" },
      error: { cls: "bg-red-50 text-red-600", label: "Error" },
    };
    const { cls, label } = map[status];
    return <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{label}</span>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-[#A1A1A6] animate-pulse">Loading sources...</div></div>;

  return (
    <div className="min-h-screen">
      <nav className="glass-strong sticky top-0 z-30 border-b border-black/[0.04] px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Permit Tracer" className="h-7 object-contain"/>
            <span className="text-[#A1A1A6] text-sm ml-1">/ Admin</span>
          </div>
          <a href="/dashboard" className="text-[#6E6E73] text-sm hover:text-[#1D1D1F] transition-colors">Back to Dashboard</a>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#1D1D1F] text-2xl font-bold">Data Sources</h1>
            <p className="text-[#6E6E73] text-sm mt-1">{sources.length} sources configured &middot; {totalPermits.toLocaleString()} total permits</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[#6E6E73] text-sm">Limit
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="ml-2 bg-white border border-gray-200 text-[#1D1D1F] rounded-lg px-2 py-1 text-sm shadow-sm">
                <option value={100}>100</option><option value={500}>500</option><option value={1000}>1,000</option><option value={2000}>2,000</option><option value={5000}>5,000</option>
              </select>
            </label>
            <button onClick={syncAll} disabled={syncAllRunning} className="px-5 py-2 bg-[#01696F] hover:bg-[#0C4E54] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">{syncAllRunning ? "Syncing All..." : "Sync All Sources"}</button>
          </div>
        </div>
        <div className="grid gap-3">
          {sources.map((source) => { const status = syncStatus[source.id] || "idle"; const result = syncResults[source.id]; return (
            <div key={source.id} className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[#1D1D1F] font-medium truncate">{source.name}</h3>
                  <span className="text-[#A1A1A6] text-xs shrink-0">{source.region}, {source.state}</span>
                </div>
                <div className="text-[#A1A1A6] text-xs truncate mb-2">{source.endpoint}</div>
                <div className="flex items-center gap-4">
                  <span className="text-[#1D1D1F] text-sm font-mono">{source.permitCount.toLocaleString()} permits</span>
                  {source.lastSync && (
                    <span className="text-xs">
                      <span className={source.lastSync.status === "success" ? "text-emerald-600" : "text-red-500"}>{source.lastSync.status}</span>
                      <span className="text-[#A1A1A6] ml-2">{new Date(source.lastSync.completed_at).toLocaleString()}</span>
                    </span>
                  )}
                  {!source.lastSync && <span className="text-[#A1A1A6] text-xs">Never synced</span>}
                </div>
                {result && (
                  <div className="mt-2 text-xs text-[#6E6E73] bg-gray-50 rounded-lg px-3 py-2">
                    Fetched: {result.fetched ?? 0} &middot; Upserted: {result.upserted ?? 0} &middot; Skipped: {result.skipped ?? 0} &middot; Errors: {result.errors ?? 0}
                    {(result.errorMessages?.length > 0 || result.errorMessage) && <div className="text-red-500 mt-1 truncate">{result.errorMessages?.[0] || result.errorMessage}</div>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {statusBadge(status)}
                <button onClick={() => syncOne(source.id)} disabled={status === "syncing" || syncAllRunning}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-40 text-[#6E6E73] rounded-xl text-sm transition-colors shadow-sm">Sync</button>
                {source.id === "orlando_fl" && (
                  <div className="flex gap-1 mt-1">
                    {["Solar","Roof","MEC","ELE","PLM","Pool"].map((wt) => (
                      <button key={wt} onClick={async () => {
                        setSyncStatus((p) => ({ ...p, [source.id]: "syncing" }));
                        try {
                          const res = await fetch("/api/admin/sync-targeted", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, worktypeFilter: wt, limit: 10000 }) });
                          const data = await res.json();
                          setSyncStatus((p) => ({ ...p, [source.id]: data.ok ? "done" : "error" }));
                          setSyncResults((p) => ({ ...p, [source.id]: data.result }));
                          fetchSources();
                        } catch { setSyncStatus((p) => ({ ...p, [source.id]: "error" })); }
                      }} disabled={status === "syncing"}
                        className="px-2 py-1 bg-[#01696F]/[0.06] hover:bg-[#01696F]/10 border border-[#01696F]/15 text-[#01696F] rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40">
                        {wt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
