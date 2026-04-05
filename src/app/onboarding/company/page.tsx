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
    setSelectedStates((prev) => prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, email: user.email, company_name: companyName, industry: selectedIndustry, states: selectedStates });
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <img src="/logo.png" alt="Permit Tracer" className="h-16 object-contain"/>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "w-10 bg-[#01696F]" : "w-6 bg-gray-200"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-2">What's your company name?</h1>
              <p className="text-[#6E6E73] text-sm">We'll personalize your dashboard.</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-sm p-6">
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus
                className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-lg placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="Acme Mechanical" />
            </div>
            <button onClick={() => setStep(2)} disabled={!companyName.trim()}
              className="w-full py-4 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold text-lg transition-colors disabled:opacity-40 shadow-sm">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-2">What's your trade?</h1>
              <p className="text-[#6E6E73] text-sm">We'll surface the permits that matter most to you.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <button key={ind.id} onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all shadow-sm ${
                    selectedIndustry === ind.id
                      ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15"
                      : "bg-white/70 backdrop-blur-xl border-black/[0.06] hover:border-gray-300"
                  }`}>
                  <span className="text-xl">{ind.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${selectedIndustry === ind.id ? "text-[#01696F]" : "text-[#1D1D1F]"}`}>{ind.label}</div>
                    <div className="text-[#A1A1A6] text-xs">{ind.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl bg-white/70 backdrop-blur-xl border border-black/[0.06] text-[#6E6E73] font-medium transition-colors hover:bg-white shadow-sm">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedIndustry}
                className="flex-1 py-4 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold text-lg transition-colors disabled:opacity-40 shadow-sm">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-[#1D1D1F] text-2xl font-bold mb-2">Where do you operate?</h1>
              <p className="text-[#6E6E73] text-sm">Select the states you want permit data for.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {COVERED_STATES.map((st) => {
                const isSel = selectedStates.includes(st.code);
                return (
                  <button key={st.code} onClick={() => toggleState(st.code)}
                    className={`px-4 py-3.5 rounded-xl border text-center transition-all shadow-sm ${
                      isSel ? "bg-[#01696F]/[0.06] border-[#01696F]/30 ring-1 ring-[#01696F]/15" : "bg-white/70 backdrop-blur-xl border-black/[0.06] hover:border-gray-300"
                    }`}>
                    <div className={`text-lg font-bold font-mono ${isSel ? "text-[#01696F]" : "text-[#1D1D1F]"}`}>{st.code}</div>
                    <div className="text-[#A1A1A6] text-xs">{st.name}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelectedStates(COVERED_STATES.map((s) => s.code))} className="w-full py-2 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">Select all states</button>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl bg-white/70 backdrop-blur-xl border border-black/[0.06] text-[#6E6E73] font-medium transition-colors hover:bg-white shadow-sm">Back</button>
              <button onClick={handleSubmit} disabled={loading || selectedStates.length === 0}
                className="flex-1 py-4 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold text-lg transition-colors disabled:opacity-40 shadow-sm">
                {loading ? "Setting up..." : "Launch Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
