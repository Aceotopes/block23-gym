# Design System — Block23 Gym Management System

> **Direction:** Iron & Gold — Authoritative
> **Last updated:** 2026-06-20
> **Status:** Specification complete. Implementation: Phase 9.

This document is the authoritative reference for all visual decisions in the Block23 Gym Management System. Before writing any CSS or Tailwind class, check this document first. When in doubt, ask: does this element earn its place?

---

## 1. Design Direction

**Iron & Gold — Authoritative**

The interface projects discipline and precision. The dark sidebar anchors the shell. The white content area is uncluttered. Warm gold appears only for primary action, active navigation, and selected state — never decoratively.

- **Emotional targets:** authoritative, premium, trustworthy, focused, efficient
- **References:** Vercel dashboard, Linear, Wodify
- **Gym identity:** Serious / Hardcore — disciplined athletes, not a recreational fitness club

---

## 2. Color System

All tokens live in `src/app/globals.css` using `oklch()`. **No hardcoded Tailwind color classes** (`bg-amber-500`, `text-green-600`, etc.) in component files. Every color goes through a token.

### 2a. Gold Accent

Gold is the sole brand accent. It appears in exactly five places: primary button, sidebar active pill, plan selector selected state, payment method selected state, and the KPI total revenue number. Nowhere else.

```css
--accent:             oklch(0.78 0.14 70);   /* warm gold ~#F5A623 */
--accent-foreground:  oklch(0.15 0.05 70);   /* near-black text on gold */
--accent-hover:       oklch(0.72 0.14 70);   /* slightly deeper on hover */
--accent-muted:       oklch(0.95 0.04 70);   /* pale gold tint — selected backgrounds */
```

### 2b. Sidebar

The sidebar is permanently dark regardless of the user's light/dark mode preference.

```css
--sidebar-bg:           oklch(0.14 0.01 250);  /* #111827 dark charcoal */
--sidebar-text:         oklch(0.62 0.02 250);  /* muted gray nav labels */
--sidebar-text-hover:   oklch(0.85 0.01 250);  /* lighter on hover */
--sidebar-active-bg:    var(--accent);          /* gold pill fill */
--sidebar-active-text:  var(--accent-foreground);
--sidebar-border:       oklch(0.20 0.01 250);  /* subtle item separator */
```

### 2c. Content Area — Light Mode (default)

```css
--background:         oklch(1.00 0 0);
--foreground:         oklch(0.09 0.01 250);
--card:               oklch(1.00 0 0);
--card-foreground:    oklch(0.09 0.01 250);
--muted:              oklch(0.96 0.00 250);
--muted-foreground:   oklch(0.50 0.01 250);
--border:             oklch(0.90 0.00 250);
--input:              oklch(0.90 0.00 250);
--ring:               var(--accent);
```

### 2d. Content Area — Dark Mode

```css
--background:         oklch(0.12 0.01 250);
--foreground:         oklch(0.95 0.00 250);
--card:               oklch(0.16 0.01 250);
--card-foreground:    oklch(0.95 0.00 250);
--muted:              oklch(0.20 0.01 250);
--muted-foreground:   oklch(0.55 0.01 250);
--border:             oklch(0.25 0.01 250);
--input:              oklch(0.25 0.01 250);
--ring:               var(--accent);
```

### 2e. Semantic Status Colors

The only place non-gold color appears as foreground or background. Do not add more status colors without updating this document.

```css
/* Active / Paid / Success */
--status-active:       oklch(0.64 0.19 145);
--status-active-bg:    oklch(0.95 0.05 145);
--status-active-text:  oklch(0.35 0.12 145);

/* Expired / Failed / Danger */
--status-danger:       oklch(0.59 0.22 25);
--status-danger-bg:    oklch(0.96 0.05 25);
--status-danger-text:  oklch(0.40 0.15 25);

/* Pending / Warning */
--status-warning:      oklch(0.72 0.16 60);
--status-warning-bg:   oklch(0.96 0.05 60);
--status-warning-text: oklch(0.40 0.12 60);

/* Inactive / Walk-In / Neutral */
--status-neutral-bg:   var(--muted);
--status-neutral-text: var(--muted-foreground);
```

**Status → color mapping (strict):**

| Status | Color |
|---|---|
| Membership: ACTIVE | green |
| Membership: EXPIRED | red |
| Payment: PAID | green |
| Payment: PENDING | amber |
| Payment: FAILED | red |
| Payment: REFUNDED | neutral gray |
| Client type: WALK_IN | neutral gray |
| Client type: MEMBER | no badge (conveyed by context) |

