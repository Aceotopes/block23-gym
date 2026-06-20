# Technical Debt — Block23 Gym Management System

Issues are grouped by severity. Critical and High items block or corrupt functionality. Medium items affect maintainability and consistency. Low items are quality improvements.

Resolved items are collected in the **Resolved** section at the bottom of this document.

---

## High — Functional Gaps or Logic Errors

### MEM-01: Membership fee hardcoded in three dialog components

**Files:**
- `src/components/clients/create-client-dialog.tsx`
- `src/components/clients/renew-membership-dialog.tsx`
- `src/components/clients/convert-to-member-dialog.tsx`

**Problem:** The monthly membership fee (₱1200) and plan durations (30, 60, 90 days) are hardcoded in each dialog. There is a TODO comment in the code: "CONNECT TO GYM SETTINGS LATER." The `MembershipPlan` database records exist (seeded) but are not queried by any of these components.

**Impact:** Fee changes require editing three separate component files. Plan configuration is impossible without a code change. See also CODE-08 below.

**Resolution:** Phase 5 — dialog components will query live `MembershipPlan` data; plan selector will be replaced with radio card component (specified in `docs/DESIGN_SYSTEM.md`). **Schema ready. UI connection deferred to Phase 5. See `docs/adr/ADR-002.md`.**

---

### CODE-08: `planId` not passed in membership creation — all new memberships have `planId = null`

**Files:**
- `src/actions/client.ts` — `createMember()`, `convertToMember()`, `renewMembership()`

**Problem:** The V2 schema added `Membership.planId String?` and the seed creates three `MembershipPlan` records. `docs/CLAUDE.md` states: "Membership.planId: Nullable in schema (for pre-migration records), but server actions must require it for all new memberships." However, none of the three membership server actions pass a `planId` to `tx.membership.create()`. Every membership created since Phase 1 has `planId = null`.

**Impact:** The `MembershipPlan` table has seeded data but is completely disconnected from membership creation. Plan-based reporting (e.g., "how many 3-month plans sold this month") is impossible on current data. The business rule stated in CLAUDE.md, DATABASE_SCHEMA.md, and ADR-002 is not enforced.

**Resolution:** Phase 5 — the Settings UI will build the plan picker; the server actions will accept and require `planId`; existing null records will be documented as pre-Phase 5 data. **Blocked on Phase 5. See `docs/adr/ADR-002.md`.**

---

### AUTH-01: Role-based access control is defined but incompletely enforced

**Files:** `src/actions/client.ts`, route layouts, middleware (does not exist yet)

**Problem:** The `User.role` field (ADMIN | STAFF) is in the JWT. `editPayment` correctly enforces ADMIN role. However, `deleteClient()` performs a soft delete and writes an AuditLog without checking `session.user.role` — a STAFF user can delete clients. No middleware or layout guard exists for the Settings route. UI hiding of ADMIN-only controls is not implemented.

**Impact:** A STAFF user can delete clients, which is an ADMIN-only operation by design.

**Resolution:** Phase 6 — add role checks to `deleteClient()` and any other restricted actions; add middleware/layout guard for `/settings`; hide ADMIN-only UI controls from STAFF users.

---

### PAY-01: New payment status is always PAID

**Files:** All actions that create `Payment` records

**Problem:** Every payment creation call hardcodes `status: "PAID"`. For membership payments (always upfront) this is by design. For walk-in payments this is also acceptable as-is. However, the PENDING, FAILED, and REFUNDED statuses are only reachable via ADMIN edit after the fact.

**Current state (updated Phase 3):** ADMIN can now edit payment status and method via `editPayment()`. New payments still default to PAID on creation, which is the correct behavior for this gym's upfront payment model. The remaining gap is that no "failed transaction" or "pending" recording path exists in the UI.

**Resolution:** Largely acceptable. If deferred payment scenarios arise in the future, a UI path for creating PENDING payments can be added. No immediate action required beyond the Phase 3 ADMIN edit capability.

---

### SCHEMA-02: GymSettings partially integrated

**Files:** `src/actions/attendance.ts`, `src/components/attendance/attendance-form.tsx`, various dialog components

**Current state (updated Phase 3):** `GymSettings.defaultWalkInFee` is now read in `checkIn()` and displayed in `AttendanceForm`. The `attendance/page.tsx` fetches this value and passes it as a prop — the walk-in fee is live from the database.

**Remaining gaps:**
- `GymSettings.defaultMonthlyFee` — not read anywhere; membership dialogs still use hardcoded ₱1200
- `GymSettings.walkInActiveDays` — not read; `client-status.ts` uses the named constant `WALK_IN_ACTIVE_DAYS = 7`
- `GymSettings.gymName`, `address`, `contactEmail`, `contactPhone` — not used anywhere yet

**Resolution:** Phase 5 — Settings page will expose all GymSettings fields for editing and connect membership dialogs to live fee/plan data.

---

## Medium — Design Debt and Maintainability

### CODE-01: Membership form logic duplicated across three dialogs

