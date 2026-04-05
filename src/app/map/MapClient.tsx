"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRY_MAP } from "@/lib/industries";
import { scorePermit, LEAD_STATUSES, type LeadScore } from "@/lib/scoring";

const CAT_COLORS: Record<string, string> = {
  hvac: "#10b981", roofing: "#f97316", electrical: "#f59e0b", plumbing: "#3b82f6",
  solar: "#eab308", fire: "#ef4444", demolition: "#f43f5e", pool: "#06b6d4",
  fence: "#84cc16", concrete: "#78716c", windows_doors: "#0ea5e9",
  insulation: "#ec4899", new_construction: "#a855f7", renovation: "#6366f1", general: "#9ca3af",
};

interface Props { profile: any; }

export default function MapClient({ profile }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);
  const [permitCount, setPermitCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const industry = INDUSTRY_MAP[profile?.industry] || null;

  // Fetch permits for current map bounds
  const fetchPermits = useCallback(async (map: maplibregl.Map) => {
    setLoading(true);
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const params = new URLSearchParams({
      bounds: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
      limit: "500",
    });
    if (filterCategory) params.set("category", filterCategory);

    try {
      const res = await fetch(`/api/permits/geo?${params.toString()}`);
      const data = await res.json();
      if (data.permits) {
        renderMarkers(map, data.permits);
        setPermitCount(data.permits.length);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filterCategory]);

  // Render markers
  const renderMarkers = (map: maplibregl.Map, permits: any[]) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    permits.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const sc = scorePermit(p, industry);
      const color = CAT_COLORS[p.category] || CAT_COLORS.general;
      const size = sc.temp === "hot" ? 14 : sc.temp === "warm" ? 11 : 9;

      // Create pin element
      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      if (sc.temp === "hot") {
        el.style.animation = "pulse 2s infinite";
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPermit(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-97.5, 38.5], // center of US
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), "bottom-right");

    map.on("load", () => { fetchPermits(map); });
    map.on("moveend", () => { fetchPermits(map); });

    mapRef.current = map;

    // Add pulse animation
    const style = document.createElement("style");
    style.textContent = `@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.8; } }`;
    document.head.appendChild(style);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Refetch on filter change
  useEffect(() => {
    if (mapRef.current) fetchPermits(mapRef.current);
  }, [filterCategory, fetchPermits]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const updateStatus = async (permitId: string, status: string) => {
    await fetch("/api/permit-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId, status }) });
  };

  const sc = selectedPermit ? scorePermit(selectedPermit, industry) : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Nav */}
      <nav className="glass-strong border-b border-black/[0.04] px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#01696F] flex items-center justify-center text-white font-bold text-xs shadow-sm">P</div>
          <span className="text-[#1D1D1F] font-semibold tracking-tight text-sm">PermitPulse</span>
          <span className="text-[#A1A1A6] text-xs">/ Map</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-[#6E6E73] text-xs hover:text-[#1D1D1F] transition-colors">Dashboard</a>
          <a href="/admin" className="text-[#A1A1A6] text-xs hover:text-[#1D1D1F] transition-colors">Admin</a>
          <button onClick={handleLogout} className="text-[#A1A1A6] text-xs hover:text-[#1D1D1F] transition-colors">Log out</button>
        </div>
      </nav>

      {/* Map toolbar */}
      <div className="glass-strong border-b border-black/[0.04] px-4 py-2 flex items-center gap-2 z-10 shrink-0">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-gray-200 text-[#1D1D1F] rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
          <option value="">All categories</option>
          {Object.entries(CAT_COLORS).map(([k]) => (
            <option key={k} value={k}>{k.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-3 text-[10px] text-[#A1A1A6]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"/>Hot</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400"/>Warm</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"/>Cold</span>
        </div>

        <div className="flex-1"/>
        {loading && <div className="w-4 h-4 border-2 border-[#01696F]/30 border-t-[#01696F] rounded-full animate-spin"/>}
        <span className="text-[#A1A1A6] text-xs">{permitCount} permits in view</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0"/>

        {/* Selected permit panel */}
        {selectedPermit && sc && (
          <div className="absolute top-4 right-4 w-80 bg-white/90 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-xl z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${sc.temp==="hot"?"bg-red-400":sc.temp==="warm"?"bg-green-400":"bg-gray-300"}`}/>
                <span className="text-xs font-medium text-[#1D1D1F]">{sc.temp==="hot"?"🔥 Hot Lead":sc.temp==="warm"?"🟢 Warm Lead":"Cold Lead"} — {sc.score}</span>
              </div>
              <button onClick={() => setSelectedPermit(null)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#6E6E73] text-xs">&times;</button>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-[#1D1D1F] text-sm font-bold leading-snug">{selectedPermit.address}</p>
                <p className="text-[#6E6E73] text-xs">{selectedPermit.city}, {selectedPermit.state} {selectedPermit.zip_code}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border bg-gray-100 text-[#6E6E73] border-gray-200">{(selectedPermit.category || "").replace("_"," ")}</span>
                {selectedPermit.estimated_value && <span className="text-[#01696F] text-sm font-bold font-mono">${Number(selectedPermit.estimated_value).toLocaleString()}</span>}
                <span className="text-[#A1A1A6] text-[10px]">{selectedPermit.filed_date}</span>
              </div>

              {selectedPermit.applicant_name && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#01696F]/10 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#01696F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <div><p className="text-[10px] text-[#A1A1A6]">Owner</p><p className="text-xs font-medium text-[#1D1D1F]">{selectedPermit.applicant_name}</p></div>
                </div>
              )}

              {selectedPermit.contractor_name && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#6E6E73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                  </div>
                  <div><p className="text-[10px] text-[#A1A1A6]">Contractor</p><p className="text-xs font-medium text-[#1D1D1F]">{selectedPermit.contractor_name}</p></div>
                </div>
              )}

              {/* Quick disposition */}
              <div className="flex flex-wrap gap-1">
                {LEAD_STATUSES.slice(0, 5).map((ls) => (
                  <button key={ls.id} onClick={() => updateStatus(selectedPermit.id, ls.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${ls.color} hover:opacity-80`}>
                    {ls.label}
                  </button>
                ))}
              </div>

              {/* Skip trace */}
              <button
                onClick={async () => {
                  const res = await fetch("/api/skip-trace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permitId: selectedPermit.id }) });
                  const data = await res.json();
                  if (data.ok) alert("Skip trace submitted — check results in the dashboard");
                  else alert(data.error || "Failed");
                }}
                disabled={!selectedPermit.applicant_name}
                className="w-full py-2 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white text-xs font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {selectedPermit.applicant_name ? "Skip Trace Owner" : "No owner name"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
