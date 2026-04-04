import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-30 border-b border-black/[0.04] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#01696F] flex items-center justify-center text-white font-bold text-sm shadow-sm">P</div>
            <span className="text-[#1D1D1F] font-semibold tracking-tight text-lg">PermitPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[#6E6E73] text-sm hover:text-[#1D1D1F] transition-colors">Log in</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl shadow-sm transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#01696F]/[0.08] text-[#01696F] text-xs font-medium mb-8">
            Live permit data from 12+ markets
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] leading-[1.15] tracking-tight mb-5">
            Building permits,<br />delivered as leads.
          </h1>
          <p className="text-[#6E6E73] text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Real-time permit data for HVAC, roofing, electrical, plumbing, solar, and more. Know who is building what, where — before your competitors do.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="px-7 py-3.5 bg-[#01696F] hover:bg-[#0C4E54] text-white font-medium rounded-xl shadow-sm transition-colors text-base">
              Start Free Trial
            </Link>
            <Link href="/login" className="px-7 py-3.5 bg-white/70 backdrop-blur-xl border border-black/[0.06] hover:bg-white text-[#1D1D1F] font-medium rounded-xl shadow-sm transition-colors text-base">
              Log In
            </Link>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-2.5 max-w-xl">
          {["HVAC", "Roofing", "Electrical", "Plumbing", "Solar", "New Construction", "Renovation", "Demolition", "Pool/Spa", "Windows/Doors"].map((label) => (
            <span key={label} className="px-3.5 py-1.5 bg-white/60 backdrop-blur-sm border border-black/[0.04] rounded-full text-[#6E6E73] text-xs shadow-sm">
              {label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.04] px-6 py-5 text-center text-[#A1A1A6] text-xs">
        PermitPulse &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
