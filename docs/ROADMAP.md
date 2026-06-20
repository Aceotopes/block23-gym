# Roadmap — Block23 Gym Management System

## Development Philosophy

- Feature-by-feature, incremental development — no large rewrites
- Schema changes are batched and migrated before new modules are built on top of them
- UI improvements are applied incrementally during feature work, not as separate sweeps
- Each phase produces working, shippable functionality before the next begins

---

## Current Status

| Module | Status |
|---|---|
| Authentication | Working (~95%) |
| Clients CRUD | Complete (~100%) |
| Membership lifecycle | Working (~90%) |
| Attendance | Broken (~40%) |
| Payments | Not implemented (0%) |
| Dashboard | Not implemented (~5%) |
| Settings | Not implemented (0%) |
| Role enforcement | Not implemented (0%) |
| CI/CD | Not implemented (0%) |

---

## Phase 1 — Schema Redesign

**Goal:** Implement all required database changes before any new module is built. Building on top of the current schema would require immediate refactoring once new features are introduced.

**Deliverables:**

Schema changes (all additive — safe against existing data):
- Add `MembershipPlan` model (name, durationInDays, price, isActive, sortOrder)
- Add `Membership.planId String?` (nullable FK → MembershipPlan, onDelete: Restrict)
- Add `Client.deletedAt DateTime?` for soft delete
- Add `User.deletedAt DateTime?` for soft delete (staff accounts — UI deferred)
- Add `PaymentMethod` enum (CASH, GCASH, PAYMAYA) and `Payment.paymentMethod PaymentMethod @default(CASH)`
- Add `Payment.notes String?`
- Add `AuditAction` enum (DELETE_CLIENT, EDIT_PAYMENT)
- Add `AuditLog` model (id, userId SetNull, action AuditAction, entityType, entityId, beforeState Json?, createdAt)
- Extend `GymSettings` with: gymName, address, contactEmail, contactPhone, walkInActiveDays

Code changes in Phase 1 (alongside schema):
- Update seed file: add default `MembershipPlan` records (1 Month ₱1200, 2 Months ₱2400, 3 Months ₱3600); update `GymSettings` seed for new fields
- Update `deleteClient()` to set `deletedAt = now()` and write `AuditLog` entry — remove cascade delete
- Update all active-client queries to filter `where: { deletedAt: null }`
- Update `src/lib/client-status.ts` to use `WALK_IN_ACTIVE_DAYS` constant; plan Phase 5 connection to `GymSettings`
- Delete `src/actions/membership.ts` (dead code)

**All V2 schema decisions are finalized. See `docs/DATABASE_SCHEMA.md` and `docs/adr/` for full specification.**

**Scope boundary:** No UI changes in this phase. Schema, migration, seed data, and the specific code changes listed above only.

---

## Phase 2 — Attendance Module Rebuild

**Goal:** Replace the broken attendance implementation with a correct, search-based check-in flow.

**Deliverables:**

- Redesign `createWalkInAttendance()` server action:
  - Accept name and phone as search parameters
  - Look up existing client by name + phone before creating a new record
  - If a match is found, reuse the existing client record
  - If no match is found, create a new client record
  - Always set `visitType` on the attendance record (MEMBER or WALK_IN)
  - Always create a payment record with a selected `paymentMethod`
- Add a member check-in server action:
  - Search existing clients by name or phone
  - Record attendance with `visitType = MEMBER`
  - Enforce: if membership is expired, record as `visitType = WALK_IN` and create a walk-in fee payment
- Rebuild `attendance-form.tsx`:
  - Search input (name or phone) with debounced lookup
  - Results dropdown to select the correct client
  - Payment method selection (CASH / GCASH / PAYMAYA)
  - Confirm check-in button
- Keep `timeOutAttendance()` as-is (it works correctly)
- Update `attendance-table.tsx` to display visit type and payment method
- Write `AuditLog` entries are not required for this phase

**Scope boundary:** Member check-in and walk-in check-in only. No attendance history reports in this phase.

---

## Phase 3 — Payments Page

**Goal:** Build the payments UI from zero. The database model and auto-creation logic already exist; only the UI and manual payment recording are missing.

**Deliverables:**

- Full transaction history table (paginated)
  - Columns: date, client name, type (MEMBERSHIP / WALK_IN), method (CASH / GCASH / PAYMAYA), amount, status
- Date-range filter (today, this week, this month, custom range)
- Daily cash summary card (total collected today, breakdown by type and method)
- Per-client payment history (accessible from the Clients page via the client actions menu)
- ADMIN-only: edit payment record (status and method only — amount is immutable)
- Write `AuditLog` entry on payment edit
- Connect membership and walk-in fee amounts to `GymSettings` (remove all hardcoded fee values)

