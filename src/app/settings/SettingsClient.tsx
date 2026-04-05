"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { INDUSTRIES, COVERED_STATES } from "@/lib/industries";
import { TIERS, getUserTier, maxStates } from "@/lib/tiers";

interface Props { user: { id: string; email: string }; profile: any; }

export default function SettingsClient({ user, profile }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = getUserTier(profile);
  const upgraded = searchParams.get("upgraded");

  const [companyName, setCompanyName] = useState(profile.company_name || "");
  const [industry, setIndustry] = useState(profile.industry || "");
  const [states, setStates] = useState<string[]>(profile.states || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");

  const toggleState = (code: string) => {
    if (states.includes(code)) setStates(states.filter((s) => s !== code));
    else if (states.length < maxStates(tier)) setStates([...states, code]);
  };

  const saveProfile = async () => {
    setSaving(true); setSaved(false);
    await supabase.from("profiles").update({ company_name: companyName, industry, states }).eq("id", user.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) { setPasswordMsg("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("Passwords don't match."); return; }
    setPasswordSaving(true); setPasswordMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) setPasswordMsg(error.message);
    else { setPasswordMsg("Password updated."); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleCheckout = async (tierId: string) => {
    setCheckoutLoading(tierId);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tierId }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert(data.error || "Failed to start checkout"); setCheckoutLoading(""); }
    } catch { setCheckoutLoading(""); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  return (
    <div className="min-h-screen">
      <nav className="glass-strong sticky top-0 z-30 border-b border-black/[0.04] px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Permit Tracer" className="h-7 object-contain"/>
            <span className="text-[#A1A1A6] text-sm ml-1">/ Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-[#6E6E73] text-sm hover:text-[#1D1D1F] transition-colors">Dashboard</a>
            <button onClick={handleLogout} className="text-[#A1A1A6] text-sm hover:text-[#1D1D1F] transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {upgraded && (
          <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-emerald-700 text-sm font-medium">You've been upgraded to the {upgraded.charAt(0).toUpperCase() + upgraded.slice(1)} plan. Enjoy your new limits.</p>
          </div>
        )}

        {/* Profile */}
        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm p-6">
          <h2 className="text-[#1D1D1F] text-lg font-semibold mb-1">Profile</h2>
          <p className="text-[#A1A1A6] text-sm mb-5">Update your company info and preferences.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#A1A1A6] text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 shadow-sm transition-all" />
            </div>
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm focus:outline-none focus:border-[#01696F] shadow-sm">
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (<option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">States <span className="text-[#A1A1A6]">({states.length}/{maxStates(tier)} on {tier.name})</span></label>
              <div className="flex flex-wrap gap-2">
                {COVERED_STATES.map((st) => {
                  const isSel = states.includes(st.code);
                  const isDis = !isSel && states.length >= maxStates(tier);
                  return (
                    <button key={st.code} onClick={() => toggleState(st.code)} disabled={isDis}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all shadow-sm ${isSel ? "bg-[#01696F]/[0.08] border-[#01696F]/30 text-[#01696F]" : isDis ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border-gray-200 text-[#6E6E73] hover:border-gray-300"}`}>
                      {st.code}
                    </button>
                  );
                })}
              </div>
              {states.length >= maxStates(tier) && tier.id !== "pro" && <p className="text-amber-600 text-xs mt-2">Upgrade to unlock more states.</p>}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveProfile} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              {saved && <span className="text-emerald-600 text-sm">Saved</span>}
            </div>
          </div>
        </section>

        {/* Password */}
        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm p-6">
          <h2 className="text-[#1D1D1F] text-lg font-semibold mb-1">Password</h2>
          <p className="text-[#A1A1A6] text-sm mb-5">Update your account password.</p>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 shadow-sm transition-all" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-[#6E6E73] text-xs font-medium uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1D1D1F] text-sm focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/20 shadow-sm transition-all" placeholder="Repeat password" />
            </div>
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes("updated") ? "text-emerald-600" : "text-red-500"}`}>{passwordMsg}</p>}
            <button onClick={updatePassword} disabled={passwordSaving || !newPassword} className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#1D1D1F] text-sm font-medium transition-colors shadow-sm disabled:opacity-50">{passwordSaving ? "Updating..." : "Update Password"}</button>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.04] rounded-2xl shadow-sm p-6">
          <h2 className="text-[#1D1D1F] text-lg font-semibold mb-1">Subscription</h2>
          <p className="text-[#A1A1A6] text-sm mb-5">You are on the <span className="text-[#1D1D1F] font-medium">{tier.name}</span> plan.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((t) => {
              const isCurrent = t.id === tier.id;
              return (
                <div key={t.id} className={`relative rounded-2xl border p-5 transition-all shadow-sm ${isCurrent ? "bg-[#01696F]/[0.04] border-[#01696F]/20 ring-1 ring-[#01696F]/10" : t.popular ? "bg-white border-gray-200" : "bg-white/60 border-black/[0.04]"}`}>
                  {t.popular && !isCurrent && <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-[#01696F] text-white text-xs font-medium shadow-sm">Most Popular</div>}
                  {isCurrent && <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-[#01696F]/10 text-[#01696F] text-xs font-medium border border-[#01696F]/20">Current Plan</div>}
                  <div className="mb-3 mt-1">
                    <h3 className="text-[#1D1D1F] font-semibold text-lg">{t.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[#1D1D1F] text-2xl font-bold font-mono">{t.price === 0 ? "Free" : `$${t.price}`}</span>
                      {t.price > 0 && <span className="text-[#A1A1A6] text-sm">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {t.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm"><span className="text-[#01696F] mt-0.5 text-xs">&#10003;</span><span className="text-[#6E6E73]">{f}</span></li>))}
                  </ul>
                  <button
                    onClick={() => !isCurrent && t.price > 0 && handleCheckout(t.id)}
                    disabled={isCurrent || checkoutLoading === t.id}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm ${isCurrent ? "bg-gray-100 text-[#A1A1A6] cursor-default" : t.popular ? "bg-[#01696F] hover:bg-[#0C4E54] text-white" : "bg-white hover:bg-gray-50 border border-gray-200 text-[#6E6E73]"}`}>
                    {checkoutLoading === t.id ? "Loading..." : isCurrent ? "Current Plan" : t.cta}
                  </button>
                </div>
              );
            })}
          </div>
          {/* Manage subscription */}
          {tier.id !== "free" && tier.id !== "admin" && (
            <div className="mt-5 flex items-center justify-between bg-white/50 border border-black/[0.04] rounded-xl px-5 py-4">
              <div>
                <p className="text-[#1D1D1F] text-sm font-medium">Manage your subscription</p>
                <p className="text-[#A1A1A6] text-xs">Update payment method, change plan, or cancel.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/billing/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else alert(data.error || "Failed to open billing portal");
                  } catch { alert("Failed to open billing portal"); }
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#6E6E73] text-sm rounded-xl shadow-sm transition-colors">
                Manage Billing
              </button>
            </div>
          )}
          {tier.id === "free" && (
            <p className="mt-4 text-[#A1A1A6] text-xs text-center">Upgrade to manage your subscription and billing.</p>
          )}
        </section>
      </div>
    </div>
  );
}
