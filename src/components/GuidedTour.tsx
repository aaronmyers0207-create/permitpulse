"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_STORAGE_KEY = "permit_tracer_tour_complete";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  content: string;
  isLast?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "leads-list",
    title: "Your Hottest Leads",
    content:
      "These are your hottest permit leads — filed recently in your area. Sorted by score so the best ones are always on top.",
  },
  {
    target: "lead-card",
    title: "Lead Card",
    content:
      "Each card shows the address, permit type, estimated value, and how fresh it is. Green dot = filed today.",
  },
  {
    target: "score-badge",
    title: "Lead Score",
    content:
      "The score tells you how hot this lead is. 80+ is hot — that means it's recent, high value, and matches your trade.",
  },
  {
    target: "skip-trace-btn",
    title: "Skip Trace",
    content:
      "This is the magic button. Hit Skip Trace and we'll find the homeowner's name and phone number instantly.",
  },
  {
    target: "status-buttons",
    title: "Track Your Pipeline",
    content:
      "After you call, mark the lead — Contacted, Appt Set, Sold. Track your whole pipeline right here.",
    isLast: true,
  },
];

interface TooltipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowSide: "top" | "bottom" | "left" | "right";
  arrowOffset: number;
}

function getTooltipPosition(
  rect: TooltipRect,
  tooltipWidth: number,
  tooltipHeight: number,
  isMobile: boolean
): TooltipPosition {
  if (isMobile) {
    // On mobile: always show at bottom of screen, centered
    return {
      top: window.innerHeight - tooltipHeight - 24,
      left: Math.max(12, (window.innerWidth - tooltipWidth) / 2),
      arrowSide: "bottom",
      arrowOffset: tooltipWidth / 2,
    };
  }

  const GAP = 14;
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  // Prefer below the element
  if (rect.top + rect.height + GAP + tooltipHeight < vpH) {
    const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(12, Math.min(rawLeft, vpW - tooltipWidth - 12));
    const arrowOffset = rect.left + rect.width / 2 - clampedLeft;
    return {
      top: rect.top + rect.height + GAP,
      left: clampedLeft,
      arrowSide: "top",
      arrowOffset: Math.max(16, Math.min(arrowOffset, tooltipWidth - 16)),
    };
  }

  // Try above
  if (rect.top - GAP - tooltipHeight > 0) {
    const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(12, Math.min(rawLeft, vpW - tooltipWidth - 12));
    const arrowOffset = rect.left + rect.width / 2 - clampedLeft;
    return {
      top: rect.top - tooltipHeight - GAP,
      left: clampedLeft,
      arrowSide: "bottom",
      arrowOffset: Math.max(16, Math.min(arrowOffset, tooltipWidth - 16)),
    };
  }

  // Try right
  if (rect.left + rect.width + GAP + tooltipWidth < vpW) {
    const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2;
    const clampedTop = Math.max(12, Math.min(rawTop, vpH - tooltipHeight - 12));
    return {
      top: clampedTop,
      left: rect.left + rect.width + GAP,
      arrowSide: "left",
      arrowOffset: rect.top + rect.height / 2 - clampedTop,
    };
  }

  // Fallback: left
  const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2;
  const clampedTop = Math.max(12, Math.min(rawTop, vpH - tooltipHeight - 12));
  return {
    top: clampedTop,
    left: Math.max(12, rect.left - tooltipWidth - GAP),
    arrowSide: "right",
    arrowOffset: rect.top + rect.height / 2 - clampedTop,
  };
}

