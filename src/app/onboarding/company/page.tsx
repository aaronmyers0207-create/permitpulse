"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingCompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").update({
        company_name: companyName,
        phone,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      router.push("/onboarding/territory");
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
          <p className="text-zinc-400 text-sm">Step 1 of 3</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Company name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors" placeholder="CoolAir Mechanical" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors" placeholder="(407) 555-0123" />
          </div>
          <button type="submit" disabled={loading || !companyName || !phone} className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
