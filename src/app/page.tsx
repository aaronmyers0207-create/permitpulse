import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#01696F]/10 blur-[120px]"/>
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"/>
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#01696F] flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="text-white font-semibold tracking-tight text-lg">PermitPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 text-sm hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl transition-colors">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Find leads.<br/>
              <span className="text-[#01696F]">Close deals.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Real-time building permit data for HVAC, roofing, solar, electrical, plumbing, and every trade. Know who is building what, where — before your competition.
            </p>
            <div className="flex gap-3">
              <Link href="/signup" className="px-7 py-3.5 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors text-base">
                Start Free Trial
              </Link>
              <Link href="#features" className="px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors text-base">
                See Features
              </Link>
            </div>
            {/* Trust bar */}
            <div className="mt-10 flex items-center gap-6 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5"><span className="text-[#01696F]">&#10003;</span> No credit card</span>
              <span className="flex items-center gap-1.5"><span className="text-[#01696F]">&#10003;</span> 12+ city data feeds</span>
              <span className="flex items-center gap-1.5"><span className="text-[#01696F]">&#10003;</span> Skip trace built-in</span>
            </div>
          </div>

          {/* Hero product mock */}
          <div className="flex-1 relative">
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-3xl p-1 shadow-2xl">
              <div className="bg-[#0F0F15] rounded-[20px] p-5 space-y-3">
                {/* Mock stat cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[{l:"Hot Leads",v:"847",c:"text-red-400"},{l:"New Today",v:"63",c:"text-[#01696F]"},{l:"Starred",v:"24",c:"text-amber-400"}].map(s=>(
                    <div key={s.l} className="bg-white/[0.04] rounded-xl px-3 py-2.5">
                      <p className="text-gray-500 text-[10px]">{s.l}</p>
                      <p className={`${s.c} text-xl font-bold font-mono`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {/* Mock lead cards */}
                {[
                  {addr:"1423 MAGNOLIA AVE",city:"Orlando, FL",cat:"Roofing",val:"$18,500",score:"🔥 Hot",owner:"MARTINEZ, CARLOS"},
                  {addr:"7892 CYPRESS CREEK DR",city:"Austin, TX",cat:"Solar",val:"$32,000",score:"🔥 Hot",owner:"JOHNSON, SARAH & MARK"},
                  {addr:"345 N MICHIGAN AVE",city:"Chicago, IL",cat:"HVAC",val:"$12,800",score:"🟢 Warm",owner:"CHEN, DAVID"},
                ].map((l,i)=>(
                  <div key={i} className="bg-white/[0.04] rounded-xl px-3.5 py-3 flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i<2?"bg-red-400 animate-pulse":"bg-green-400"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-xs font-semibold truncate">{l.addr}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">{l.cat}</span>
                      </div>
                      <p className="text-gray-500 text-[10px]">{l.city}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[#01696F] text-xs font-bold font-mono">{l.val}</span>
                        <span className="text-gray-500 text-[10px]">{l.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries bar */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap justify-center gap-4">
          {[
            {icon:"🌡️",name:"HVAC"},{icon:"🏠",name:"Roofing"},{icon:"⚡",name:"Electrical"},
            {icon:"🔧",name:"Plumbing"},{icon:"☀️",name:"Solar"},{icon:"🏊",name:"Pool/Spa"},
            {icon:"🪟",name:"Windows"},{icon:"🏗️",name:"General"},{icon:"🔥",name:"Fire"},
          ].map(ind=>(
            <span key={ind.name} className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full text-gray-400 text-sm flex items-center gap-2">
              <span>{ind.icon}</span>{ind.name}
            </span>
          ))}
        </div>
      </section>

      {/* Feature sections */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-4">Everything you need to close more deals</h2>
          <p className="text-center text-gray-400 mb-20 max-w-lg mx-auto">Permit intelligence, skip tracing, lead scoring, and a map view — all in one platform built for door-to-door sales teams.</p>

          {/* Feature 1: Lead Scoring */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
                {[
                  {score:92,temp:"🔥",addr:"4519 SUNSET BLVD",cat:"Roofing",val:"$24,000",reason:"Filed 2 days ago · Owner on record · High value"},
                  {score:78,temp:"🔥",addr:"1102 ELM CREEK DR",cat:"HVAC",val:"$8,500",reason:"Filed this week · Matches your trade · Contractor known"},
                  {score:41,temp:"🟢",addr:"892 PINE ST",cat:"Solar",val:"$15,200",reason:"Filed this month · Owner on record"},
                ].map((l,i)=>(
                  <div key={i} className="bg-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="text-center"><p className="text-lg">{l.temp}</p><p className="text-[10px] text-gray-500 font-mono">{l.score}</p></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-white text-sm font-semibold">{l.addr}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">{l.cat}</span><span className="text-[#01696F] text-xs font-bold font-mono ml-auto">{l.val}</span></div>
                      <p className="text-gray-500 text-[10px] mt-0.5">{l.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <h3 className="text-2xl font-bold mb-3">AI Lead Scoring</h3>
              <p className="text-gray-400 leading-relaxed mb-4">Every permit is scored 0-100 based on recency, property value, owner data availability, and how well it matches your trade. Hot leads pulse so they jump off the page.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Scored by recency, value, and industry match","🔥 Hot / 🟢 Warm / ⚪ Cold at a glance","Filter to hot leads only"].map(f=>(<li key={f} className="flex items-center gap-2"><span className="text-[#01696F]">&#10003;</span>{f}</li>))}
              </ul>
            </div>
          </div>

          {/* Feature 2: Map */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-24">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] rounded-2xl p-4 aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl mb-3">🗺️</p>
                  <p className="text-white font-semibold">Interactive Permit Map</p>
                  <p className="text-gray-500 text-sm mt-1">Color-coded pins by trade, hot leads pulse</p>
                  <p className="text-gray-600 text-xs mt-3">Free — no Google Maps or Mapbox costs</p>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <h3 className="text-2xl font-bold mb-3">Map-first prospecting</h3>
              <p className="text-gray-400 leading-relaxed mb-4">See every permit as a pin on the map. Color-coded by category, sized by lead score. Pan, zoom, click — your next deal is right there.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Color-coded pins by trade category","Hot leads pulse on the map","Click any pin for property details + skip trace","Disposition buttons right on the card"].map(f=>(<li key={f} className="flex items-center gap-2"><span className="text-[#01696F]">&#10003;</span>{f}</li>))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Skip Trace */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="bg-white/[0.04] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#01696F]/20 flex items-center justify-center"><span className="text-lg">👤</span></div><div><p className="text-[10px] text-gray-500">Property Owner</p><p className="text-white text-sm font-semibold">MARTINEZ, CARLOS & MARIA</p></div></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] rounded-lg px-3 py-2"><p className="text-[10px] text-gray-500">Mobile</p><p className="text-white text-xs">(407) 555-0123</p><p className="text-[10px] text-green-400">Not on DNC</p></div>
                    <div className="bg-white/[0.04] rounded-lg px-3 py-2"><p className="text-[10px] text-gray-500">Email</p><p className="text-white text-xs">carlos.m@email.com</p></div>
                  </div>
                  <div className="flex gap-1.5">
                    {["Not Interested","To Visit","Go Back","Appt Set"].map(s=>(<span key={s} className="px-2 py-1 rounded-md bg-white/[0.06] text-[10px] text-gray-400">{s}</span>))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <h3 className="text-2xl font-bold mb-3">Skip trace anyone, instantly</h3>
              <p className="text-gray-400 leading-relaxed mb-4">One click gets you the property owner's phone numbers, emails, and mailing address. DNC status included. Integrates directly with the permit data — no copy-pasting.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Phone numbers with DNC status","Email addresses","One-click from any permit card","Included skip traces on every plan"].map(f=>(<li key={f} className="flex items-center gap-2"><span className="text-[#01696F]">&#10003;</span>{f}</li>))}
              </ul>
            </div>
          </div>

          {/* Feature 4: Storm Intelligence */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-24">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-amber-500/[0.08] to-red-500/[0.04] border border-amber-500/[0.1] rounded-2xl p-6">
                <div className="text-center space-y-3">
                  <p className="text-5xl">⛈️</p>
                  <h4 className="text-white font-bold">Storm + Permit Intelligence</h4>
                  <p className="text-gray-400 text-sm">Overlay recent storm data with roofing permits to find the hottest claim neighborhoods.</p>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/[0.04] rounded-lg px-2 py-2"><p className="text-amber-400 text-lg font-bold font-mono">2,847</p><p className="text-gray-500 text-[10px]">Storm claims filed</p></div>
                    <div className="bg-white/[0.04] rounded-lg px-2 py-2"><p className="text-red-400 text-lg font-bold font-mono">412</p><p className="text-gray-500 text-[10px]">Open roof permits</p></div>
                    <div className="bg-white/[0.04] rounded-lg px-2 py-2"><p className="text-[#01696F] text-lg font-bold font-mono">89%</p><p className="text-gray-500 text-[10px]">Success rate</p></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">Coming Soon</div>
              <h3 className="text-2xl font-bold mb-3">Storm claim targeting</h3>
              <p className="text-gray-400 leading-relaxed mb-4">Combine NOAA severe weather data with roofing permit activity to identify neighborhoods where storm damage claims are surging. Know exactly where to knock before the competition shows up.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Recent hail and wind event data by zip code","Cross-reference with open roofing permits","Identify neighborhoods with highest claim density","Perfect for roof replacement and insurance restoration"].map(f=>(<li key={f} className="flex items-center gap-2"><span className="text-amber-400">&#10003;</span>{f}</li>))}
              </ul>
            </div>
          </div>

          {/* Feature 5: Replacement + Upsell */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-purple-500/[0.08] to-white/[0.02] border border-purple-500/[0.08] rounded-2xl p-6 space-y-3">
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">Replacement</span>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">Upsell</span>
                </div>
                <p className="text-white text-sm font-semibold">New Roof → Solar Upsell</p>
                <p className="text-gray-500 text-xs">Homeowner just got a new roof — perfect time to pitch solar. The roof is fresh, no need to reroof before install.</p>
                <p className="text-white text-sm font-semibold mt-3">HVAC 8-15 Years Old → Replacement</p>
                <p className="text-gray-500 text-xs">AC units losing efficiency and approaching end of life. Homeowners are receptive before their system fails mid-summer.</p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <h3 className="text-2xl font-bold mb-3">3 ways to prospect</h3>
              <p className="text-gray-400 leading-relaxed mb-4">Fresh permits, aging systems due for replacement, and cross-sell opportunities. Each mode comes with built-in sales angles so your reps know exactly what to say.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                {["Fresh leads: new permits filed this week","Replacement: aging systems due for upgrade","Upsell: cross-sell based on recent work (new roof → solar)","Built-in sales pitch for every opportunity type"].map(f=>(<li key={f} className="flex items-center gap-2"><span className="text-[#01696F]">&#10003;</span>{f}</li>))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 bg-gradient-to-b from-transparent to-[#01696F]/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to find your next deal?</h2>
          <p className="text-gray-400 mb-8">Start with 100 free permits and 10 skip traces. No credit card required.</p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors text-lg">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 text-center text-gray-600 text-xs">
        PermitPulse &copy; {new Date().getFullYear()} &middot; Built for contractors who knock doors.
      </footer>
    </div>
  );
}
