"use client";

import { useEffect, useRef, useState } from "react";

interface StatsResponse {
  count: number;
  state: string | null;
  hours: number;
  fallback?: boolean;
}

const FALLBACK_COUNT = 47;

function useCountUp(target: number, duration: number = 1200): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    setCurrent(0);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

export default function LivePermitCounter() {
  const [targetCount, setTargetCount] = useState(0);
  const [state, setState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const displayCount = useCountUp(targetCount, 1400);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch("/api/stats/recent", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Non-OK response");
        const data: StatsResponse = await res.json();
        if (!cancelled) {
          setTargetCount(data.count ?? FALLBACK_COUNT);
          setState(data.state);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setTargetCount(FALLBACK_COUNT);
          setLoaded(true);
        }
      }
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateLabel = state ? ` in ${state}` : "";

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Pulsing green dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>

      <span className="text-gray-400 text-sm">
        <span
          className={`text-white font-medium tabular-nums transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {displayCount} new permit{displayCount !== 1 ? "s" : ""}
        </span>
        {!loaded && (
          <span className="text-white font-medium">
            <span className="inline-block w-8 h-3.5 rounded bg-white/20 animate-pulse align-middle" />
            {" "}new permits
          </span>
        )}{" "}
        filed{stateLabel} in the last 24 hours
      </span>
    </div>
  );
}
