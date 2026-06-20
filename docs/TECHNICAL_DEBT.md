# Technical Debt — Block23 Gym Management System

Issues are grouped by severity. Critical and High items block or corrupt functionality. Medium items affect maintainability and consistency. Low items are quality improvements.

---

## Critical — Broken or Data-Corrupting

### ATT-01: Attendance creates duplicate client records

**File:** `src/actions/attendance.ts` — `createWalkInAttendance()`

**Problem:** Every call creates a brand-new `Client` record regardless of whether the person has visited before. There is no lookup by name or phone before inserting. This produces duplicate client records for every returning walk-in visitor, and existing registered members have no check-in path at all.

**Impact:** Data integrity — the database accumulates phantom duplicate client records with each walk-in visit.

**Resolution:** Redesign the action to search for an existing client by name + phone before creating. Part of the Attendance Module Rebuild (Phase 2).

---

### ATT-02: Attendance.visitType is never set

**File:** `src/actions/attendance.ts`, `src/actions/client.ts`

**Problem:** The `Attendance` model has a `visitType VisitType` field (MEMBER | WALK_IN) that is defined in the schema but is never populated by any server action. All attendance records in the database have an undefined visit type.

**Impact:** Attendance cannot be categorized by visit type. Any reporting that distinguishes member visits from walk-in visits is impossible on existing data.

**Resolution:** Every server action that creates an `Attendance` record must explicitly set `visitType`. Part of the Attendance Module Rebuild (Phase 2).

---

### ATT-03: Walk-in fee hardcoded in attendance action

**File:** `src/actions/attendance.ts`

**Problem:** Walk-in payment is created with `amount: 100` hardcoded. The `GymSettings.defaultWalkInFee` field exists in the database with the correct value but is never read.

**Impact:** If the gym changes its walk-in fee, the code must be manually edited rather than updating a setting.

**Resolution:** Read from `GymSettings` in the action. Blocked until Phase 3 (Settings integration).

---

## High — Functional Gaps or Logic Errors

### MEM-01: Membership fee hardcoded in three dialog components

**Files:**
- `src/components/clients/create-client-dialog.tsx`
- `src/components/clients/renew-membership-dialog.tsx`
- `src/components/clients/convert-to-member-dialog.tsx`

**Problem:** The monthly membership fee (₱1200) and plan durations (30, 60, 90 days) are hardcoded in each dialog. There is a TODO comment in the code: "CONNECT TO GYM SETTINGS LATER." The `GymSettings.defaultMonthlyFee` database field exists but is unused.

**Impact:** Fee changes require editing three separate component files. Plan configuration is impossible without a code change.

**Resolution:** V2 schema adds `MembershipPlan` model (Phase 1). Dialog components will query live plan data (Phase 5). **Schema ready in Phase 1; UI connected in Phase 5. See `docs/adr/ADR-002.md`.**

---

### MEM-02: Dead code in membership action file

**File:** `src/actions/membership.ts`

**Problem:** Contains `createMembership()` which is incomplete — it is missing `durationInDays`, missing `amountPaid`, creates no payment record, and is not called from any component that matters. It was partially written and then superseded by the membership logic inside `src/actions/client.ts`.

**Impact:** Confusing to anyone reading the codebase. May be accidentally called in the future.

**Resolution:** Delete the file entirely. **Scheduled for Phase 1.**

---

### AUTH-01: Role-based access control is defined but never enforced

**Files:** `src/actions/client.ts`, `src/actions/attendance.ts`, route layouts

**Problem:** The `User.role` field (ADMIN | STAFF) is included in the JWT and session, but no server action, middleware, or UI element checks the role. Both roles currently have identical access to all functionality.

**Impact:** A STAFF user can delete clients, which is an ADMIN-only operation by design.

**Resolution:** Add role checks inside server actions for restricted operations. Add UI-level hiding for ADMIN-only controls. Part of Phase 6 (RBAC).

---

### PAY-01: Payment status is always PAID

**File:** All actions that create `Payment` records

**Problem:** Every payment creation call hardcodes `status: "PAID"`. The `PaymentStatus` enum includes PENDING, FAILED, and REFUNDED, but these values are unreachable in current code.

**Impact:** The payment model has no real-world utility beyond recording that a transaction occurred. No deferred payment, failed transaction, or refund workflow is possible.

**Resolution:** For membership payments (always upfront), PAID remains correct. For the Payments page, ADMIN edit of payment status will unlock the other values. Part of Phase 3 (Payments).

---

### PAY-02: No payment method field

**Schema:** `Payment` model

**Problem:** The `Payment` model has no field to distinguish cash from digital payments (GCash, PayMaya). Payment method is a confirmed requirement.

**Impact:** Revenue reports cannot separate cash from digital. Daily cash reconciliation is impossible.

