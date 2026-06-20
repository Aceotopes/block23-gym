# Development Log — Phase 4: Dashboard Analytics
**Date:** 2026-06-20
**Session type:** Implementation
**Branch:** main
**Builds on:** Phase 3 + documentation sync (commit `f7d98ce`)

---

## Overview

Phase 4 replaces the placeholder dashboard page (a single logout button stub) with a full analytics landing page. The page is a server component that runs 8 Prisma queries in parallel and aggregates the results into KPI metrics, trend chart data, and an expiring memberships list.

A charting library (Recharts) was added for the two trend charts. The dashboard is read-only — no mutations from this page.

---

## Problem with npm install

The project uses pnpm (confirmed via `pnpm-lock.yaml` and `pnpm-workspace.yaml`). Attempting `npm install recharts` failed with "Cannot read properties of null (reading 'matches')" — a known npm 10 peer dependency resolution bug. Resolved by using `pnpm add recharts`, which installed cleanly.

**Recharts version:** 3.8.1

---

## Files Changed

| File | Change Type | Summary |
|---|---|---|
| `src/app/(dashboard)/dashboard/page.tsx` | Rewritten | Full server component with 8 parallel Prisma queries |
| `src/components/dashboard/dashboard-kpi-cards.tsx` | New | 4-column KPI grid — server component |
| `src/components/dashboard/expiring-memberships.tsx` | New | Expiring memberships list — server component |
| `src/components/dashboard/attendance-chart.tsx` | New | Daily attendance bar chart — client component |
| `src/components/dashboard/revenue-chart.tsx` | New | Monthly revenue bar chart — client component |
| `pnpm-lock.yaml` | Modified | Added recharts 3.8.1 and its dependencies |

---

## Dashboard Page — `src/app/(dashboard)/dashboard/page.tsx`

Converted from a `"use client"` logout stub to a full React Server Component. The logout button is removed — the navbar already handles this.

### 8 Parallel Queries (`Promise.all`)

All eight queries fire concurrently. No sequential dependency between them.

| # | Query | Purpose |
|---|---|---|
| 1 | `attendance.findMany` — timeIn today | Today's total / members / walk-ins split |
| 2 | `membership.count` — ACTIVE, endDate > now | Active member KPI |
| 3 | `attendance.count` — WALK_IN, timeIn this month | Walk-ins this month KPI |
| 4 | `payment.findMany` — PAID, createdAt this month | Current month revenue KPI |
| 5 | `payment.findMany` — PAID, createdAt last month | Previous month revenue (for delta) |
| 6 | `membership.findMany` — ACTIVE, endDate next 30 days | Expiring memberships list |
| 7 | `attendance.findMany` — timeIn last 30 days | Attendance trend chart data |
| 8 | `payment.findMany` — PAID, createdAt last 12 months | Revenue trend chart data |

Queries 4 and 5 return raw Decimal amounts; converted with `Number()` before arithmetic. Queries 7 and 8 return raw records; aggregated into bucketed arrays in JavaScript (not SQL GROUP BY) for simplicity and portability.

### Trend Data Aggregation

**Attendance trend (last 30 days):**
```typescript
const attendanceByDay = new Map<string, number>();
for (const record of attendanceTrendRaw) {
  const key = format(record.timeIn, "MM/dd");
  attendanceByDay.set(key, (attendanceByDay.get(key) ?? 0) + 1);
}
const attendanceTrendData = eachDayOfInterval({ start: last30Start, end: now })
  .map((day) => ({ date: format(day, "MM/dd"), count: attendanceByDay.get(key) ?? 0 }));
```

`eachDayOfInterval` generates every day in the range so that days with zero attendance still appear in the chart (no gaps).

**Revenue trend (last 12 months):**
Same pattern using `eachMonthOfInterval` and `format(month, "MMM yy")`. Months with zero revenue render as ₱0 bars rather than missing bars.

### Revenue Delta

Computed as `(currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100`, rounded to the nearest integer. If no previous month data exists, `revenueDeltaPct` is `null` and the KPI card shows "No data last month" instead of a percentage.

### date-fns Functions Used

`startOfDay`, `endOfDay`, `startOfMonth`, `endOfMonth`, `subDays`, `subMonths`, `addDays`, `format`, `eachDayOfInterval`, `eachMonthOfInterval` — all confirmed present in date-fns 4.4.0.

---

## New Components

### `DashboardKpiCards` (`src/components/dashboard/dashboard-kpi-cards.tsx`)

Server component. Receives all KPI values as props (no data fetching). Renders a 4-column responsive grid:

