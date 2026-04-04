import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, go straight to dashboard
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold tracking-tight text-lg">PermitPulse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-zinc-400 text-sm hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
            Live permit data from 12+ markets
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Building permits,<br />delivered to your inbox.
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto mb-8">
            Real-time permit data for HVAC, roofing, electrical, plumbing, solar, and more. Know who is building what, where — before your competitors do.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors">
              Start Free Trial
            </Link>
            <Link href="/login" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors">
              Log In
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3 max-w-xl">
          {["HVAC", "Roofing", "Electrical", "Plumbing", "Solar", "New Construction", "Renovation", "Demolition", "Pool/Spa", "Windows/Doors"].map((label) => (
            <span key={label} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-xs">
              {label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-zinc-600 text-xs">
        PermitPulse &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
