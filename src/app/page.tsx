import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Permit Tracer",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Building permit lead generation tool for HVAC, roofing, solar, electrical, and plumbing contractors. Get homeowner phone numbers from permit data.",
    url: "https://permittracer.com",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Plan" },
      { "@type": "Offer", price: "49", priceCurrency: "USD", name: "Basic Plan" },
      { "@type": "Offer", price: "149", priceCurrency: "USD", name: "Pro Plan" },
    ],
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "47" },
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#01696F]/10 blur-[120px]"/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"/>
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <img src="/logo-white.png" alt="Permit Tracer" className="h-8 object-contain"/>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 text-sm hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#01696F] hover:bg-[#0C4E54] text-white text-sm font-medium rounded-xl transition-colors">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero — show the outcome */}
      <section className="relative z-10 px-6 pt-12 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Social proof first */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="flex -space-x-2">
              {["bg-blue-500","bg-green-500","bg-amber-500","bg-rose-500"].map((c,i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-[#0A0A0F] flex items-center justify-center text-white text-xs font-bold`}>
                  {["JM","SK","TR","AL"][i]}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-sm">Trusted by contractors in 9 states</span>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
              Every new permit is<br/>
              <span className="text-[#01696F]">a door you should knock.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Get the homeowner's name, phone number, and address the moment a building permit is filed in your area. Before your competition even knows about it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="px-8 py-4 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-[#01696F]/20">
                Start Free — No Credit Card
              </Link>
            </div>
          </div>

          {/* Live demo card — THIS is what sells */}
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-3xl p-1 shadow-2xl">
              <div className="bg-[#0F0F15] rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-white text-sm font-medium">New lead just filed</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">🔥 Hot Lead — 87</span>
                </div>
                {/* Lead */}
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <p className="text-white text-lg font-bold">4711 Harwich St</p>
                    <p className="text-gray-500 text-sm">Orlando, FL 32808</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">Roofing</span>
                    <span className="text-[#01696F] text-sm font-bold font-mono">$18,500</span>
                    <span className="text-gray-600 text-xs">Filed 2 hours ago</span>
                  </div>
                  {/* Owner card */}
                  <div className="bg-white/[0.04] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#01696F]/20 flex items-center justify-center"><span className="text-sm">👤</span></div>
                      <div>
                        <p className="text-white text-sm font-bold">Rodriguez, Maria & Carlos</p>
                        <p className="text-gray-500 text-xs">Property Owner · Age 47</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/[0.04] rounded-lg px-3 py-2">
                        <p className="text-[#01696F] text-sm font-bold font-mono">(407) 555-0182</p>
                        <p className="text-gray-600 text-[10px]">Mobile · ✅ Not DNC</p>
                      </div>
                      <div className="bg-white/[0.04] rounded-lg px-3 py-2">
                        <p className="text-white text-xs">maria.r@gmail.com</p>
                        <p className="text-gray-600 text-[10px]">Email</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {["Not Interested","To Visit","Appt Set","Sold"].map(s=>(
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[11px] text-gray-400 border border-white/[0.06]">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">Real permit data. Real homeowner info. Updated daily.</p>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-3">From permit to phone call in 3 clicks</h2>
          <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">No more driving blind. Know exactly who needs your services before you knock.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Pick your trade", desc: "HVAC, roofing, solar, electrical, plumbing — we track permits across 12+ categories.", icon: "🎯" },
              { num: "2", title: "Get fresh leads daily", desc: "New permits filed today with property address, estimated value, and contractor on record.", icon: "📋" },
              { num: "3", title: "Skip trace & call", desc: "One tap gets the homeowner's name, phone, and email. Call them before anyone else.", icon: "📱" },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div className="text-[#01696F] text-xs font-bold mb-2">STEP {step.num}</div>
                <h3 className="text-white text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-3">Built for every trade that knocks doors</h2>
          <p className="text-center text-gray-500 mb-10">Not just solar. Permit Tracer works for any trade that uses permit data for leads.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { icon: "🏠", name: "Roofing", sub: "Storm claims, re-roofs" },
              { icon: "🌡️", name: "HVAC", sub: "Replacements, installs" },
              { icon: "☀️", name: "Solar", sub: "New roofs = solar leads" },
              { icon: "⚡", name: "Electrical", sub: "Panel upgrades, EV" },
              { icon: "🔧", name: "Plumbing", sub: "Water heaters, re-pipes" },
              { icon: "🪟", name: "Windows", sub: "Impact, energy savings" },
              { icon: "🏊", name: "Pool", sub: "New builds, resurfacing" },
              { icon: "🏗️", name: "General", sub: "New construction, reno" },
              { icon: "🧱", name: "Insulation", sub: "Attic, spray foam" },
              { icon: "🔥", name: "Fire", sub: "Sprinklers, alarms" },
            ].map(ind=>(
              <div key={ind.name} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <span className="text-xl">{ind.icon}</span>
                <p className="text-white text-sm font-medium mt-1">{ind.name}</p>
                <p className="text-gray-600 text-[10px]">{ind.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Replacement Ready */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-amber-500/10 rounded-2xl p-6">
                <p className="text-3xl mb-2">💡</p>
                <p className="text-white font-bold mb-1">HVAC installed in 2018</p>
                <p className="text-amber-400 text-sm font-medium">8 years old — approaching end of life</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full w-[60%] bg-amber-500 rounded-full"/></div>
                  <span className="text-amber-400 text-xs">60% lifespan used</span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <h3 className="text-xl font-bold mb-2">Replacement Ready leads</h3>
              <p className="text-gray-400 text-sm leading-relaxed">An HVAC unit from 2018 is due. A roof from 2012 is aging. We find old permits where the system is reaching end of life — your next replacement sale.</p>
            </div>
          </div>

          {/* Upsell */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-purple-500/[0.08] to-transparent border border-purple-500/10 rounded-2xl p-6">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-white font-bold mb-1">New roof permit filed yesterday</p>
                <p className="text-purple-400 text-sm font-medium">Perfect time to sell solar</p>
                <p className="text-gray-500 text-xs mt-2">The roof is brand new — no need to reroof before install. Homeowner is already spending. Close the deal.</p>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <h3 className="text-xl font-bold mb-2">Upsell Ready leads</h3>
              <p className="text-gray-400 text-sm leading-relaxed">A new roof = a solar lead. An HVAC install = an insulation upsell. We cross-reference permits to find upsell opportunities you'd never find on your own.</p>
            </div>
          </div>

          {/* Map */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-[#01696F]/10 to-transparent border border-[#01696F]/10 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-white font-bold mb-1">Map view with pins</p>
                <p className="text-gray-500 text-sm">See every permit as a pin. Hot leads pulse. Click to skip trace.</p>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <h3 className="text-xl font-bold mb-2">Canvass smarter</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Open the map, zoom to your neighborhood, see every active permit. Plan your route around where the work is actually happening.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-3">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-10">Start free. Upgrade when you're closing deals.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Free", price: "$0", features: ["100 permits", "3 skip traces/mo", "1 state", "Basic filters"] },
              { name: "Basic", price: "$49", popular: true, features: ["1,000 permits", "100 skip traces/mo", "3 states", "All filters + search", "CSV export"] },
              { name: "Pro", price: "$149", features: ["Unlimited permits", "1,000 skip traces/mo", "All states", "Map view", "Priority data refresh"] },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 ${plan.popular ? "bg-[#01696F]/10 border-2 border-[#01696F]/30 ring-1 ring-[#01696F]/10" : "bg-white/[0.04] border border-white/[0.06]"}`}>
                {plan.popular && <p className="text-[#01696F] text-xs font-bold mb-3">MOST POPULAR</p>}
                <h3 className="text-white text-lg font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-4">
                  <span className="text-white text-3xl font-bold font-mono">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-gray-500 text-sm">/mo</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400"><span className="text-[#01696F]">&#10003;</span>{f}</li>
                  ))}
                </ul>
                <Link href="/signup" className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${plan.popular ? "bg-[#01696F] hover:bg-[#0C4E54] text-white" : "bg-white/[0.06] hover:bg-white/[0.1] text-white"}`}>
                  {plan.price === "$0" ? "Start Free" : `Get ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop driving blind.</h2>
          <p className="text-gray-400 text-lg mb-8">Every day, permits are filed in your area. Every one is a potential sale. Start finding them.</p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-[#01696F]/20">
            Start Free — 30 Seconds to Sign Up
          </Link>
          <p className="text-gray-600 text-xs mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 text-center text-gray-700 text-xs">
        Permit Tracer &copy; {new Date().getFullYear()}
      </footer>
    </div>
    </>
  );
}