---

## 3. Typography

### Fonts

| Font | Role | Source |
|---|---|---|
| **Geist Sans** | Body, labels, inputs, table data, all UI text | Already in project (`next/font/local`) |
| **Bebas Neue** | Display — page titles, KPI numbers, dialog headings | Add via `next/font/google` |

**Integration** (`src/app/layout.tsx`):
```tsx
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});
```
Add `bebasNeue.variable` to `<body>` className. Add `--font-display: var(--font-bebas-neue)` to `globals.css`.

Use `className="font-[--font-display]"` or `style={{ fontFamily: "var(--font-display)" }}` for Bebas Neue.

**Bebas Neue is uppercase-only by design.** Never use it for user-generated content (client names, addresses) or any body text.

### Type Scale

| Usage | Size | Font | Weight |
|---|---|---|---|
| Page titles (Clients, Payments, etc.) | `text-4xl` / 2.25rem | Bebas Neue | 400 |
| KPI numbers (142, ₱48,000) | `text-3xl` / 1.875rem | Bebas Neue | 400 |
| Dialog headings | `text-2xl` / 1.5rem | Bebas Neue | 400 |
| Section headings within dialogs | `text-base` / 1rem | Geist Sans | 600 |
| Table data, form labels | `text-sm` / 0.875rem | Geist Sans | 400–500 |
| Muted labels, helper text | `text-xs` / 0.75rem | Geist Sans | 400 |
| Timestamps, secondary metadata | `text-[0.6875rem]` | Geist Sans | 400 |

---

## 4. Spacing and Sizing

### Border Radius

```css
--radius-sm:   0.375rem;   /* 6px — badges, inputs */
--radius:      0.5rem;     /* 8px — cards, dialogs, dropdowns (default) */
--radius-lg:   0.75rem;    /* 12px — modal overlays */
--radius-pill: 9999px;     /* sidebar active pill */
```

Remove the existing `--radius: 0.625rem` default and replace with this scale.

### Table Row Height

- Data rows: `h-12` (48px)
- Table headers: `h-10` (40px)
- Cell padding: `px-4 py-3`

### Sidebar Width

`w-56` (224px), fixed. Does not collapse. Desktop-only layout.

### Content Area

`max-w-screen-xl mx-auto px-6` on all page-level wrappers. Centers content on wide monitors.

---

## 5. Component Patterns

### 5a. Sidebar Navigation

The gym name appears at the top in Bebas Neue. Navigation items are icon + label. Active item gets a gold pill spanning the full width of the sidebar.

```
┌──────────────────────┐
│  BLOCK23 GYM         │  ← font-display text-xl text-white
├──────────────────────┤
│  ⊞ Dashboard         │  ← inactive
│  ● Clients           │  ← active: gold pill
│  ⊞ Attendance        │
│  ⊞ Payments          │
│  ⊞ Settings          │
│  ──────────────────  │
│  ⊞ Juan Dela Cruz    │
│  ⊞ Log out           │
└──────────────────────┘
```

**Active item:** `rounded-full bg-[--sidebar-active-bg] text-[--sidebar-active-text] px-3 py-2 w-full font-medium`

**Inactive item:** `text-[--sidebar-text] hover:text-[--sidebar-text-hover] hover:bg-[--sidebar-border] rounded-[--radius] px-3 py-2 transition-colors duration-100`

Icons: 16px, always left of the label. No standalone icons in the sidebar.

### 5b. KPI Cards

Horizontal compact layout. Four cards in a row spanning full content width. No icons.

```
┌──────────────────────────────────────┐
│  Active Members               142    │
│  ▲ +8 vs last week                  │
└──────────────────────────────────────┘
```

- Label: `text-sm text-muted-foreground`
- Number: `font-[--font-display] text-3xl text-foreground`
- Delta (positive): `text-[--status-active-text] text-xs`
- Delta (negative): `text-[--status-danger-text] text-xs`
- Card: `border bg-card rounded-[--radius] p-4 flex items-center justify-between`

### 5c. Data Tables

```css
/* Header row */
th { @apply h-10 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground; }

/* Data row */
tr { @apply h-12 border-b hover:bg-muted/30 transition-colors duration-100; }
td { @apply px-4 py-3 text-sm; }
```

