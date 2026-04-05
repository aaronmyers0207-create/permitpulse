"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/onboarding/company"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <img src="/logo.png" alt="Permit Tracer" className="h-10 object-contain"/>
          </div>
          <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1.5">Start your free trial</h1>
          <p className="text-[#6E6E73] text-sm">No credit card required.</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="At least 6 characters" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-50 shadow-sm">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
        <p className="text-center text-[#A1A1A6] text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#01696F] hover:text-[#0C4E54] font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
