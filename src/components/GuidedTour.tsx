"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STEPS = [
  { target: "leads-list",     title: "Your Hottest Leads",   body: "These are fresh permits filed in your area, sorted by score. The best leads are always on top." },
  { target: "lead-card",      title: "Lead Card",             body: "Each card shows the address, permit type, estimated value, and how fresh it is. Green dot = filed today." },
  { target: "score-badge",    title: "Lead Score",            body: "80+ is hot — recent, high value, and matches your trade. Use this to prioritize who to call first." },
  { target: "skip-trace-btn", title: "Skip Trace ← This one", body: "Hit this button and we'll instantly find the homeowner's name and phone number." },
  { target: "status-buttons", title: "Track Your Pipeline",   body: "After you call, mark the lead — Contacted, Appt Set, Sold. Track your whole pipeline right here." },
];

export default function GuidedTour({ userId }: { userId?: string }) {
  const storageKey = useRef(userId ? `pt_tour_${userId}` : "pt_tour_default");
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Check localStorage and auto-start for new users
  useEffect(() => {
    storageKey.current = userId ? `pt_tour_${userId}` : "pt_tour_default";
    try {
      if (localStorage.getItem(storageKey.current)) return;
    } catch {}
    const t = setTimeout(() => setActive(true), 1000);
    return () => clearTimeout(t);
  }, [userId]);

  const getRect = useCallback((stepIndex: number) => {
    const target = STEPS[stepIndex]?.target;
    if (!target) return;
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setRect(el.getBoundingClientRect()), 300);
    } else {
      setRect(null);
    }
  }, []);

  useEffect(() => {
    if (active) getRect(step);
  }, [active, step, getRect]);

  // Recompute rect on scroll/resize
  useEffect(() => {
    if (!active) return;
    const update = () => getRect(step);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [active, step, getRect]);

  const done = () => {
    setActive(false);
    try { localStorage.setItem(storageKey.current, "true"); } catch {}
  };

  const startTour = () => {
    try { localStorage.removeItem(storageKey.current); } catch {}
    setStep(0);
    setActive(true);
  };

  // Tooltip position based on rect
  const tooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
    const vw = window.innerWidth;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number, left: number;

    if (spaceBelow >= 180) {
      top = rect.bottom + 12;
    } else if (spaceAbove >= 180) {
      top = rect.top - 172;
    } else {
      top = window.innerHeight / 2 - 80;
    }

    left = Math.min(Math.max(rect.left, 16), vw - 316);
    return { position: "fixed", top, left, width: 300, zIndex: 9999 };
  };

  if (!active) {
    return (
      <button
        onClick={startTour}
        title="Take a product tour"
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#01696F] text-white font-bold shadow-lg hover:bg-[#0C4E54] transition-colors flex items-center justify-center text-base"
      >
        ?
      </button>
    );
  }

  const current = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/50"
        onClick={done}
      />

      {/* Spotlight highlight around target */}
      {rect && (
        <div
          className="fixed z-[9991] rounded-xl ring-2 ring-[#01696F] ring-offset-2 pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle()} className="z-[9999]">
        <div className="bg-[#1D1D1F] text-white rounded-2xl shadow-2xl p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-[#01696F]" : "w-1.5 bg-white/20"}`} />
              ))}
            </div>
            <button onClick={done} className="text-white/40 hover:text-white text-xs transition-colors">Skip tour</button>
          </div>

          <p className="text-[#01696F] text-xs font-bold uppercase tracking-wider mb-1">Step {step + 1} of {STEPS.length}</p>
          <h3 className="text-white font-bold text-base mb-1.5">{current.title}</h3>
          <p className="text-white/70 text-sm leading-relaxed">{current.body}</p>

          <div className="flex items-center gap-2 mt-4">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
                ← Back
              </button>
            )}
            <button
              onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : done()}
              className="flex-1 py-2 rounded-lg bg-[#01696F] hover:bg-[#0a5459] text-white text-sm font-semibold transition-colors"
            >
              {step < STEPS.length - 1 ? "Next →" : "Got it — show me my leads"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
