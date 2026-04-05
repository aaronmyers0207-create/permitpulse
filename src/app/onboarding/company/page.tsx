"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRIES } from "@/lib/industries";

const COVERED_CITIES = [
  { city: "Orlando", state: "FL", source: "orlando_fl" },
  { city: "Gainesville", state: "FL", source: "gainesville_fl" },
  { city: "Tampa", state: "FL", source: "tampa_fl" },
  { city: "Austin", state: "TX", source: "austin_tx" },
  { city: "Dallas", state: "TX", source: "dallas_tx" },
  { city: "Collin County", state: "TX", source: "collin_cad_tx" },
  { city: "Chicago", state: "IL", source: "chicago_il" },
  { city: "San Francisco", state: "CA", source: "sf_ca" },
  { city: "Marin County", state: "CA", source: "marin_ca" },
  { city: "New York City", state: "NY", source: "nyc_ny" },
  { city: "Seattle", state: "WA", source: "seattle_wa" },
  { city: "Cincinnati", state: "OH", source: "cincinnati_oh" },
  { city: "Baton Rouge", state: "LA", source: "baton_rouge_la" },
  { city: "Montgomery County", state: "MD", source: "montgomery_md" },
];

const ALL_STATES = [...new Set(COVERED_CITIES.map((c) => c.state))].sort();

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleState = (code: string) => {
    setSelectedStates((prev) => prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]);
    // Auto-select cities in that state
    if (!selectedStates.includes(code)) {
      const citiesInState = COVERED_CITIES.filter((c) => c.state === code).map((c) => c.city);
      setSelectedCities((prev) => [...new Set([...prev, ...citiesInState])]);
    }
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  const filteredCities = COVERED_CITIES.filter((c) =>
    selectedStates.length === 0 || selectedStates.includes(c.state)
  ).filter((c) =>
    !citySearch || c.city.toLowerCase().includes(citySearch.toLowerCase()) || c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  const nearbyCities = (state: string) => COVERED_CITIES.filter((c) => c.state === state);

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        company_name: companyName,
        industry: selectedIndustry,
        states: selectedStates,
      });
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Permit Tracer" className="h-14 object-contain mx-auto mb-6"/>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s < step ? "bg-[#01696F] text-white" : s === step ? "bg-[#01696F] text-white ring-4 ring-[#01696F]/20" : "bg-gray-100 text-[#A1A1A6]"
                }`}>{s < step ? "✓" : s}</div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-[#01696F]" : "bg-gray-200"}`}/>}
              </div>
            ))}
          </div>
          <p className="text-[#A1A1A6] text-xs mt-2">
            {step === 1 ? "Company Info" : step === 2 ? "Your Trade" : step === 3 ? "Location" : "Markets"}
          </p>
        </div>

        {/* Step 1: Company */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">What's your company name?</h1>
              <p className="text-[#6E6E73] text-sm">We'll personalize your Permit Tracer experience.</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-sm p-6">
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus
                className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-lg placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 shadow-sm"
                placeholder="Acme Mechanical LLC" />
            </div>
            <button onClick={() => setStep(2)} disabled={!companyName.trim()}
              className="w-full py-4 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold text-base transition-colors disabled:opacity-40 shadow-sm">
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">What's your trade?</h1>
              <p className="text-[#6E6E73] text-sm">We'll prioritize the permits that matter most to you.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {INDUSTRIES.map((ind) => (
                <button key={ind.id} onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all shadow-sm ${
                    selectedIndustry === ind.id
                      ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15"
                      : "bg-white/70 backdrop-blur-xl border-black/[0.06] hover:border-gray-300"
                  }`}>
                  <span className="text-lg">{ind.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${selectedIndustry === ind.id ? "text-[#01696F]" : "text-[#1D1D1F]"}`}>{ind.label}</div>
                    <div className="text-[#A1A1A6] text-[11px]">{ind.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3.5 rounded-xl bg-white/70 border border-black/[0.06] text-[#6E6E73] font-medium hover:bg-white shadow-sm">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedIndustry}
                className="flex-1 py-3.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-40 shadow-sm">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: State */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">Where do you operate?</h1>
              <p className="text-[#6E6E73] text-sm">Select your states. We have permit data in these markets.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ALL_STATES.map((st) => {
                const isSel = selectedStates.includes(st);
                const cityCount = COVERED_CITIES.filter((c) => c.state === st).length;
                return (
                  <button key={st} onClick={() => toggleState(st)}
                    className={`px-4 py-3 rounded-xl border text-center transition-all shadow-sm ${
                      isSel ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15" : "bg-white/70 border-black/[0.06] hover:border-gray-300"
                    }`}>
                    <div className={`text-lg font-bold font-mono ${isSel ? "text-[#01696F]" : "text-[#1D1D1F]"}`}>{st}</div>
                    <div className="text-[#A1A1A6] text-[10px]">{cityCount} {cityCount === 1 ? "city" : "cities"}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3.5 rounded-xl bg-white/70 border border-black/[0.06] text-[#6E6E73] font-medium hover:bg-white shadow-sm">Back</button>
              <button onClick={() => setStep(4)} disabled={selectedStates.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-40 shadow-sm">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Cities */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">Select your markets</h1>
              <p className="text-[#6E6E73] text-sm">Choose the cities you want permit data for.</p>
            </div>

            {/* City search */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search cities..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-2 focus:ring-[#01696F]/10 shadow-sm"/>
            </div>

            {/* Available cities */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCities.length > 0 ? (
                filteredCities.map((c) => {
                  const isSel = selectedCities.includes(c.city);
                  return (
                    <button key={c.source} onClick={() => toggleCity(c.city)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all shadow-sm ${
                        isSel ? "bg-[#01696F]/[0.06] border-[#01696F]/30" : "bg-white/70 border-black/[0.06] hover:border-gray-300"
                      }`}>
                      <div>
                        <span className={`text-sm font-medium ${isSel ? "text-[#01696F]" : "text-[#1D1D1F]"}`}>{c.city}</span>
                        <span className="text-[#A1A1A6] text-xs ml-2">{c.state}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSel ? "border-[#01696F] bg-[#01696F]" : "border-gray-300"}`}>
                        {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#6E6E73] text-sm mb-2">No cities found for "{citySearch}"</p>
                  {selectedStates.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[#A1A1A6] text-xs">Available cities in your states:</p>
                      {selectedStates.map((st) => (
                        <div key={st} className="text-xs text-[#6E6E73]">
                          <span className="font-medium">{st}:</span> {nearbyCities(st).map((c) => c.city).join(", ")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected count */}
            <p className="text-center text-[#A1A1A6] text-xs">
              {selectedCities.length} {selectedCities.length === 1 ? "city" : "cities"} selected
              {selectedCities.length === 0 && " — select at least one to continue"}
            </p>

            {/* Select all in states */}
            <button onClick={() => {
              const allInStates = COVERED_CITIES.filter((c) => selectedStates.includes(c.state)).map((c) => c.city);
              setSelectedCities(allInStates);
            }} className="w-full py-2 text-sm text-[#01696F] hover:text-[#0C4E54] font-medium transition-colors">
              Select all cities in my states
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-3.5 rounded-xl bg-white/70 border border-black/[0.06] text-[#6E6E73] font-medium hover:bg-white shadow-sm">Back</button>
              <button onClick={handleSubmit} disabled={loading || selectedCities.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-40 shadow-sm">
                {loading ? "Setting up..." : "Launch Dashboard →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
