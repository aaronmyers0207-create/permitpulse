"use client";

import { useEffect, useState, useCallback } from "react";

interface SourceInfo {
  id: string;
  name: string;
  region: string;
  state: string;
  endpoint: string;
  permitCount: number;
  lastSync: {
    status: string;
    permits_fetched: number;
    permits_upserted: number;
    error_message?: string;
    completed_at: string;
  } | null;
}

type SyncStatus = "idle" | "syncing" | "done" | "error";

export default function AdminClient() {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});
  const [syncAllRunning, setSyncAllRunning] = useState(false);
  const [limit, setLimit] = useState(1000);

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/admin/sources");
    const data = await res.json();
    if (data.sources) setSources(data.sources);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const syncOne = async (sourceId: string) => {
    setSyncStatus((p) => ({ ...p, [sourceId]: "syncing" }));
    setSyncResults((p) => ({ ...p, [sourceId]: null }));

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, limit }),
      });
      const data = await res.json();
      setSyncStatus((p) => ({ ...p, [sourceId]: data.ok ? "done" : "error" }));
      setSyncResults((p) => ({ ...p, [sourceId]: data.result }));
      fetchSources(); // refresh counts
    } catch (err) {
      setSyncStatus((p) => ({ ...p, [sourceId]: "error" }));
      setSyncResults((p) => ({ ...p, [sourceId]: { errorMessages: [String(err)] } }));
    }
  };

  const syncAll = async () => {
    setSyncAllRunning(true);
    // Set all to syncing
    const allSyncing: Record<string, SyncStatus> = {};
    sources.forEach((s) => { allSyncing[s.id] = "syncing"; });
    setSyncStatus(allSyncing);

    try {
      const res = await fetch("/api/admin/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      if (data.results) {
        const newStatus: Record<string, SyncStatus> = {};
        const newResults: Record<string, any> = {};
        for (const r of data.results) {
          newStatus[r.sourceId] = r.errors > 0 ? "error" : "done";
          newResults[r.sourceId] = r;
        }
        setSyncStatus(newStatus);
        setSyncResults(newResults);
      }
      fetchSources();
    } catch {
      sources.forEach((s) => {
        setSyncStatus((p) => ({ ...p, [s.id]: "error" }));
      });
    }

    setSyncAllRunning(false);
  };

  const totalPermits = sources.reduce((s, src) => s + src.permitCount, 0);

  const statusBadge = (status: SyncStatus) => {
    const map: Record<SyncStatus, { color: string; label: string }> = {
      idle:    { color: "bg-zinc-700 text-zinc-400", label: "Ready" },
      syncing: { color: "bg-amber-500/20 text-amber-400 animate-pulse", label: "Syncing..." },
      done:    { color: "bg-green-500/20 text-green-400", label: "Done" },
      error:   { color: "bg-red-500/20 text-red-400", label: "Error" },
    };
    const { color, label } = map[status];
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
  };

  const lastSyncBadge = (ls: SourceInfo["lastSync"]) => {
    if (!ls) return <span className="text-zinc-600 text-xs">Never synced</span>;
    const color = ls.status === "success" ? "text-green-500" : ls.status === "error" ? "text-red-500" : "text-amber-500";
    const time = new Date(ls.completed_at).toLocaleString();
    return (
      <div className="text-xs">
        <span className={color}>{ls.status}</span>
        <span className="text-zinc-600 ml-2">{time}</span>
        {ls.permits_upserted > 0 && <span className="text-zinc-500 ml-2">{ls.permits_upserted} upserted</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading sources...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold tracking-tight">PermitPulse</span>
          <span className="text-zinc-600 text-sm ml-2">/ Admin</span>
        </div>
        <a href="/dashboard" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Back to Dashboard</a>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header stats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Data Sources</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {sources.length} sources configured &middot; {totalPermits.toLocaleString()} total permits in database
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-zinc-500 text-sm">
              Limit
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="ml-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded px-2 py-1 text-sm"
              >
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={2000}>2,000</option>
                <option value={5000}>5,000</option>
              </select>
            </label>
            <button
              onClick={syncAll}
              disabled={syncAllRunning}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {syncAllRunning ? "Syncing All..." : "Sync All Sources"}
            </button>
          </div>
        </div>

        {/* Source cards */}
        <div className="grid gap-4">
          {sources.map((source) => {
            const status = syncStatus[source.id] || "idle";
            const result = syncResults[source.id];

            return (
              <div
                key={source.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">{source.name}</h3>
                    <span className="text-zinc-600 text-xs shrink-0">{source.region}, {source.state}</span>
                  </div>
                  <div className="text-zinc-500 text-xs truncate mb-2">{source.endpoint}</div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 text-sm font-mono">{source.permitCount.toLocaleString()} permits</span>
                    {lastSyncBadge(source.lastSync)}
                  </div>
                  {/* Sync result details */}
                  {result && (
                    <div className="mt-2 text-xs text-zinc-500 bg-zinc-800/50 rounded px-3 py-2">
                      Fetched: {result.fetched ?? 0} &middot; Upserted: {result.upserted ?? 0} &middot; Skipped: {result.skipped ?? 0} &middot; Errors: {result.errors ?? 0}
                      {(result.errorMessages?.length > 0 || result.errorMessage) && (
                        <div className="text-red-400 mt-1 truncate">
                          {result.errorMessages?.[0] || result.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(status)}
                  <button
                    onClick={() => syncOne(source.id)}
                    disabled={status === "syncing" || syncAllRunning}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
                  >
                    Sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