**Resolution:** V2 schema adds `PaymentMethod` enum (CASH, GCASH, PAYMAYA) and `Payment.paymentMethod PaymentMethod @default(CASH)`. **Scheduled for Phase 1. See `docs/adr/ADR-004.md`.**

---

### SCHEMA-01: No soft delete on Client

**File:** `src/actions/client.ts` — `deleteClient()`

**Problem:** `deleteClient()` executes a hard cascade delete. All related attendance, payment, and membership records are permanently destroyed. The confirmed design decision is soft delete using a `deletedAt DateTime?` field.

**Impact:** Deleted clients are irrecoverable. Revenue data and attendance history for that client are permanently lost.

**Resolution:** V2 schema adds `Client.deletedAt DateTime?` and `User.deletedAt DateTime?`. `deleteClient()` updated to set `deletedAt = now()` and write an `AuditLog` entry. All active-client queries updated to filter `WHERE deletedAt IS NULL`. **Scheduled for Phase 1. See `docs/adr/ADR-001.md`.**

---

### SCHEMA-02: GymSettings is never read

**File:** `src/lib/prisma.ts`, all action files

**Problem:** The `GymSettings` singleton model was created in the schema and seeded with default values, but no server action or component ever reads from it. All configurable values (fees, walk-in window) are hardcoded in application code.

**Resolution:** Addressed across Phases 1–3 as each module is connected to GymSettings.

---

## Medium — Design Debt and Maintainability

### CODE-01: Membership form logic duplicated across three dialogs

**Files:**
- `src/components/clients/create-client-dialog.tsx` — 402 lines
- `src/components/clients/renew-membership-dialog.tsx` — 313 lines
- `src/components/clients/convert-to-member-dialog.tsx` — 253 lines

**Problem:** All three dialogs contain nearly identical logic for:
- Membership plan selection (useEffect for plan → duration mapping, ~45 lines each)
- Membership summary display (a card showing start date, end date, duration, amount, ~50 lines each)
- Date calculation (computing endDate from startDate + durationInDays)

**Resolution:** Extract into a shared `MembershipPlanSelector` component and a `useMembershipPlan` hook. Part of Phase 9 (UI improvements) or during Phase 2–3 when these dialogs are touched.

---

### CODE-02: ViewClientDialog has 80+ lines of commented-out code

**File:** `src/components/clients/view-client-dialog.tsx`

**Problem:** The bottom of the file contains approximately 80 lines of HTML/JSX that has been commented out and left in place.

**Resolution:** Delete the commented-out code. Part of Phase 9 (UI improvements).

---

### CODE-03: Hardcoded design colors in KPI cards

**File:** `src/components/clients/client-kpi-cards.tsx`

**Problem:** KPI card icons use hardcoded Tailwind color classes (`bg-blue-500/10`, `text-blue-600`, `bg-green-500/10`, `text-green-600`, `bg-orange-500/10`, `text-orange-600`, `bg-red-500/10`, `text-red-600`) instead of the project's CSS custom property token system. This bypasses the design system and will not respond correctly to theme changes.

**Resolution:** Replace with design token classes or CSS custom properties. Part of Phase 9 (UI improvements).

---

### CODE-04: Login page uses hardcoded error color

**File:** `src/app/(auth)/login/page.tsx`

**Problem:** Error message text uses `text-red-500` directly instead of `text-destructive`, which is the correct token-based class for error states.

**Resolution:** Replace `text-red-500` with `text-destructive`. Small fix, part of Phase 9.

---

### CODE-05: No form library — manual state management in all dialog components

**Files:** All dialog components under `src/components/clients/`

**Problem:** All forms use `useState` + `useTransition` with manual field-level error tracking. Only the client creation action has a Zod schema. Form components are oversized as a result.

**Impact:** Each form requires ~20–30 lines of boilerplate state initialization and error tracking. Validation logic is duplicated between `create-client-dialog.tsx` and `edit-client-dialog.tsx`.

**Resolution:** Introduce `react-hook-form` with Zod resolver for complex multi-field forms. Not needed for simple single-field forms. Address during Phase 9 or incrementally when dialogs are refactored.

---

### CODE-06: Decimal serialization in page component

**File:** `src/app/(dashboard)/clients/page.tsx`

**Problem:** The page component manually maps Prisma `Decimal` fields to JavaScript `Number` before passing data to client components. This serialization belongs in the server action or a dedicated DTO transformation.

**Resolution:** Move serialization into the relevant server actions or a `toPlainObject()` helper. Address during Phase 2 or 3 when actions are refactored.

---

### CODE-07: Magic number in client-status.ts

**File:** `src/lib/client-status.ts`

**Problem:** The number `7` (days for walk-in active window) is hardcoded directly in the status logic rather than being a named constant or a value read from `GymSettings`.

