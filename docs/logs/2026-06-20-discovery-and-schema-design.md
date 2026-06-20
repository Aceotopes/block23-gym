# Development Log
## Block23 Gym Management System

---

| Field | Value |
|---|---|
| **Date** | 2026-06-20 |
| **Session Type** | Discovery, Documentation, and Schema Design |
| **Developer** | Aceotopes |
| **Branch** | main |
| **Commit Hash (before session)** | f7d98ce |
| **Status** | Pre-implementation — documentation only, no application code modified |
| **Next Action** | Phase 1: Write and apply V2 Prisma migration |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Session Goals](#2-session-goals)
3. [Codebase Discovery Findings](#3-codebase-discovery-findings)
   - 3.1 Technology Stack
   - 3.2 Project Architecture
   - 3.3 Feature Status Assessment
   - 3.4 Database Schema Analysis (V1)
   - 3.5 Frontend and UI Analysis
   - 3.6 Code Quality Findings
4. [Business Requirements Confirmed](#4-business-requirements-confirmed)
5. [Documentation Created](#5-documentation-created)
6. [V2 Schema Design](#6-v2-schema-design)
   - 6.1 Schema Changeset
   - 6.2 All Design Decisions
   - 6.3 Migration Risk Assessment
7. [Architecture Decision Records](#7-architecture-decision-records)
8. [Technical Debt Register](#8-technical-debt-register)
9. [Files Created or Modified](#9-files-created-or-modified)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Next Steps — Phase 1](#11-next-steps--phase-1)

---

## 1. Executive Summary

This session was a full onboarding and architecture review of the Block23 Gym Management System before any new development begins. The codebase was audited from scratch, all business requirements were confirmed through a structured Q&A session (49 questions), and a complete documentation suite was written under `docs/`.

The V2 database schema was designed through a collaborative decision-making process. Twelve schema design decisions were explicitly confirmed, four Architecture Decision Records were written, and all schema changes for Phase 1 are now fully specified and ready for implementation.

**No application code and no Prisma schema file was modified during this session.** The `docs/` directory is the only artifact of this session.

---

## 2. Session Goals

| Goal | Outcome |
|---|---|
| Fully understand the current codebase before making any changes | Completed |
| Confirm all outstanding business requirements | Completed — 49 questions answered |
| Establish a documentation-driven workflow | Completed — docs/ is now source of truth |
| Design the V2 database schema | Completed — all decisions finalized |
| Document all architectural decisions with reasoning | Completed — 4 ADRs written |
| Identify and catalogue all technical debt | Completed — 22 items tracked |
| Define the implementation roadmap | Completed — 9 phases planned |

---

## 3. Codebase Discovery Findings

### 3.1 Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.6 | App Router |
| Language | TypeScript | ^5 | Strict mode enabled |
| UI Library | React | 19.2.4 | |
| Database | PostgreSQL via Neon | — | ap-southeast-1 AWS region |
| ORM | Prisma | ^7.8.0 | Runtime adapter (@prisma/adapter-pg) |
| Authentication | NextAuth.js | 5.0.0-beta.31 | **Beta — not yet stable** |
| Auth Adapter | @auth/prisma-adapter | ^2.11.2 | |
| Password Hashing | bcryptjs | ^3.0.3 | |
| UI Components | shadcn/ui | ^4.7.0 | Built on Radix UI |
| Radix UI Primitives | @radix-ui | ^1.4.3 | |
| Styling | Tailwind CSS | ^4 | CSS-first — no tailwind.config.js |
| Validation | Zod | ^4.4.3 | Partially used |
| Date Utilities | date-fns | ^4.4.0 | |
| Icons | Lucide React | ^1.16.0 | |
| Notifications | Sonner | ^2.0.7 | Toast notifications |
| Theme | next-themes | ^0.4.6 | Dark/light mode |
| Animations | tw-animate-css | ^1.4.0 | |
| Debouncing | use-debounce | ^10.1.1 | |
| Component Variants | class-variance-authority | ^0.7.1 | |
| Class Utilities | clsx + tailwind-merge | ^2.1.1 / ^3.6.0 | Via cn() helper |

**Key observation:** NextAuth.js v5 is currently in beta (5.0.0-beta.31). The API may change before stable release. No immediate action required but this should be monitored.

---

### 3.2 Project Architecture

**Routing:** Next.js App Router with two route groups:
- `(auth)` — unauthenticated routes (login page only)
- `(dashboard)` — all protected routes, guarded by session check in `layout.tsx`

**Data layer:** All mutations use Next.js Server Actions exclusively. No REST API endpoints exist beyond the NextAuth authentication handler at `src/app/api/auth/[...nextauth]/route.ts`. This is appropriate for a staff-operated internal tool but will require an API layer when a client-facing portal or mobile app is built.

**Auth flow:** JWT sessions via NextAuth Credentials provider. Email and bcrypt-hashed password. Session includes user `id` and `role`. Auth guard is in `src/app/(dashboard)/layout.tsx` — redirects unauthenticated users to `/login`.

**Database access:** Prisma 7 singleton with global cache in `src/lib/prisma.ts` using `PrismaPg` runtime adapter.

**Cache invalidation:** `revalidatePath()` called after every mutation in server actions.

**Project directory structure:**

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── attendance/page.tsx     ← Broken
│   │   ├── clients/page.tsx        ← Complete
│   │   ├── dashboard/page.tsx      ← Stub
│   │   ├── payments/page.tsx       ← Stub
│   │   ├── settings/page.tsx       ← Stub
│   │   └── layout.tsx              ← Auth gate
│   ├── api/auth/[...nextauth]/route.ts
│   ├── globals.css
│   └── layout.tsx
├── actions/
│   ├── client.ts                   ← Primary, complete
│   ├── attendance.ts               ← Broken
│   └── membership.ts               ← Dead code
├── components/
│   ├── attendance/                 ← 3 components
│   ├── clients/                    ← 11 components
│   ├── dashboard/                  ← navbar, sidebar
│   └── ui/                         ← 15 shadcn/ui components
├── constants/navigation.ts
├── lib/
│   ├── client-status.ts
│   ├── format-name.ts
│   ├── prisma.ts
│   ├── utils.ts
│   └── validations/client.ts
└── types/next-auth.d.ts

prisma/
├── schema.prisma
└── seed.ts
```

---

### 3.3 Feature Status Assessment

| Feature | Status | Completeness | Notes |
|---|---|---|---|
| Authentication | Working | ~95% | Roles defined but RBAC not enforced anywhere |
| Clients CRUD | Complete | ~100% | Search, filter, create, edit — hard delete still active |
| Membership lifecycle | Working | ~90% | Create, convert, renew — fees hardcoded, orphan action file |
| Attendance check-in | **Broken** | ~40% | Creates duplicate clients; members cannot check in; visitType never set |
| Payments UI | Not started | 0% | Page is `<div>Payments Page</div>` |
| Dashboard | Not started | ~5% | Page shows only a logout button |
| Settings | Not started | 0% | Page is `<div>Settings Page</div>` |
| GymSettings (DB) | Unused | 0% | Model exists and is seeded — never read anywhere |
| Role enforcement (RBAC) | Not started | 0% | Roles exist in JWT but not checked anywhere |
| Audit logging | Not started | 0% | No model, no writes |
| CSV/PDF exports | Not started | 0% | Not yet implemented |

---

### 3.4 Database Schema Analysis (V1)

**9 models total:**

| Model | Purpose | Issues |
|---|---|---|
| User | Staff authentication | No soft delete |
| Account | NextAuth OAuth internals | Unchanged |
| Session | NextAuth session tracking | Unchanged |
| VerificationToken | NextAuth email verification | Unchanged |
| Client | All gym visitors (members + walk-ins) | No soft delete; type derived at runtime |
| Membership | Subscription entitlement | No plan reference; duration hardcoded |
| Attendance | Check-in/out records | `visitType` field defined but never set |
| Payment | Transaction records | No `paymentMethod`; always PAID status |
| GymSettings | Configuration singleton | Exists but is never read |

**5 enums:**

| Enum | Values | Issues |
|---|---|---|
| Role | ADMIN, STAFF | Defined but not enforced |
| MembershipStatus | ACTIVE, EXPIRED, CANCELLED | Used correctly |
| VisitType | MEMBER, WALK_IN | Defined but never written to Attendance |
| PaymentType | MEMBERSHIP, WALK_IN | Used correctly |
| PaymentStatus | PAID, PENDING, FAILED, REFUNDED | PENDING, FAILED, REFUNDED unreachable |

**10 known schema limitations identified:**

| # | Issue | Severity |
|---|---|---|
| 1 | visitType never populated on Attendance | Critical |
| 2 | No paymentMethod field on Payment | Critical |
| 3 | GymSettings exists but never read | High |
| 4 | Payment status always PAID | High |
| 5 | No plan name on Membership — only durationInDays | High |
| 6 | No soft delete on Client | High |
| 7 | Client type derived at runtime (not stored) | Medium |
| 8 | No AuditLog model | Medium |
| 9 | GymSettings has no gym profile fields | Medium |
| 10 | No walkInActiveDays config | Low |

---

### 3.5 Frontend and UI Analysis

**Component library:** shadcn/ui (15 components in `src/components/ui/`) built on Radix UI headless primitives.

**Styling:** Tailwind CSS v4 CSS-first. Design tokens defined as CSS custom properties using oklch() color space in `globals.css`. Both light and dark mode supported via CSS variable switching.

**Typography:** Geist Sans (heading and body) and Geist Mono (code/data). Loaded via `next/font/google`. Standard Tailwind type scale — no custom scale defined.

**Layout:** Sidebar (`w-58`, hidden on mobile) + fixed navbar header (`h-16`) + main content area (`flex-1 p-6`). Sidebar uses `usePathname()` for active link detection.

**Design system issues found:**

| Issue | Location | Impact |
|---|---|---|
| Hardcoded colors in KPI cards | `client-kpi-cards.tsx` | Breaks dark mode theming |
| `text-red-500` on login error | `login/page.tsx` | Bypasses destructive token |
| `text-sky-500` in convert dialog | `convert-to-member-dialog.tsx` | Outside token system |
| `p-10` wrapper on dashboard page | `dashboard/page.tsx` | Inconsistent with all other pages (p-6) |

**Form patterns:** No form library installed. All forms use `useState` + `useTransition` with manual field-level error tracking. Only client creation has a Zod validation schema. This leads to large, verbose dialog components.

**Large components identified:**

| Component | Lines | Issues |
|---|---|---|
| `create-client-dialog.tsx` | 402 | Mixes UI, business logic, calculations, validation |
| `view-client-dialog.tsx` | 303 | ~80 lines of commented-out code |
| `renew-membership-dialog.tsx` | 313 | Duplicates plan logic from create-client-dialog |
| `convert-to-member-dialog.tsx` | 253 | Duplicates plan logic from renew-membership-dialog |

**Duplicate logic identified:**

- Membership plan selection (useEffect + plan→duration mapping): duplicated in 3 dialogs (~45 lines × 3)
- Membership summary display card: duplicated in 3 dialogs (~50 lines × 3)
- Client name validation: duplicated in create and edit dialogs

---

### 3.6 Code Quality Findings

**22 technical debt items identified across 4 severity levels:**

- **Critical (2):** Duplicate client creation on attendance, visitType never set
- **High (6):** Hardcoded fees, dead code, RBAC not enforced, PAID-only status, no payment method, hard delete
- **Medium (9):** Form logic duplication, commented code, hardcoded colors, no form library, Decimal serialization, magic number, NextAuth beta, no error/loading pages
- **Low (3):** Spacing inconsistency, hardcoded sky color, no accessibility audit

Full register is in `docs/TECHNICAL_DEBT.md`.

---

## 4. Business Requirements Confirmed

All 49 outstanding business and product decisions were answered by the developer through a structured Q&A session. Answers are grouped by category below.

### Attendance

| Question | Answer |
|---|---|
| Member check-in flow | Name/phone search — staff searches and selects existing client |
| Walk-in identity | Recognized by name + phone — history tracked, no duplicate records |
| TimeOut required? | Optional — staff checks out manually, no auto-timeout |
| Expired member check-in | Allowed — recorded as WALK_IN visitType with walk-in fee charged |
| Grace period after expiry | None — expires exactly on endDate |

### Clients

| Question | Answer |
|---|---|
| Staff client visibility | All staff can see all clients |
| Who can delete clients | ADMIN only |
| Delete behavior | Soft delete — preserve all history (deletedAt) |

### Membership

| Question | Answer |
|---|---|
| Plan configuration | Fully configurable — admin creates/edits/archives plans |
| Multiple active memberships | No — one at a time |
| Payment timing | Always upfront — no PENDING status for memberships |
| Expiry alerts | In-app only — shown on Dashboard as expiring-soon list |

### Payments

| Question | Answer |
|---|---|
| Payment methods | Cash and digital (GCash, PayMaya) |
| Method confirmation | Staff explicitly selects method + confirms at point of collection |
| Payment editability | ADMIN can edit status and method — amount is immutable |
| Receipts | Not needed |
| Payments page content | Full history, date-range filter, daily cash summary, per-client history |

### Dashboard

| Question | Answer |
|---|---|
| KPIs | Today's attendance, active members, expiring memberships, monthly revenue |
| Charts | Yes — attendance and revenue trend charts (needs Recharts or similar) |

### Reports

| Question | Answer |
|---|---|
| Export formats needed | CSV and PDF |
| Export types | Attendance log, payment/revenue report, member list with status |

### Roles

| Question | Answer |
|---|---|
| STAFF restrictions | Staff cannot: delete clients, edit payments, configure settings, manage accounts |
| ADMIN-only operations | Delete clients, edit payments, configure settings, manage staff accounts |
| Staff account management | 1–2 people total — managed via DB/seed for now, UI deferred |

### Settings Page

| Question | Answer |
|---|---|
| Settings page scope | Gym profile, membership plan management, fee config, walk-in active window |
| Staff account management UI | Not needed yet |

### Data and Security

| Question | Answer |
|---|---|
| Data privacy compliance | Not a current concern (no formal DPA requirement) |
| Audit logging | Partial — log client deletes and payment changes only |
| Login security | Rate-limit failed attempts, no full lockout |
| Soft delete scope | Client and User |

### Infrastructure

| Question | Answer |
|---|---|
| Deployment | Vercel + Neon PostgreSQL |
| Staging | Separate Vercel deployment + Neon staging DB |
| Future test environment | Self-hosted mini PC |
| CI/CD | GitHub Actions — lint, type-check, build test on every PR |
| Expected scale | Under 500 clients in year 1 |

### Future Features

| Question | Answer |
|---|---|
| Resale model | Separate deployment per gym — no multi-tenancy in schema |
| Future modules | Client-facing portal/mobile app, loyalty/rewards system |
| Client portal impact | Will require REST or tRPC API layer — Server Actions not usable by external clients |

---

## 5. Documentation Created

All files are under `docs/` in the project root.

### Core Documentation

**`docs/CLAUDE.md`**
AI assistant context file. Serves as onboarding reference for every future Claude Code session. Contains: project summary, tech stack quick reference, architecture patterns, directory map, feature status table, critical known issues with phase references, key conventions (soft delete pattern, MembershipPlan query rules, GymSettings singleton access, AuditLog rules), and all confirmed design decisions.

**`docs/PROJECT_OVERVIEW.md`**
Business-level project overview. Contains: what the system is, who uses it, all core features with current status and intended behavior, full tech stack table, architecture overview, feature status matrix, deployment targets, resale model, and future roadmap summary.

**`docs/DATABASE_SCHEMA.md`**
Authoritative V2 schema specification. Contains: all enums (existing and new), all models with V2 field-by-field tables and change markers, relationship diagram, V2 migration summary with risk assessment for each change, seed data specification, and future post-MVP model designs.

**`docs/ROADMAP.md`**
9-phase implementation plan. Each phase has a goal statement, full deliverables list, and a scope boundary. Future phases (client portal, loyalty system) documented separately.

**`docs/TECHNICAL_DEBT.md`**
22 tracked technical debt items organized by severity (Critical, High, Medium, Low). Each item includes: file reference, problem description, business impact, and resolution plan with phase reference. A summary table maps every item to its resolution phase with ADR references.

### Architecture Decision Records

**`docs/adr/ADR-001.md` — Soft Delete on Client and User**
Documents the decision to add `deletedAt DateTime?` to both Client and User. Explains: why soft delete over hard delete, why no cascade to related records, why status enum was rejected, and the scope of query changes required.

**`docs/adr/ADR-002.md` — Configurable MembershipPlan Model**
Documents the new MembershipPlan model and `Membership.planId` FK. Explains: why a DB table over a constants file, why nullable FK for backward compatibility, why durationInDays is kept alongside planId, and why Restrict was chosen over cascade-delete or SetNull on plan deletion.

**`docs/adr/ADR-003.md` — Partial Audit Log with AuditAction Enum**
Documents the AuditLog model design. Explains: why an enum over a free-text string, why the field is named `beforeState` instead of `metadata`, why audit records are immutable, and why SetNull was chosen on user delete over Restrict or Cascade.

**`docs/adr/ADR-004.md` — Payment.paymentMethod Required with CASH Default**
Documents the decision to make `paymentMethod` required with `@default(CASH)` applied to all pre-migration rows. Explains: the data assumption made about historical rows, why nullable was rejected, and why a free-text field and a lookup table were both rejected.

---

## 6. V2 Schema Design

### 6.1 Schema Changeset

**New Enums**

| Enum | Values |
|---|---|
| `PaymentMethod` | CASH, GCASH, PAYMAYA |
| `AuditAction` | DELETE_CLIENT, EDIT_PAYMENT |

**New Model: `MembershipPlan`**

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| name | String | e.g., "1 Month", "3 Months" |
| durationInDays | Int | e.g., 30, 60, 90 |
| price | Decimal(10,2) | ₱0.00 valid (free/promotional plans) |
| isActive | Boolean | Default: true. False = archived |
| sortOrder | Int | Default: 0. Controls display order |
| createdAt | DateTime | Default: now() |
| updatedAt | DateTime | Auto-updated |

Referential action: `Membership.planId onDelete: Restrict` — plan cannot be deleted while memberships reference it.

**New Model: `AuditLog`**

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| userId | String? | FK → User. Nullable (SetNull on user delete) |
| action | AuditAction | DELETE_CLIENT or EDIT_PAYMENT |
| entityType | String | e.g., "Client", "Payment" |
| entityId | String | ID of affected record |
| beforeState | Json? | Snapshot of record before change |
| createdAt | DateTime | Default: now(). No updatedAt — immutable |

**Modified Model: `Client`**

| Field | Type | Change |
|---|---|---|
| deletedAt | DateTime? | **ADDED** — null = active, non-null = soft-deleted |

**Modified Model: `User`**

| Field | Type | Change |
|---|---|---|
| deletedAt | DateTime? | **ADDED** — null = active, non-null = soft-deleted |

**Modified Model: `Membership`**

| Field | Type | Change |
|---|---|---|
| planId | String? | **ADDED** — nullable FK → MembershipPlan. Required in code, nullable in schema for backward compat |

**Modified Model: `Payment`**

| Field | Type | Change |
|---|---|---|
| paymentMethod | PaymentMethod | **ADDED** — @default(CASH) applied to pre-migration rows |
| notes | String? | **ADDED** — optional staff annotation |

**Modified Model: `GymSettings`**

| Field | Type | Change |
|---|---|---|
| gymName | String | **ADDED** — default: "Block23 Gym" |
| address | String? | **ADDED** — optional |
| contactEmail | String? | **ADDED** — for future email notifications |
| contactPhone | String? | **ADDED** — for display on reports/portal |
| walkInActiveDays | Int | **ADDED** — default: 7. Replaces magic number in code |

**Unchanged Models:** Account, Session, VerificationToken, Attendance

**Unchanged Enums:** Role, MembershipStatus, VisitType, PaymentType, PaymentStatus

---

### 6.2 All Design Decisions

| # | Decision Point | Confirmed Answer | Rationale |
|---|---|---|---|
| D1 | Payment.paymentMethod nullability | Required + @default(CASH) | Prevents null-handling in all payment code; CASH is safe assumption for early-stage gym |
| D2 | GymSettings contact field design | Split: contactEmail + contactPhone | Enables future email notifications without a migration |
| D3 | AuditLog.action type | AuditAction enum | Type-safe; typos caught at compile time; narrow scope suits enum |
| D4 | MembershipPlan.sortOrder | Include sortOrder Int | Prevents display-order instability as plans are archived/created |
| D5 | AuditLog metadata field name | beforeState Json? | More precise than "metadata" — communicates pre-change snapshot intent |
| D6 | MembershipPlan referential action | Restrict on delete | Plans must be archived, not deleted, while memberships reference them |
| D7 | Payment.notes field name | notes String? | Simple, widely understood |
| D8 | Membership.planId for new records | Required in code, nullable in schema | Backward compat for pre-migration records; new records must have planId |
| D9 | AuditLog.userId on user delete | SetNull | Log is preserved; attribution becomes null ("Deleted User") |
| D10 | User.deletedAt | Add now | Ready for staff management UI when built; prevents broken audit references |
| D11 | GymSettings primary key | Keep "default-settings" hardcoded | Explicit singleton intent; consistent with existing seed code |
| D12 | MembershipPlan minimum price | ₱0.00 allowed | Free/promotional plans are a valid business case |

---

### 6.3 Migration Risk Assessment

| Schema Change | Risk Level | Notes |
|---|---|---|
| Add User.deletedAt DateTime? | None | Nullable — existing rows unaffected |
| Add MembershipPlan model | None | New table — no existing data touched |
| Add Membership.planId String? | None | Nullable FK — existing rows get null |
| Add Client.deletedAt DateTime? | None | Nullable — existing rows unaffected |
| Add PaymentMethod enum | None | New enum — no existing column changed |
| Add Payment.paymentMethod @default(CASH) | Low | Default fills existing rows with CASH |
| Add Payment.notes String? | None | Nullable — existing rows unaffected |
| Add AuditAction enum | None | New enum |
| Add AuditLog model | None | New table |
| Extend GymSettings (6 new fields) | Low | Defaults and nullables fill the one existing row |

**Overall migration risk: Low.** All changes are purely additive. No existing column is dropped, renamed, or modified. The migration is safe to run against a database with existing production data.

---

## 7. Architecture Decision Records

Four ADRs were written under `docs/adr/`:

### ADR-001 — Soft Delete on Client and User
**Decision:** Add `deletedAt DateTime?` to both Client and User. `deleteClient()` sets this field instead of executing a cascade delete. All active-client queries filter `WHERE deletedAt IS NULL`. No cascade to Attendance, Payment, or Membership — related records are preserved for reporting.

**Why:** Permanent deletion of a client destroys all their attendance, payment, and membership history. This is an irreversible data loss. Soft delete preserves the full record while removing the client from active views.

**User.deletedAt** is added now to prepare for a future staff management UI, and to ensure that AuditLog entries retain their audit trail when staff accounts are eventually deactivated.

---

### ADR-002 — Configurable MembershipPlan Model
**Decision:** New `MembershipPlan` database table with admin CRUD. `Membership.planId` is a nullable FK (nullable for backward compat with pre-migration records; required in application code for new memberships). `onDelete: Restrict` — plans are retired by archiving (`isActive = false`), not by deletion.

**Why:** Membership plans (1/2/3 months, ₱1200/month) are currently hardcoded in three separate dialog components. Admin must be able to configure plans at runtime without a code deployment.

---

### ADR-003 — Partial Audit Log with AuditAction Enum
**Decision:** `AuditLog` model with `AuditAction` enum (DELETE_CLIENT, EDIT_PAYMENT). The snapshot field is named `beforeState` (not `metadata`). Records are immutable — no UPDATE or DELETE in application code. `userId` uses SetNull on user delete — the log survives but loses user attribution.

**Why:** The developer confirmed partial audit logging. An enum over a free-text string provides compile-time safety for a narrow, well-defined action set. SetNull preserves audit history even when a staff account is removed.

---

### ADR-004 — Payment.paymentMethod Required with CASH Default
**Decision:** `paymentMethod PaymentMethod @default(CASH)` — required field. All pre-migration payment rows receive CASH during the migration.

**Why:** A nullable field requires null-handling branches in every payment display, filter, and summary query. For an early-stage gym with no prior digital payment infrastructure, CASH is a safe and documented assumption for all historical records. Any misclassified records can be corrected via the ADMIN payment edit feature.

---

## 8. Technical Debt Register

Full details are in `docs/TECHNICAL_DEBT.md`. Summary below:

### Critical — Data-Corrupting

| ID | File | Problem | Phase |
|---|---|---|---|
| ATT-01 | `actions/attendance.ts` | `createWalkInAttendance()` creates a new Client record on every call — produces duplicate clients for every walk-in visit | Phase 2 |
| ATT-02 | `actions/attendance.ts`, `actions/client.ts` | `Attendance.visitType` defined in schema but never set — all attendance records lack visit type classification | Phase 2 |

### High — Functional Gaps

| ID | File | Problem | Phase |
|---|---|---|---|
| ATT-03 | `actions/attendance.ts` | Walk-in fee hardcoded as 100 — GymSettings.defaultWalkInFee exists but unused | Phase 3/5 |
| MEM-01 | 3 dialog components | Membership fee (₱1200) and durations hardcoded in 3 files — TODO comment exists | Phase 1 schema + Phase 5 UI |
| MEM-02 | `actions/membership.ts` | Incomplete dead code — missing durationInDays, amountPaid, payment creation, never called | Phase 1 (delete) |
| AUTH-01 | All actions and layouts | RBAC not enforced — ADMIN and STAFF have identical access | Phase 6 |
| PAY-01 | All payment creation actions | Payment status always PAID — PENDING, FAILED, REFUNDED unreachable | Phase 3 |
| PAY-02 | Payment model | No paymentMethod field — cash vs. digital indistinguishable | Phase 1 (schema) |
| SCHEMA-01 | `actions/client.ts` | deleteClient() is a hard cascade delete — all related history permanently destroyed | Phase 1 |
| SCHEMA-02 | All action files | GymSettings model never read — all fees hardcoded in source code | Phase 3–5 |

### Medium — Design and Maintainability

| ID | File | Problem | Phase |
|---|---|---|---|
| CODE-01 | 3 dialog components | Membership plan selection and summary logic duplicated ~300 lines | Phase 9 |
| CODE-02 | `view-client-dialog.tsx` | ~80 lines of commented-out code never removed | Phase 9 |
| CODE-03 | `client-kpi-cards.tsx` | Hardcoded color classes bypass design token system | Phase 9 |
| CODE-04 | `login/page.tsx` | text-red-500 instead of text-destructive | Phase 9 |
| CODE-05 | All dialog components | No form library — all forms use manual useState + useTransition | Phase 9 |
| CODE-06 | `clients/page.tsx` | Decimal serialization in page component instead of server action | Phase 2–3 |
| CODE-07 | `lib/client-status.ts` | Magic number 7 (walk-in active days) hardcoded | Phase 1 + Phase 5 |
| INFRA-01 | `package.json` | NextAuth.js v5 beta — API may change before stable release | Monitor |
| INFRA-02 | All route segments | No error.tsx or loading.tsx files anywhere | Phase 9 |
| SCHEMA-03 | User model | No User.deletedAt — staff deletion would break audit references | Phase 1 (V2 schema) |

### Low — Quality and Consistency

| ID | File | Problem | Phase |
|---|---|---|---|
| UI-01 | `dashboard/page.tsx` | p-10 wrapper — all other pages use p-6 | Phase 9 |
| UI-02 | `convert-to-member-dialog.tsx` | text-sky-500 hardcoded color class | Phase 9 |
| UI-03 | All interactive components | No accessibility audit performed | Phase 9 |

---

## 9. Files Created or Modified

### Created (Documentation Only)

| File | Size | Purpose |
|---|---|---|
| `docs/CLAUDE.md` | — | AI assistant context for future sessions |
| `docs/PROJECT_OVERVIEW.md` | — | Business overview and feature status |
| `docs/DATABASE_SCHEMA.md` | — | V2 schema specification (authoritative) |
| `docs/ROADMAP.md` | — | 9-phase implementation plan |
| `docs/TECHNICAL_DEBT.md` | — | 22 tracked technical debt items |
| `docs/adr/ADR-001.md` | — | Soft delete decision record |
| `docs/adr/ADR-002.md` | — | MembershipPlan decision record |
| `docs/adr/ADR-003.md` | — | AuditLog decision record |
| `docs/adr/ADR-004.md` | — | Payment.paymentMethod decision record |
| `docs/logs/2026-06-20-discovery-and-schema-design.md` | — | This file |

### Modified

None. No application code, Prisma schema, configuration files, or existing documentation were modified.

### Deleted

None.

---

## 10. Implementation Roadmap

| Phase | Goal | Dependency | Status |
|---|---|---|---|
| 1 — Schema Redesign | Apply V2 migration, seed data, soft delete code, delete dead code | None | **Ready to implement** |
| 2 — Attendance Rebuild | Search-based check-in, walk-in recognition, expired-member walk-in logic | Phase 1 | Blocked on Phase 1 |
| 3 — Payments Page | Full transaction history, method selection, ADMIN edit, daily summary | Phase 1 | Blocked on Phase 1 |
| 4 — Dashboard | KPIs + Recharts trend charts (needs Recharts install) | Phase 2–3 | Blocked on Phase 2–3 |
| 5 — Settings Page | Plan management, gym profile, fee config, GymSettings integration | Phase 1 | Blocked on Phase 1 |
| 6 — RBAC | Role guards in server actions and UI | Phase 5 | Blocked on Phase 5 |
| 7 — Reports & Exports | CSV/PDF: attendance, revenue, member list | Phase 3–4 | Blocked on Phase 3–4 |
| 8 — CI/CD | GitHub Actions: lint, type-check, build on every PR | None | Can start anytime |
| 9 — UI/Design System | Fix token inconsistencies, form library, component debt | After Phase 6 | Deferred |

### Future Phases (Post-MVP)

| Phase | Goal | Blocker |
|---|---|---|
| Client Portal / Mobile App | Client-facing read/view interface | Requires REST or tRPC API layer — Server Actions not usable by external clients |
| Loyalty / Rewards System | Points per visit and membership, redemption | Requires LoyaltyTransaction schema design |
| Audit Log UI | Admin view of all logged actions with filters | Requires AuditLog population (Phase 1 schema + Phase 3 writes) |
| Staff Management UI | Account creation, deactivation, role change | User.deletedAt ready from Phase 1 |

### Deployment Milestones

| Target | Environment |
|---|---|
| After Phase 1–3 complete | Deploy to Vercel staging |
| After Phase 1–6 complete | Deploy to Vercel production |
| After Phase 7–8 complete | Vercel production + GitHub CI active |
| Future phases | Evaluated per milestone |

---

## 11. Next Steps — Phase 1

Phase 1 is ready to begin. All schema decisions are finalized. The V2 schema specification is in `docs/DATABASE_SCHEMA.md`.

### Schema Changes (Prisma)

Apply one migration covering all of the following:

```
New enums:         PaymentMethod, AuditAction
New models:        MembershipPlan, AuditLog
Client:            + deletedAt DateTime?
User:              + deletedAt DateTime?
Membership:        + planId String? (FK → MembershipPlan, Restrict)
Payment:           + paymentMethod PaymentMethod @default(CASH)
                   + notes String?
GymSettings:       + gymName String @default("Block23 Gym")
                   + address String?
                   + contactEmail String?
                   + contactPhone String?
                   + walkInActiveDays Int @default(7)
```

### Seed File Updates

- Update GymSettings seed record with new fields
- Add three default MembershipPlan records:
  - 1 Month — 30 days — ₱1,200.00 — sortOrder: 1
  - 2 Months — 60 days — ₱2,400.00 — sortOrder: 2
  - 3 Months — 90 days — ₱3,600.00 — sortOrder: 3

### Code Changes (Phase 1 Scope Only)

- Update `deleteClient()` in `src/actions/client.ts` — set `deletedAt = now()` + write AuditLog entry — remove cascade delete
- Update all active-client queries to filter `where: { deletedAt: null }`
- Replace magic number `7` in `src/lib/client-status.ts` with constant `WALK_IN_ACTIVE_DAYS = 7`
- Delete `src/actions/membership.ts` entirely

### Scope Boundary

Phase 1 does **not** include:
- UI changes of any kind
- Attendance module changes (Phase 2)
- Connecting hardcoded fees to GymSettings (Phase 3/5)
- Adding paymentMethod to membership creation dialogs (Phase 3/5)
- Role enforcement (Phase 6)

---

*End of development log — 2026-06-20*

*Documentation is the source of truth. All schema changes must update `docs/DATABASE_SCHEMA.md` and the relevant ADR before implementation begins.*