**Empty state:**
```tsx
<div className="py-20 text-center">
  <p className="font-[--font-display] text-2xl text-foreground">[Context Title]</p>
  <p className="text-sm text-muted-foreground mt-1">[Actionable hint]</p>
</div>
```

Examples of good empty state messages:
- "No payments for today" / "Try switching to This Week or This Month."
- "No clients match your search" / "Try a different name or clear the filter."

Never just "No data."

### 5d. Status Badges

Use `src/components/ui/status-badge.tsx` — a wrapper that maps status strings to semantic classes. Do not write badge color classes inline across table files.

```tsx
<StatusBadge status="ACTIVE" />     // green
<StatusBadge status="EXPIRED" />    // red
<StatusBadge status="PAID" />       // green
<StatusBadge status="PENDING" />    // amber
<StatusBadge status="FAILED" />     // red
<StatusBadge status="REFUNDED" />   // neutral
<StatusBadge status="WALK_IN" />    // neutral
```

Badge size: `text-xs px-2 py-0.5 rounded-[--radius-sm] font-medium`

### 5e. Membership Plan Selector

Replaces the Select dropdown in all three membership dialogs. Implemented as `src/components/ui/plan-selector.tsx`.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   1 Month    │  │   2 Months   │  │   3 Months   │
│   30 days    │  │   60 days    │  │   90 days    │
│   ₱1,200     │  │   ₱2,400     │  │   ₱3,600     │
└──────────────┘  └──────────────┘  └──────────────┘
  ↑ selected: gold border + pale gold bg
```

**Selected tile:** `border-2 border-[--accent] bg-[--accent-muted] rounded-[--radius] cursor-pointer`

**Unselected tile:** `border border-[--border] bg-card rounded-[--radius] hover:border-[--accent-muted] cursor-pointer transition-colors duration-100`

**Plan name:** `text-sm font-medium text-foreground`
**Duration:** `text-xs text-muted-foreground`
**Amount:** `font-[--font-display] text-xl text-[--accent]` (Bebas Neue, gold)

Implementation: `<button role="radio">` pattern, not shadcn Select.

### 5f. Payment Method Selector

Keep the existing 3-button inline toggle (Cash / GCash / PayMaya). Update active state:

**Selected:** `bg-[--accent] text-[--accent-foreground] border-[--accent] hover:bg-[--accent-hover]`
**Unselected:** `variant="outline"` (existing shadcn)

### 5g. Dialogs

- **Title:** `font-[--font-display] text-2xl` (Bebas Neue, not Geist)
- **Description:** `text-sm text-muted-foreground`
- **Section panels:** `rounded-[--radius] border p-4 space-y-4`
- **Section heading:** `text-base font-semibold text-foreground`
- **Footer:** right-aligned, `Cancel` (outline) then primary action (gold fill)

### 5h. Buttons

**Primary (gold fill):** The only valid primary style.
```css
background: var(--accent);
color: var(--accent-foreground);
hover: var(--accent-hover);
border-radius: var(--radius);
```

**Secondary / Outline:** `variant="outline"` — no gold.
**Ghost:** `variant="ghost"` — no gold.
**Destructive:** `variant="destructive"` — red, reserved for delete actions only.

Do not use gold for secondary, ghost, or outline buttons.

### 5i. Form Inputs

- **Focus ring:** `ring-2 ring-[--ring]` (gold, via `--ring: var(--accent)`)
- **Normal border:** `border-[--input]`
- **Error border:** `border-[--status-danger]`
- **Error text:** `text-xs text-[--status-danger-text] mt-1`
- **Placeholder:** `text-muted-foreground`

---

## 6. Login Page

Full-screen dark background. Centered card above the fold.

```
┌───────────────────────────── full screen #111827 ────────────────────────────────┐
│                                                                                   │
│                              BLOCK23 GYM                                          │
│                         ← font-display text-5xl text-white text-center            │
│                                                                                   │
│                    ┌─────────────────────────────┐                               │
│                    │  Sign in to your account     │                               │
│                    │                              │                               │
│                    │  Email                       │                               │
│                    │  [──────────────────────]    │                               │
│                    │                              │                               │
│                    │  Password                    │                               │
│                    │  [──────────────────────]    │                               │
│                    │                              │                               │
│                    │  [error message if any]      │                               │
│                    │                              │                               │
│                    │  [      Sign In      ]       │  ← gold primary button        │
│                    └─────────────────────────────┘                               │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- Background: `min-h-screen bg-[--sidebar-bg] flex items-center justify-center`
- Card: `bg-card rounded-[--radius-lg] p-8 w-full max-w-sm shadow-lg`
- Gym name: `font-[--font-display] text-5xl text-white text-center tracking-wide mb-6`
- Card heading: `text-lg font-semibold text-foreground mb-4`
- Error message: `text-sm text-[--status-danger-text]` (replaces current `text-red-500`)