**Files:**
- `src/components/clients/create-client-dialog.tsx` — ~426 lines
- `src/components/clients/renew-membership-dialog.tsx` — ~337 lines
- `src/components/clients/convert-to-member-dialog.tsx` — ~276 lines

**Problem:** All three dialogs contain nearly identical logic for membership plan selection, summary display, date calculation, and payment method selection. The `paymentMethod` state and selector pattern was added to all three in Phase 3, adding another layer of duplication.

**Resolution:** Phase 5/9 — extract into a shared `PlanSelector` component (specified in `docs/DESIGN_SYSTEM.md`) and a `useMembershipPlan` hook. Will be addressed when Phase 5 connects dialogs to live plan data.

---

### CODE-02: ViewClientDialog has 80+ lines of commented-out code

**File:** `src/components/clients/view-client-dialog.tsx`

**Problem:** The bottom of the file contains approximately 80 lines of HTML/JSX that has been commented out and left in place.

**Resolution:** Delete the commented-out code. Part of Phase 9.

---

### CODE-03: Hardcoded design colors in KPI cards

**File:** `src/components/clients/client-kpi-cards.tsx`

**Problem:** KPI card icons use hardcoded Tailwind color classes (`bg-blue-500/10`, `text-blue-600`, `bg-green-500/10`, etc.) instead of the project's CSS custom property token system. This bypasses the design system.

**Resolution:** Replace with semantic status token classes as specified in `docs/DESIGN_SYSTEM.md`. Part of Phase 9.

---

### CODE-04: Login page uses hardcoded error color

**File:** `src/app/(auth)/login/page.tsx`

**Problem:** Error message text uses `text-red-500` directly instead of a token-based class.

**Resolution:** Replace with `text-[--status-danger-text]` as specified in `docs/DESIGN_SYSTEM.md`. Part of Phase 9.

---

### CODE-05: No form library — manual state management in all dialog components

**Files:** All dialog components under `src/components/clients/`

**Problem:** All forms use `useState` with manual field-level error tracking. Form components are oversized as a result (~300–400 lines each).

**Resolution:** Consider `react-hook-form` with Zod resolver for complex multi-field forms. Address during Phase 9 or incrementally when dialogs are refactored for Phase 5.

---

### CODE-06: Decimal serialization in page component

**File:** `src/app/(dashboard)/clients/page.tsx`

**Problem:** The page component manually maps Prisma `Decimal` fields to JavaScript `Number` before passing data to client components. This serialization belongs in the server action or a dedicated DTO layer.

**Current state:** The same pattern was applied correctly in `src/actions/payment.ts` (`getClientPayments` serializes `amount: Number(p.amount)`) and in `src/app/(dashboard)/payments/page.tsx`. The clients page still does it inline.

**Resolution:** Move serialization into the relevant server actions. Address during Phase 5 when client actions are refactored for planId.

---

### CODE-07: Magic number in client-status.ts — partially resolved

**File:** `src/lib/client-status.ts`

**Current state (updated Phase 1):** The number `7` has been replaced with a named constant `WALK_IN_ACTIVE_DAYS = 7` at the top of the file, with a comment: `// Phase 5: replace with live GymSettings.walkInActiveDays value`. The constant is correct and the intent is documented.

**Remaining:** The constant is still hardcoded — it is not read from `GymSettings.walkInActiveDays`. Phase 5 completes the connection.

**Resolution:** Phase 5 — read `walkInActiveDays` from GymSettings singleton and pass it to the status check.

---

### INFRA-01: NextAuth.js v5 is a beta release

**File:** `package.json`

**Problem:** `next-auth` version `5.0.0-beta.31` is in beta. The API may change before the stable release.

**Resolution:** Monitor NextAuth v5 release status. Upgrade to stable when it ships. No immediate action required.

---

### INFRA-02: No error.tsx or loading.tsx files

**Problem:** No route segment has an `error.tsx` (error boundary) or `loading.tsx` (streaming placeholder).

**Resolution:** Add to the `(dashboard)` route group and key pages. Part of Phase 9.

---

## Low — Quality and Consistency

### UI-01: Spacing inconsistency

**Files:** `src/app/(dashboard)/dashboard/page.tsx` vs all other pages

**Problem:** The dashboard page wrapper uses `p-10`. Every other page uses `p-6`.

**Resolution:** Standardize all pages to `p-6`. Part of Phase 9.

---

### UI-02: ConvertToMemberDialog uses hardcoded sky color

**File:** `src/components/clients/convert-to-member-dialog.tsx`

**Problem:** A dropdown menu item uses `className="text-sky-500"` — a hardcoded color class outside the design token system.

**Resolution:** Replace with a token-based class. Part of Phase 9.

---

### UI-03: No accessibility audit performed

**Problem:** Icon-only buttons and interactive elements have not been audited for ARIA labels or keyboard navigation support.

**Resolution:** Accessibility audit during Phase 9. Per `docs/DESIGN_SYSTEM.md`, all icon-only buttons must have Radix Tooltip.

---

