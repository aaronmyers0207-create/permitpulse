"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { INDUSTRIES, COVERED_STATES } from "@/lib/industries";
import { TIERS, getUserTier, maxStates } from "@/lib/tiers";

interface Props {
  user: { id: string; email: string };
  profile: any;
}

export default function SettingsClient({ user, profile }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const tier = getUserTier(profile);

  // Profile form
  const [companyName, setCompanyName] = useState(profile.company_name || "");
  const [industry, setIndustry] = useState(profile.industry || "");
  const [states, setStates] = useState<string[]>(profile.states || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const toggleState = (code: string) => {
    if (states.includes(code)) {
      setStates(states.filter((s) => s !== code));
    } else if (states.length < maxStates(tier)) {
      setStates([...states, code]);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.from("profiles").update({
      company_name: companyName,
      industry,
      states,
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) { setPasswordMsg("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("Passwords don't match."); return; }
    setPasswordSaving(true);
    setPasswordMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) { setPasswordMsg(error.message); }
    else { setPasswordMsg("Password updated."); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="text-white font-semibold tracking-tight">PermitPulse</span>
            <span className="text-zinc-600 text-sm ml-1">/ Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Dashboard</a>
            <button onClick={handleLogout} className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* ── Profile ─────────────────────────────── */}
        <section className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-1">Profile</h2>
          <p className="text-zinc-600 text-sm mb-5">Update your company info and preferences.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-800 text-zinc-500 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors">
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.icon} {ind.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
                States <span className="text-zinc-700">({states.length}/{maxStates(tier)} on {tier.name} plan)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COVERED_STATES.map((st) => {
                  const isSelected = states.includes(st.code);
                  const isDisabled = !isSelected && states.length >= maxStates(tier);
                  return (
                    <button
                      key={st.code}
                      onClick={() => toggleState(st.code)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                        isSelected
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : isDisabled
                          ? "bg-zinc-900 border-zinc-800/50 text-zinc-700 cursor-not-allowed"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {st.code}
                    </button>
                  );
                })}
              </div>
              {states.length >= maxStates(tier) && tier.id !== "pro" && (
                <p className="text-amber-500/70 text-xs mt-2">Upgrade to unlock more states.</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveProfile} disabled={saving} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span className="text-green-400 text-sm">Saved</span>}
            </div>
          </div>
        </section>

        {/* ── Password ────────────────────────────── */}
        <section className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-1">Password</h2>
          <p className="text-zinc-600 text-sm mb-5">Update your account password.</p>

          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors" placeholder="Repeat password" />
            </div>
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes("updated") ? "text-green-400" : "text-red-400"}`}>{passwordMsg}</p>}
            <button onClick={updatePassword} disabled={passwordSaving || !newPassword} className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </section>

        {/* ── Subscription ────────────────────────── */}
        <section className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-1">Subscription</h2>
          <p className="text-zinc-600 text-sm mb-5">
            You are on the <span className="text-white font-medium">{tier.name}</span> plan.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((t) => {
              const isCurrent = t.id === tier.id;
              return (
                <div
                  key={t.id}
                  className={`relative rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? "bg-green-500/5 border-green-500/30 ring-1 ring-green-500/10"
                      : t.popular
                      ? "bg-zinc-900 border-zinc-700"
                      : "bg-zinc-900/50 border-zinc-800/60"
                  }`}
                >
                  {t.popular && !isCurrent && (
                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
                      Current Plan
                    </div>
                  )}
                  <div className="mb-3 mt-1">
                    <h3 className="text-white font-semibold text-lg">{t.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-white text-2xl font-bold font-mono">{t.price === 0 ? "Free" : `$${t.price}`}</span>
                      {t.price > 0 && <span className="text-zinc-600 text-sm">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5 text-xs">&#10003;</span>
                        <span className="text-zinc-400">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-zinc-800/50 text-zinc-600 cursor-default"
                        : t.popular
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : t.cta}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-zinc-700 text-xs mt-4">Payment integration coming soon. Contact us to upgrade.</p>
        </section>
      </div>
    </div>
  );
}
