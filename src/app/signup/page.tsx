"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) { setError("Please enter your first and last name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/onboarding/company"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Permit Tracer" className="h-14 object-contain mx-auto mb-5"/>
          <h1 className="text-[#1D1D1F] text-2xl font-bold mb-1">Create your free account</h1>
          <p className="text-[#6E6E73] text-sm">Start finding permit leads in 30 seconds. No credit card required.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                  placeholder="Smith" />
              </div>
            </div>

            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Work Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="john@company.com" />
            </div>

            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 transition-all shadow-sm"
                placeholder="At least 6 characters" />
            </div>

            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:ring-1 transition-all shadow-sm ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200/50"
                    : confirmPassword && confirmPassword === password
                    ? "border-green-300 focus:border-green-400 focus:ring-green-200/50"
                    : "border-gray-200 focus:border-[#01696F] focus:ring-[#01696F]/20"
                }`}
                placeholder="Type password again" />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-green-600 text-xs mt-1">Passwords match ✓</p>
              )}
            </div>

            <button type="submit" disabled={loading || !firstName || !lastName || !email || !password || password !== confirmPassword}
              className="w-full py-3.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold transition-colors disabled:opacity-40 shadow-sm text-base">
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-[#A1A1A6] text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#01696F] hover:text-[#0C4E54] font-medium">Log in</Link>
        </p>

        <p className="text-center text-[#A1A1A6] text-xs mt-4">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