**Resolution:** V2 schema adds `GymSettings.walkInActiveDays Int @default(7)`. Phase 1 replaces the magic number with a named constant `WALK_IN_ACTIVE_DAYS`. Phase 5 connects the constant to the live `GymSettings` value. **Phase 1 constant extraction scheduled for Phase 1.**

---

### INFRA-01: NextAuth.js v5 is a beta release

**File:** `package.json`

**Problem:** `next-auth` version `5.0.0-beta.31` is in beta. The API may change between the current beta and the final stable release. Upgrading may require changes to `src/auth.ts`, `src/types/next-auth.d.ts`, and the API route handler.

**Resolution:** Monitor NextAuth v5 release status. Upgrade to the stable release when it ships. No immediate action required unless breaking changes are announced.

---

### INFRA-02: No error.tsx or loading.tsx files

**Problem:** No route segment has an `error.tsx` (error boundary) or `loading.tsx` (streaming placeholder). If a server component fetch fails or takes too long, the user sees a blank or frozen page.

**Resolution:** Add `error.tsx` and `loading.tsx` to the `(dashboard)` route group and key pages. Part of Phase 9.

---

## Low — Quality and Consistency

### UI-01: Spacing inconsistency

**Files:** `src/app/(dashboard)/dashboard/page.tsx` vs all other pages

**Problem:** The dashboard page wrapper uses `p-10`. Every other page uses `p-6`. Inconsistent padding creates a visual jump when navigating.

**Resolution:** Standardize all pages to `p-6`. Part of Phase 9.

---

### UI-02: ConvertToMemberDialog uses hardcoded sky color

**File:** `src/components/clients/convert-to-member-dialog.tsx`

**Problem:** A dropdown menu item uses `className="text-sky-500"` — a hardcoded color class outside the design token system.

**Resolution:** Replace with a token-based class. Part of Phase 9.

---

### UI-03: No accessibility audit performed

**Problem:** Icon-only buttons and interactive elements have not been audited for ARIA labels or keyboard navigation support. Some icon buttons may lack descriptive screen reader text.

**Resolution:** Perform an accessibility audit during Phase 9. Prioritize interactive controls (buttons, dropdowns, form fields).

---

## New Debt Identified in V2 Schema Review

### SCHEMA-03: No soft delete on User (staff accounts)

**Identified:** During V2 schema design session (2026-06-20)

**Problem:** User (staff) accounts currently have no soft delete mechanism. When staff management UI is built, deactivating an account via hard delete would break audit log references.

**Resolution:** V2 schema adds `User.deletedAt DateTime?` in Phase 1. Staff management UI is deferred, but the field is ready. NextAuth credential check must verify `deletedAt IS NULL`. **Scheduled for Phase 1.**

---

## Debt by Phase (Resolution Mapping)

| Debt Item | Resolved In | ADR |
|---|---|---|
| ATT-01 Duplicate clients | Phase 2 (Attendance Rebuild) | — |
| ATT-02 visitType never set | Phase 2 (Attendance Rebuild) | — |
| ATT-03 Walk-in fee hardcoded | Phase 3 (Payments / Settings) | — |
| MEM-01 Membership fee hardcoded | Phase 1 schema + Phase 5 UI | ADR-002 |
| MEM-02 Dead membership action | Phase 1 (delete the file) | — |
| AUTH-01 RBAC not enforced | Phase 6 (RBAC) | — |
| PAY-01 Status always PAID | Phase 3 (Payments) | — |
| PAY-02 No payment method field | Phase 1 (Schema Redesign) | ADR-004 |
| SCHEMA-01 Hard delete on Client | Phase 1 (Schema Redesign) | ADR-001 |
| SCHEMA-02 GymSettings unused | Phase 3–5 (incrementally) | — |
| SCHEMA-03 No User soft delete | Phase 1 (Schema Redesign) | ADR-001 |
| CODE-01 Form logic duplication | Phase 9 (UI Improvements) | — |
| CODE-02 Commented-out code | Phase 9 (UI Improvements) | — |
| CODE-03 Hardcoded KPI colors | Phase 9 (UI Improvements) | — |
| CODE-04 Login error color | Phase 9 (UI Improvements) | — |
| CODE-05 No form library | Phase 9 (UI Improvements) | — |
| CODE-06 Decimal serialization | Phase 2–3 (during action refactors) | — |
| CODE-07 Magic number (7 days) | Phase 1 constant + Phase 5 GymSettings | — |
| INFRA-01 NextAuth beta | Monitor — upgrade when stable | — |
| INFRA-02 No error/loading pages | Phase 9 (UI Improvements) | — |
| UI-01 Spacing inconsistency | Phase 9 (UI Improvements) | — |
| UI-02 Sky color in dialog | Phase 9 (UI Improvements) | — |
| UI-03 No accessibility audit | Phase 9 (UI Improvements) | — |
