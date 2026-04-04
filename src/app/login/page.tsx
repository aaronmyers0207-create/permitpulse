"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/dashboard"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#01696F] flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
            <span className="text-[#1D1D1F] text-2xl font-semibold tracking-tight">PermitPulse</span>
          </div>
          <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1.5">Welcome back</h1>
          <p className="text-[#6E6E73] text-sm">Log in to see your latest permit leads.</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-sm p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="Your password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-50 shadow-sm">
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
        <p className="text-center text-[#A1A1A6] text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#01696F] hover:text-[#0C4E54] font-medium">Start free trial</Link>
        </p>
      </div>
    </div>
  );
}
