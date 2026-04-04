"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRIES, COVERED_STATES } from "@/lib/industries";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="text-white text-2xl font-semibold tracking-tight">PermitPulse</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "w-10 bg-green-500" : "w-6 bg-zinc-800"}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Company */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-white text-2xl font-bold mb-2">What's your company name?</h1>
              <p className="text-zinc-500 text-sm">We'll personalize your dashboard.</p>
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
              className="w-full px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-lg placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="Acme Mechanical"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!companyName.trim()}
              className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-white text-2xl font-bold mb-2">What's your trade?</h1>
              <p className="text-zinc-500 text-sm">We'll surface the permits that matter most to you.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                    selectedIndustry === ind.id
                      ? "bg-green-500/10 border-green-500/40 ring-1 ring-green-500/20"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xl">{ind.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${selectedIndustry === ind.id ? "text-green-400" : "text-white"}`}>{ind.label}</div>
                    <div className="text-zinc-600 text-xs">{ind.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium transition-colors hover:bg-zinc-800">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedIndustry}
                className="flex-1 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: States */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-white text-2xl font-bold mb-2">Where do you operate?</h1>
              <p className="text-zinc-500 text-sm">Select the states you want permit data for. Pick as many as you need.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {COVERED_STATES.map((st) => {
                const isSelected = selectedStates.includes(st.code);
                return (
                  <button
                    key={st.code}
                    onClick={() => toggleState(st.code)}
                    className={`px-4 py-3.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-green-500/10 border-green-500/40 ring-1 ring-green-500/20"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`text-lg font-bold font-mono ${isSelected ? "text-green-400" : "text-white"}`}>{st.code}</div>
                    <div className="text-zinc-600 text-xs">{st.name}</div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setSelectedStates(COVERED_STATES.map((s) => s.code)); }}
              className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Select all states
            </button>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium transition-colors hover:bg-zinc-800">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedStates.length === 0}
                className="flex-1 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Setting up..." : "Launch Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