**Scope boundary:** No CSV/PDF export in this phase — in-app views only.

---

## Phase 4 — Dashboard

**Goal:** Build the main landing page with operational KPIs and trend charts.

**Deliverables:**

- Add a charting library (Recharts recommended — compatible with shadcn/ui token system)
- KPI cards:
  - Today's attendance count (members + walk-ins)
  - Active member count
  - Walk-in count this month
  - Monthly revenue (current month vs. previous month)
- Expiring memberships list: members whose `endDate` is within the next 30 days, sorted by soonest
- Attendance trend chart: daily check-ins for the last 30 days (line or bar chart)
- Revenue trend chart: monthly revenue for the last 12 months (bar chart)
- Remove the duplicate logout button from the dashboard page (the navbar already has one)

**Scope boundary:** Read-only dashboard. No actions from this page.

---

## Phase 5 — Settings Page

**Goal:** Build the admin-only settings page so that hardcoded values are eliminated from application code.

**Deliverables:**

- Gym profile section: edit gymName, address, contactInfo (stored in GymSettings)
- Membership plan management: create, edit, deactivate plans (CRUD for `MembershipPlan` model)
- Fee configuration: edit defaultWalkInFee (stored in GymSettings)
- Walk-in active window: edit walkInActiveDays (stored in GymSettings)
- Connect all hardcoded fee values in server actions to GymSettings reads
- Connect membership plan selection in dialogs to live plan data from the database
- Gate the entire Settings page to ADMIN role only

---

## Phase 6 — Role Enforcement (RBAC)

**Goal:** Enforce the ADMIN vs. STAFF permission model that is defined but not implemented.

**Deliverables:**

- Server action guards: check `session.user.role` before executing restricted operations
  - Delete client → ADMIN only
  - Edit payment → ADMIN only
  - Access Settings routes → ADMIN only
- UI guards: hide ADMIN-only actions from STAFF users (delete button, edit payment button, settings nav item)
- Middleware or layout-level guard for the settings route group
- No staff account management UI in this phase — accounts managed via seed/DB

---

## Phase 7 — Reports & Exports

**Goal:** Add CSV and PDF export capability for the three confirmed report types.

**Deliverables:**

- Export: daily/monthly attendance log (client name, visit type, time in, time out)
- Export: payment/revenue report for a selected date range (client, type, method, amount)
- Export: member list with status (name, phone, membership status, expiry date)
- Format: CSV (required), PDF (optional / secondary priority)
- Accessible from the relevant page (Attendance, Payments, Clients)

---

## Phase 8 — CI/CD Pipeline

**Goal:** Automate pre-merge validation using GitHub Actions.

**Deliverables:**

- GitHub Actions workflow triggered on pull requests to `main`
- Steps: lint (ESLint), type-check (tsc --noEmit), build test (next build)
- Workflow fails and blocks merge if any step fails
- No auto-deployment — Vercel handles deployment automatically from GitHub

---

## Phase 9 — UI & Design System Improvements

**Goal:** Address accumulated design debt and establish consistent patterns across all pages.

**Planned improvements:**

- Replace all hardcoded color classes (e.g., `bg-blue-500/10`) with design token classes
- Fix `text-red-500` in login page → `text-destructive`
- Extract membership plan selection and membership summary into shared reusable components
- Standardize spacing: all pages to use `p-6` wrapper (remove the `p-10` anomaly)
- Introduce `react-hook-form` for complex multi-field forms (reduce dialog component sizes)
- Remove ~80 lines of commented-out code in `view-client-dialog.tsx`
- Add `error.tsx` and `loading.tsx` files to key route segments
- Accessibility pass: icon aria-labels, keyboard navigation review

---

## Future Phases (Post-MVP)

These phases are confirmed in intent but not yet planned in detail.

### Loyalty and Rewards System
- Points earned per check-in and per membership purchase
- Points balance displayed on client profile
- Points redemption (discount on membership or walk-in fee)
- `LoyaltyTransaction` model required

### Client-Facing Portal or Mobile App
- Clients log in separately from staff
- View own membership status and expiry date
- View own attendance history
- View own payment history
- Requires a REST or tRPC API layer — Next.js Server Actions are not usable by external clients
- Requires a `ClientPortalUser` authentication model separate from staff `User` accounts

### Audit Log UI
- Admin-accessible view of all logged actions (client deletions, payment edits)
- Filter by date, action type, or staff member

---

## Deployment Milestones

| Milestone | Target Environment |
|---|---|
| Phase 1–3 complete | Vercel staging |
| Phase 1–6 complete | Vercel production |
| Phase 7–8 complete | Vercel production + GitHub CI |
| Future phases | Evaluated per milestone |
