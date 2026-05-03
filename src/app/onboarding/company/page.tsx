"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRIES } from "@/lib/industries";

// All cities covered by Permit Tracer — used to auto-select when a state is chosen
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
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleState = (code: string) => {
    setSelectedStates((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Auto-select all cities in chosen states
        const autoSelectedCities = COVERED_CITIES.filter((c) =>
          selectedStates.includes(c.state)
        ).map((c) => c.city);

        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          industry: selectedIndustry,
          states: selectedStates,
          // Store auto-selected cities as well if the schema supports it
          cities: autoSelectedCities,
        });

        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Onboarding submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Permit Tracer"
            className="h-14 object-contain mx-auto mb-6"
          />

          {/* 2-step progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    s < step
                      ? "bg-[#01696F] text-white"
                      : s === step
                      ? "bg-[#01696F] text-white ring-4 ring-[#01696F]/20"
                      : "bg-gray-100 text-[#A1A1A6]"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 2 && (
                  <div
                    className={`w-12 h-0.5 transition-all ${
                      s < step ? "bg-[#01696F]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="text-[#A1A1A6] text-xs mt-2">
            {step === 1 ? "Your Trade" : "Your States"}
          </p>
        </div>

        {/* ─── Step 1: Industry ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">
                What&apos;s your trade?
              </h1>
              <p className="text-[#6E6E73] text-sm">
                We&apos;ll prioritize the permits that matter most to you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all shadow-sm ${
                    selectedIndustry === ind.id
                      ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15"
                      : "bg-white/70 backdrop-blur-xl border-black/[0.06] hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{ind.icon}</span>
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        selectedIndustry === ind.id
                          ? "text-[#01696F]"
                          : "text-[#1D1D1F]"
                      }`}
                    >
                      {ind.label}
                    </div>
                    <div className="text-[#A1A1A6] text-[11px]">
                      {ind.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedIndustry}
              className="w-full py-4 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold text-base transition-colors disabled:opacity-40 shadow-sm"
            >
              Continue
            </button>
          </div>
        )}

        {/* ─── Step 2: States ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">
                Where do you operate?
              </h1>
              <p className="text-[#6E6E73] text-sm">
                Select your states. All cities in your states are automatically
                included.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {ALL_STATES.map((st) => {
                const isSel = selectedStates.includes(st);
                const cityCount = COVERED_CITIES.filter(
                  (c) => c.state === st
                ).length;
                return (
                  <button
                    key={st}
                    onClick={() => toggleState(st)}
                    className={`px-4 py-3 rounded-xl border text-center transition-all shadow-sm ${
                      isSel
                        ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15"
                        : "bg-white/70 border-black/[0.06] hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`text-lg font-bold font-mono ${
                        isSel ? "text-[#01696F]" : "text-[#1D1D1F]"
                      }`}
                    >
                      {st}
                    </div>
                    <div className="text-[#A1A1A6] text-[10px]">
                      {cityCount} {cityCount === 1 ? "city" : "cities"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Auto-select hint */}
            {selectedStates.length > 0 && (
              <div className="bg-[#01696F]/[0.05] border border-[#01696F]/10 rounded-xl px-4 py-3">
                <p className="text-[#01696F] text-xs font-medium">
                  ✓ All cities in{" "}
                  {selectedStates.join(", ")} will be included automatically
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3.5 rounded-xl bg-white/70 border border-black/[0.06] text-[#6E6E73] font-medium hover:bg-white shadow-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedStates.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-40 shadow-sm"
              >
                {loading ? "Setting up..." : "Launch Dashboard →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
