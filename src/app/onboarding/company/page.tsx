"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "HVAC",
  "Roofing",
  "Electrical",
  "Plumbing",
  "Solar",
  "General Contracting",
  "Home Services",
  "Property Management",
  "Real Estate",
  "Insurance",
  "Other",
];

export default function OnboardingCompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        company_name: companyName,
        industry,
      });

      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-xl">P</div>
            <span className="text-white text-2xl font-semibold tracking-tight">PermitPulse</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Tell us about your company</h1>
          <p className="text-zinc-400 text-sm">This helps us personalize your experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Company name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors" placeholder="CoolAir Mechanical" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-green-500 transition-colors">
              <option value="" disabled>Select your industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading || !companyName || !industry} className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Setting up..." : "Go to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
