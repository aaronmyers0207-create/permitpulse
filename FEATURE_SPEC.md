# Feature Spec: Dashboard Overhaul

## Files to modify:
- src/app/dashboard/DashboardClient.tsx (main dashboard)
- src/app/dashboard/page.tsx (server component)
- src/app/api/permits/route.ts (add status filter, what's new counts)
- src/app/api/permit-status/route.ts (NEW - update lead status)
- src/lib/scoring.ts (already created - lead scoring engine)

## Database changes needed (Supabase):
- permit_views table: add column `status text DEFAULT 'new'`
- permit_views table: add column `last_visited_at timestamptz`
- profiles table: add column `last_dashboard_visit timestamptz DEFAULT now()`

## 1. Lead Scoring (src/lib/scoring.ts - ALREADY DONE)
- scorePermit() returns { score: 0-100, temp: hot|warm|cold, reasons: string[] }
- Points: recency (30), owner name (20), industry match (25), value (15), contractor (10), active (5)
- Hot >= 60, Warm >= 35, Cold < 35

## 2. Dashboard Hero ("What's New")
At the top of the dashboard, ABOVE the stats cards, show a hero section:
```
🔥 47 new permits since your last visit
12 in your industry · 8 hot leads · 3 high value
[View New →]
```
- Query: count permits where filed_date > profile.last_dashboard_visit
- Update last_dashboard_visit when page loads
- Make this dismissible

## 3. Lead Cards (already card-based, enhance them)
Each permit card should show:
- LEFT: Lead score temperature indicator
  - 🔥 Hot = red/orange pulsing dot
  - 🟢 Warm = green dot  
  - ⚪ Cold = gray dot
- TOP RIGHT: Freshness badge
  - "Today" / "2d" / "1w" etc with color (green < 7d, yellow < 30d, gray older)
- MIDDLE: Address (bold), city/state/zip
- BOTTOM ROW:
  - Category badge (already have)
  - Value in green if present
  - Owner name with person icon (if available)
  - Contractor with building icon (if available)
  - Lead status pill (New / Contacted / Appt Set / etc) - clickable to change
- The score reasons should show on hover or in the drawer

## 4. Lead Status Tracking
- Each permit card has a small status pill (default: "New")
- Click the pill to cycle through: New → Contacted → Not Home → Call Back → Appt Set → Not Interested → Sold
- Status stored in permit_views table
- Add a status filter dropdown in the filter bar
- API route: POST /api/permit-status { permitId, status }

## 5. Contractor Intel
- If a permit has a contractor name, show it with a subtle badge
- In the detail drawer, show: "This contractor has X active permits in your area"
- Use a simple count query grouped by contractor_name

## 6. Filter Enhancements
- Add "Status" filter: All / New / Contacted / Appt Set / etc
- Add "Score" filter: All / Hot Only / Warm+ / All
- The filter bar should feel quick and responsive

## 7. Detail Drawer Improvements
- Lead score section at top: "🔥 Hot Lead — Score: 78/100" with reasons listed
- Quick status buttons in a row (like disposition buttons)
- Skip trace CTA (already built)
- Star/save (already built)
- Add "Notes" textarea that saves to permit_views
- Contractor intel: "TESLA ENERGY has 47 permits in TX"

## Design:
- Keep the warm cream/glassy Perplexity style
- Accent color: teal #01696F
- Hot leads should visually POP — the pulsing dot, the border highlight
- Warm leads look inviting but not urgent
- Cold leads look muted
- Status pills use soft colors matching the LEAD_STATUSES in scoring.ts