export default function GuidedTour({ userId, showButton = true }: { userId?: string; showButton?: boolean }) {
  const storageKey = userId ? `permit_tracer_tour_${userId}` : TOUR_STORAGE_KEY;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<TooltipRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false); // for fade-in animation
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const TOOLTIP_WIDTH = 300;
  const TOOLTIP_HEIGHT_ESTIMATE = 160;

  const completeTour = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setActive(false);
      try {
        localStorage.setItem(storageKey, "true");
      } catch {}
    }, 200);
  }, []);

  const positionTooltip = useCallback(
    (targetAttr: string) => {
      const el = document.querySelector(`[data-tour="${targetAttr}"]`);
      if (!el) {
        // Element not found — skip to next step automatically
        return false;
      }

      const rect = el.getBoundingClientRect();
      // Scroll element into view if needed
      const inView =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight;

      if (!inView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Re-measure after scroll
        setTimeout(() => positionTooltip(targetAttr), 400);
        return true;
      }

      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);

      const sr: TooltipRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      setSpotlightRect(sr);

      const th = tooltipRef.current?.offsetHeight || TOOLTIP_HEIGHT_ESTIMATE;
      const pos = getTooltipPosition(sr, TOOLTIP_WIDTH, th, mobile);
      setTooltipPos(pos);

      return true;
    },
    []
  );

  // Reposition on resize/scroll
  useEffect(() => {
    if (!active) return;

    const reposition = () => {
      const step = TOUR_STEPS[stepIndex];
      if (step) positionTooltip(step.target);
    };

    window.addEventListener("resize", reposition, { passive: true });
    window.addEventListener("scroll", reposition, { passive: true });

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition);
    };
  }, [active, stepIndex, positionTooltip]);

  // Initialize tour
  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (seen) return;
    } catch {}

    // Small delay to let the dashboard fully render
    const timer = setTimeout(() => {
      setActive(true);
      setStepIndex(0);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Position whenever step changes
  useEffect(() => {
    if (!active) return;
    setVisible(false);

    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    // Short delay for transition feel
    const timer = setTimeout(() => {
      const found = positionTooltip(step.target);
      if (!found) {
        // Skip unfound elements
        if (stepIndex < TOUR_STEPS.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          completeTour();
        }
        return;
      }
      setVisible(true);
    }, 120);

    return () => clearTimeout(timer);
  }, [active, stepIndex, positionTooltip, completeTour]);

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const startTour = () => {
    try { localStorage.removeItem(storageKey); } catch {}
    setStepIndex(0);
    setActive(true);
  };

  if (!active) return showButton ? (
    <button
      onClick={startTour}
      title="Take a tour"
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#01696F] text-white text-sm font-bold shadow-lg hover:bg-[#0C4E54] transition-colors flex items-center justify-center"
    >
      ?
    </button>
  ) : null;

  const step = TOUR_STEPS[stepIndex];
  const totalSteps = TOUR_STEPS.length;

  // Arrow styles
  const arrowSize = 7;
  const arrowStyle = (): React.CSSProperties => {
    if (!tooltipPos) return {};
    const base: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
      pointerEvents: "none",
    };
    switch (tooltipPos.arrowSide) {
      case "top":
        return {
          ...base,
          top: -arrowSize,
          left: tooltipPos.arrowOffset - arrowSize,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid #1D1D1F`,
        };
      case "bottom":
        return {
          ...base,
          bottom: -arrowSize,
          left: tooltipPos.arrowOffset - arrowSize,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid #1D1D1F`,
        };
      case "left":
        return {
          ...base,
          left: -arrowSize,
          top: tooltipPos.arrowOffset - arrowSize,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid #1D1D1F`,
        };
      case "right":
        return {
          ...base,
          right: -arrowSize,
          top: tooltipPos.arrowOffset - arrowSize,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid #1D1D1F`,
        };
    }
  };

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      {spotlightRect && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            pointerEvents: "none",
            transition: "opacity 200ms ease",
            opacity: visible ? 1 : 0,
          }}
        >
          {/* Four overlay panels that create a spotlight cutout */}
          {/* Top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, spotlightRect.top - 4),
              background: "rgba(0,0,0,0.5)",
            }}
          />
          {/* Bottom */}
          <div
            style={{
              position: "absolute",
              top: spotlightRect.top + spotlightRect.height + 4,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
            }}
          />
          {/* Left */}
          <div
            style={{
              position: "absolute",
              top: Math.max(0, spotlightRect.top - 4),
              left: 0,
              width: Math.max(0, spotlightRect.left - 4),
              height: spotlightRect.height + 8,
              background: "rgba(0,0,0,0.5)",
            }}
          />
          {/* Right */}
          <div
            style={{
              position: "absolute",
              top: Math.max(0, spotlightRect.top - 4),
              left: spotlightRect.left + spotlightRect.width + 4,
              right: 0,
              height: spotlightRect.height + 8,
              background: "rgba(0,0,0,0.5)",
            }}
          />
          {/* Spotlight border ring */}
          <div
            style={{
              position: "absolute",
              top: spotlightRect.top - 4,
              left: spotlightRect.left - 4,
              width: spotlightRect.width + 8,
              height: spotlightRect.height + 8,
              borderRadius: 12,
              boxShadow: "0 0 0 3px rgba(1,105,111,0.6)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Clickable backdrop to skip */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          cursor: "default",
        }}
        onClick={completeTour}
        aria-hidden="true"
      />

      {/* Tooltip */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            zIndex: 9999,
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: isMobile ? `calc(100vw - 24px)` : TOOLTIP_WIDTH,
            maxWidth: "calc(100vw - 24px)",
            background: "#1D1D1F",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
            transition: "opacity 200ms ease, transform 200ms ease",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div style={arrowStyle()} />

          {/* Step counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {stepIndex + 1} of {totalSteps}
            </span>
            <button
              onClick={completeTour}
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 12,
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                transition: "color 150ms",
                lineHeight: 1,
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.35)")
              }
            >
              Skip Tour
            </button>
          </div>

          {/* Content */}
          <h3
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {step.title}
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 13,
              lineHeight: 1.55,
              marginBottom: 14,
            }}
          >
            {step.content}
          </p>

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 5,
              marginBottom: 14,
            }}
          >
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === stepIndex
                      ? "#01696F"
                      : i < stepIndex
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.2)",
                  transition: "width 200ms ease, background 200ms ease",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  flex: "0 0 auto",
                  padding: "8px 14px",
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 150ms",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.18)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.1)")
                }
              >
                Previous
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: 9,
                background: step.isLast ? "#01696F" : "#fff",
                color: step.isLast ? "#fff" : "#1D1D1F",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 150ms",
                lineHeight: 1,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "0.88")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "1")
              }
            >
              {step.isLast ? "Got it — show me my leads" : "Next"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