### UI-04: Root layout has placeholder metadata

**File:** `src/app/layout.tsx`

**Problem:** `metadata.title = "Create Next App"` and `metadata.description = "Generated by create next app"` — scaffold defaults that appear in the browser tab and search/social previews.

**Resolution:** Update to `title: "Block23 Gym"` and an appropriate description. Small fix, can be done any time.

---

## Resolved

Items in this section were identified as debt and subsequently fixed. Kept for historical reference.

---

### ~~ATT-01~~: Attendance creates duplicate client records — **RESOLVED Phase 2**

`checkIn()` in `src/actions/attendance.ts` now looks up an existing client by `firstName + lastName` before creating a new record. `createWalkInClient()` also deduplicates by name. No duplicate client records are created for returning visitors.

---

### ~~ATT-02~~: Attendance.visitType is never set — **RESOLVED Phase 2**

`checkIn()` now explicitly sets `visitType = isActiveMember ? "MEMBER" : "WALK_IN"` on every `tx.attendance.create()` call. The active membership check uses `membership.status === "ACTIVE" && membership.endDate > now`.

---

### ~~ATT-03~~: Walk-in fee hardcoded in attendance action — **RESOLVED Phase 3**

`checkIn()` reads `GymSettings.defaultWalkInFee` before opening the transaction. `const WALK_IN_FEE = 100` constant has been removed. The attendance page fetches the fee from GymSettings and passes it to `AttendanceForm` as a prop.

---

### ~~MEM-02~~: Dead code in membership action file — **RESOLVED Phase 1**

`src/actions/membership.ts` has been deleted. The incomplete `createMembership()` function no longer exists.

---

### ~~PAY-02~~: No payment method field — **RESOLVED Phase 1 + Phase 3**

`PaymentMethod` enum (CASH, GCASH, PAYMAYA) added to schema in Phase 1. `Payment.paymentMethod` column added with `@default(CASH)`. All three membership creation actions and the walk-in check-in action now accept and store `paymentMethod`. UI selectors added to all three membership dialogs in Phase 3.

---

### ~~SCHEMA-01~~: Hard delete on Client — **RESOLVED Phase 1**

`deleteClient()` in `src/actions/client.ts` now sets `deletedAt = new Date()` (soft delete) and writes an `AuditLog` entry with `action: "DELETE_CLIENT"` and `beforeState` in the same transaction. All active-client queries filter `where: { deletedAt: null }`.

---

### ~~SCHEMA-03~~: No soft delete on User — **RESOLVED Phase 1**

`User.deletedAt DateTime?` added to schema. The NextAuth credentials provider in `src/auth.ts` filters `deletedAt: null` when looking up the user during login.

---

## Debt by Phase (Resolution Mapping)

| Debt Item | Status | Resolved In | ADR |
|---|---|---|---|
| ATT-01 Duplicate clients | ✅ Resolved | Phase 2 | — |
| ATT-02 visitType never set | ✅ Resolved | Phase 2 | — |
| ATT-03 Walk-in fee hardcoded | ✅ Resolved | Phase 3 | — |
| MEM-01 Membership fee hardcoded | 🔴 Open | Phase 5 | ADR-002 |
| MEM-02 Dead membership action | ✅ Resolved | Phase 1 | — |
| AUTH-01 RBAC incomplete | 🔴 Open | Phase 6 | — |
| PAY-01 Status always PAID | 🟡 Acceptable | Phase 3 (partial) | — |
| PAY-02 No payment method field | ✅ Resolved | Phase 1 + Phase 3 | ADR-004 |
| SCHEMA-01 Hard delete on Client | ✅ Resolved | Phase 1 | ADR-001 |
| SCHEMA-02 GymSettings unused | 🟡 Partial | Phase 5 (remaining) | — |
| SCHEMA-03 No User soft delete | ✅ Resolved | Phase 1 | ADR-001 |
| CODE-01 Form logic duplication | 🔴 Open | Phase 5/9 | — |
| CODE-02 Commented-out code | 🔴 Open | Phase 9 | — |
| CODE-03 Hardcoded KPI colors | 🔴 Open | Phase 9 | — |
| CODE-04 Login error color | 🔴 Open | Phase 9 | — |
| CODE-05 No form library | 🔴 Open | Phase 9 | — |
| CODE-06 Decimal serialization | 🔴 Open | Phase 5 | — |
| CODE-07 Magic number (7 days) | 🟡 Partial | Phase 5 (remaining) | — |
| CODE-08 planId not passed | 🔴 Open | Phase 5 | ADR-002 |
| INFRA-01 NextAuth beta | 🟡 Monitor | When stable | — |
| INFRA-02 No error/loading pages | 🔴 Open | Phase 9 | — |
| UI-01 Spacing inconsistency | 🔴 Open | Phase 9 | — |
| UI-02 Sky color in dialog | 🔴 Open | Phase 9 | — |
| UI-03 No accessibility audit | 🔴 Open | Phase 9 | — |
| UI-04 Layout metadata placeholder | 🔴 Open | Any time | — |