| Card | Value | Subtext |
|---|---|---|
| Today's Attendance | Total check-ins | `{members} members · {walkIns} walk-ins` |
| Active Members | Count | "With valid membership" |
| Walk-ins This Month | Count | "Pay-per-visit visitors" |
| Revenue This Month | ₱ total | ▲/▼ delta % vs last month (TrendingUp / TrendingDown icon) |

Delta color: green for positive (`text-green-600`), red for negative (`text-red-500`). No icon on any KPI card beyond the trend arrow (per design direction: icons restrained to navigation + actions only).

---

### `ExpiringMemberships` (`src/components/dashboard/expiring-memberships.tsx`)

Server component. Receives `{ id, endDate: Date, client: { firstName, lastName } }[]` from the page — Date objects are safe to pass between server components.

Uses `differenceInDays(endDate, now)` to compute days remaining per membership. Badge color:
- ≤ 7 days: `variant="destructive"` (red)
- ≤ 14 days: amber (inline `bg-amber-100 text-amber-800`)
- > 14 days: `variant="secondary"` (gray)

Shows "No memberships expiring" empty state when the list is empty. List is pre-sorted `orderBy: { endDate: "asc" }` from the Prisma query — no client-side sort.

---

### `AttendanceChart` (`src/components/dashboard/attendance-chart.tsx`)

Client component (`"use client"`). Receives `{ date: string, count: number }[]` — fully serializable; no Date objects cross the server/client boundary.

Recharts `ResponsiveContainer > BarChart`. Grid lines are horizontal-only (`vertical={false}`). X-axis shows every 7th label (`interval={6}`) to avoid overlap on 30 labels. Bar radius `[3, 3, 0, 0]` for rounded tops.

Tooltip formatter corrected for Recharts 3 types: `(value) => [value ?? 0, "Check-ins"]` — `value` is typed as `ValueType | undefined` in v3, not `number`.

Color: `var(--foreground)` for bars — adapts to light/dark mode without hardcoded color.

---

### `RevenueChart` (`src/components/dashboard/revenue-chart.tsx`)

Client component. Same structure as AttendanceChart. Receives `{ month: string, revenue: number }[]`.

Y-axis tick formatter: `(v) => \`₱${(v / 1000).toFixed(0)}k\`` — shows ₱1k, ₱2k etc. to avoid long numbers on the axis. Tooltip shows the full ₱XX,XXX value.

Bar width capped at `maxBarSize={28}` — prevents overly wide bars when month count is low.

---

## CSS Variable Usage in Recharts

Recharts accepts CSS variable references in SVG attributes (e.g. `stroke="var(--border)"`). This works because Tailwind v4 stores full color values in the variables (`oklch(0.90 0.00 250)`) rather than channel components. Modern browsers resolve `var()` in SVG presentation attributes correctly.

Initial implementation incorrectly used `hsl(var(--border))` — the `hsl()` wrapper is the Tailwind v3 pattern where variables stored space-separated channels. Fixed to `var(--border)` to match the Tailwind v4 / oklch token structure.

---

## TypeScript

`npx tsc --noEmit` — zero errors after one round of fixes.

**Fix required:** Recharts 3 types the Tooltip `formatter` callback's first parameter as `ValueType | undefined` (not `number`). Removed the explicit `number` type annotation and used `value ?? 0` fallback:
```tsx
// Before (type error):
formatter={(value: number) => [value, "Check-ins"]}

// After:
formatter={(value) => [value ?? 0, "Check-ins"]}
```

---

## What Is NOT Changed

Per Phase 4 scope boundary:

- No actions or mutations from the dashboard — read-only
- No loading.tsx / skeleton loaders yet — Phase 9 (design system) adds skeleton loaders for KPI cards and charts
- No dark-mode-specific chart colors — Phase 9 applies the full token set; current bars use `var(--foreground)` which adapts automatically
- Dashboard not gated to any role — all authenticated staff see it (Settings will be ADMIN-only in Phase 6)
- Expiring memberships list is limited to 10 records (`take: 10`) — no pagination needed for an operational dashboard widget

---

## Next Phase

**Phase 5 — Settings Page**

- Gym profile editing (gymName, address, contactInfo)
- Membership plan management (CRUD on `MembershipPlan`)
- Fix CODE-08: pass `planId` to all three membership creation actions
- Fix MEM-01: read plan prices from `MembershipPlan` instead of hardcoded ₱1200/₱2400/₱3600
- Fix CODE-07: read `walkInActiveDays` from GymSettings in `client-status.ts`
- Gate the Settings page to ADMIN role