---

## 7. Motion

### Allowed

| Use case | Implementation |
|---|---|
| Async content loading | `animate-pulse bg-muted rounded-[--radius]` skeleton |
| Dialog open/close | Default Radix fade + scale (~150ms, keep as-is) |
| Dropdown open/close | Default Radix fade (keep as-is) |
| Hover state changes | `transition-colors duration-100` |
| Loading spinner | `<Loader2 className="animate-spin" />` |

### Not Allowed

- Page transitions
- Staggered list animations
- Bounce, float, or pulse for decorative purposes
- Scroll-triggered effects

### Where Skeleton Loaders Are Required

Implement skeleton loaders (pulsing placeholder shapes) for every async data fetch:

1. Payments table — while period query loads after filter change
2. Client payment history dialog — while `getClientPayments` runs on dialog open
3. Dashboard KPI cards — while aggregation queries load (Phase 4)
4. Dashboard charts — while trend data loads (Phase 4)

---

## 8. Icon Usage

**Library:** Lucide React (already installed).

### Allowed Locations

| Location | Size | Label? |
|---|---|---|
| Sidebar navigation | 16px | Always alongside label |
| Action buttons (edit, delete, view) | 16px | Icon-only, with Radix Tooltip |
| Form submit buttons with label | 16px | Left of label text |
| Loading state | 16px | `<Loader2 className="animate-spin" />` |

### Not Allowed

- Card headings or section titles
- Table column headers
- KPI cards
- Empty state (use text only)
- Decorative / illustrative use

**Icon-only buttons must always have a Radix `<Tooltip>` with a descriptive label.** No naked icon buttons.

---

## 9. Phase 9 — Implementation Reference

### New Files to Create

| File | Purpose |
|---|---|
| `src/components/ui/plan-selector.tsx` | RadioCard plan tiles component |
| `src/components/ui/status-badge.tsx` | Semantic status badge wrapper |

### Files to Update

| File | Change |
|---|---|
| `src/app/globals.css` | Replace achromatic tokens with full token set from this doc; add `--font-display` |
| `src/app/layout.tsx` | Add Bebas Neue font + variable to body |
| `src/app/(auth)/login/page.tsx` | Dark full-screen layout + centered card; fix `text-red-500` |
| `src/components/dashboard/sidebar.tsx` | Apply sidebar tokens; gold pill active state; Bebas Neue gym name |
| `src/components/clients/client-kpi-cards.tsx` | Horizontal compact layout; Bebas Neue numbers; remove hardcoded colors |
| `src/components/clients/create-client-dialog.tsx` | Replace Select with `PlanSelector` |
| `src/components/clients/renew-membership-dialog.tsx` | Replace Select with `PlanSelector` |
| `src/components/clients/convert-to-member-dialog.tsx` | Replace Select with `PlanSelector` |
| `src/components/clients/clients-table.tsx` | Row height `h-12`; header style; `StatusBadge` |
| `src/components/attendance/attendance-table.tsx` | Same table conventions |
| `src/components/payments/payments-table.tsx` | Same table conventions + skeleton loader |
| `src/components/payments/payments-summary.tsx` | Bebas Neue totals; gold for revenue total |

### Verification Checklist

- [ ] `npx tsc --noEmit` — zero errors
- [ ] Login page renders: full dark bg, centered card, Bebas Neue gym name, gold button
- [ ] Sidebar: permanently dark on both light and dark mode; gold pill on active item
- [ ] Clients table: `h-12` rows; uppercase muted headers; `StatusBadge` for status column
- [ ] Plan selector: 3 radio card tiles; gold border + pale tint on selected
- [ ] KPI cards: horizontal compact; Bebas Neue numbers; no icons
- [ ] Dark mode toggle: content area inverts; sidebar stays dark
- [ ] Gold appears in ONLY 5 places: primary button, sidebar active pill, plan selector selected, payment method selected, revenue KPI number
- [ ] Zero hardcoded color classes in components: `grep -r "bg-blue-500\|bg-green-500\|text-red-500\|text-blue-600" src/components/` returns empty
