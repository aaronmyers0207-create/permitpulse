"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const FLORIDA_ZIPS: Record<string, string[]> = {
  "Orange County": ["32801","32803","32804","32805","32806","32807","32808","32809","32810","32811","32812","32814","32817","32818","32819","32820","32821","32822","32824","32825","32826","32827","32828","32829","32835","32836","32837","32839"],
  "Osceola County": ["34739","34741","34743","34744","34746","34747","34758","34769","34771","34772","34773"],
  "Seminole County": ["32701","32707","32708","32714","32730","32732","32746","32750","32765","32766","32771","32773"],
  "Lake County": ["34711","34714","34715","34731","34736","34748","34753","34756","34787","34788","34797","32726","32735","32757","32776","32784"],
};

export default function OnboardingTerritoryPage() {
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [expandedCounty, setExpandedCounty] = useState<string | null>("Orange County");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const maxZips = 3;

  const toggleZip = (zip: string) => {
    if (selectedZips.includes(zip)) {
      setSelectedZips(selectedZips.filter((z) => z !== zip));
    } else if (selectedZips.length < maxZips) {
      setSelectedZips([...selectedZips, zip]);
    }
  };

  const getCountyForZip = (zip: string): string => {
    for (const [county, zips] of Object.entries(FLORIDA_ZIPS)) {
      if (zips.includes(zip)) return county;
    }
    return "FL";
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const territories = selectedZips.map((zip) => ({
        user_id: user.id, zip_code: zip, county: getCountyForZip(zip), state: "FL",
      }));
      await supabase.from("territories").insert(territories);
      await supabase.from("profiles").update({
        onboarding_complete: true, updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-xl">P</div>
            <span className="text-white text-2xl font-semibold tracking-tight">PermitPulse</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Pick your territory</h1>
          <p className="text-zinc-400 text-sm">Select up to {maxZips} zip codes to monitor. Step 2 of 3.</p>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-zinc-400 text-sm">{selectedZips.length} / {maxZips} selected</span>
          {selectedZips.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedZips.map((zip) => (
                <span key={zip} onClick={() => toggleZip(zip)} className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium cursor-pointer hover:bg-green-500/20 transition-colors">{zip} ✕</span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
          {Object.entries(FLORIDA_ZIPS).map(([county, zips]) => (
            <div key={county} className="border border-zinc-800 rounded-lg overflow-hidden">
              <button onClick={() => setExpandedCounty(expandedCounty === county ? null : county)} className="w-full px-4 py-3 flex items-center justify-between text-left bg-zinc-900 hover:bg-zinc-800 transition-colors">
                <span className="text-white font-medium text-sm">{county}</span>
                <span className="text-zinc-500 text-xs">{zips.length} zips {expandedCounty === county ? "▾" : "▸"}</span>
              </button>
              {expandedCounty === county && (
                <div className="px-4 py-3 bg-zinc-950 flex flex-wrap gap-2">
                  {zips.map((zip) => {
                    const isSelected = selectedZips.includes(zip);
                    const isDisabled = !isSelected && selectedZips.length >= maxZips;
                    return (
                      <button key={zip} onClick={() => toggleZip(zip)} disabled={isDisabled} className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${isSelected ? "bg-green-500/20 border border-green-500/30 text-green-400" : isDisabled ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer"}`}>{zip}</button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={loading || selectedZips.length === 0} className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Setting up..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
