# Claude Context — Block23 Gym Management System

This file is the primary context reference for Claude Code sessions on this project. Read this before reading other files.

---

## Project in One Paragraph

Block23 Gym Management System is a staff-operated internal tool for managing gym clients, memberships, attendance, and payments. It is built with Next.js 16 (App Router), Prisma 7, and PostgreSQL (Neon). The system is for a single gym location in the Philippines (PHP currency). The developer plans to resell it to other gyms as separate, isolated deployments — not as a shared multi-tenant SaaS.

---

## Technology Quick Reference

| Concern | Technology |
|---|---|
| Framework | Next.js 16.2.6, App Router, React 19 |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL via Neon (ap-southeast-1) |
| ORM | Prisma 7.8.0 with @prisma/adapter-pg runtime adapter |
| Auth | NextAuth.js 5.0.0-beta.31 (JWT + Credentials) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 (CSS-first, no tailwind.config.js) |
| Validation | Zod 4.4.3 |
| Dates | date-fns 4.4.0 |
| Icons | Lucide React |
| Notifications | Sonner (toasts) |
| Theme | next-themes (dark/light) |
| Path alias | `@/*` → `./src/*` |

---

## Architecture Patterns

- **All mutations use Next.js Server Actions** — there are no REST API routes beyond the NextAuth handler at `src/app/api/auth/[...nextauth]/route.ts`
- **Route groups:** `(auth)` for login, `(dashboard)` for all protected pages
- **Auth guard:** `src/app/(dashboard)/layout.tsx` checks session and redirects unauthenticated users to `/login`
- **Data flow:** Server components fetch from Prisma directly → pass as props → client components mutate via server actions
- **Cache invalidation:** `revalidatePath()` called after every mutation
- **Prisma client:** Singleton with global cache in `src/lib/prisma.ts` using `PrismaPg` adapter

---

## Directory Map

```
src/
├── app/
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/            # All protected pages
│   │   ├── attendance/         # Attendance module — working (Phase 2 complete)
│   │   ├── clients/            # Clients module — complete
│   │   ├── dashboard/          # Dashboard — stub (Phase 4 not started)
│   │   ├── payments/           # Payments module — complete (Phase 3 complete)
│   │   ├── settings/           # Settings — stub (Phase 5 not started)
│   │   └── layout.tsx          # Auth gate
│   ├── api/auth/[...nextauth]/ # NextAuth handler
│   ├── globals.css             # Tailwind + design tokens (achromatic — Phase 9 pending)
│   └── layout.tsx              # Root layout (fonts, Sonner)
├── actions/
│   ├── client.ts               # createWalkInClient, createMember, updateClient,
│   │                           #   convertToMember, renewMembership, deleteClient
│   ├── attendance.ts           # searchClients, checkIn, timeOutAttendance
│   └── payment.ts              # editPayment (ADMIN-only), getClientPayments
├── components/
│   ├── attendance/             # 3 components (attendance-form, attendance-table, time-out-button)
│   ├── clients/                # 12 components (CRUD dialogs, table, toolbar, KPI cards,
│   │                           #   client-payment-history-dialog)
│   ├── payments/               # 4 components (payments-summary, payments-filter,
│   │                           #   payments-table, edit-payment-dialog)
│   ├── dashboard/              # navbar.tsx, sidebar.tsx
│   └── ui/                     # 15 shadcn/ui components
├── constants/
│   └── navigation.ts           # Sidebar nav items
├── lib/
│   ├── client-status.ts        # getClientType(), getClientStatus() — uses WALK_IN_ACTIVE_DAYS constant
│   ├── format-name.ts          # Proper-case name formatting
│   ├── prisma.ts               # Prisma singleton
│   ├── utils.ts                # cn() classname utility
│   └── validations/client.ts  # Zod schema for client creation
└── types/
    └── next-auth.d.ts          # Session augmentation (id, role)

prisma/
├── schema.prisma               # V2 schema (live) — see DATABASE_SCHEMA.md
└── seed.ts                     # Creates admin user, GymSettings, and 3 MembershipPlan records
```

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Authentication | Working (~95%) | Roles exist; RBAC enforced only on `editPayment` (Phase 6 incomplete) |
| Clients CRUD | Complete | Search, filter, create, edit, soft delete with AuditLog |
| Membership lifecycle | Working (~85%) | Fees still hardcoded in dialogs; `planId` not passed to actions (see CODE-08) |
| Attendance | Working (~90%) | Phase 2 complete: search-based check-in, visitType set, duplicate prevention |
| Payments UI | Complete (~95%) | Phase 3 complete: transaction history, period filter, daily summary, per-client history, ADMIN editing |
| Audit logging | Partial (~60%) | DELETE_CLIENT and EDIT_PAYMENT log to AuditLog; no UI to view log yet |
| Dashboard | Stub | Logout button only — Phase 4 not started |
| Settings | Stub | `<div>Settings Page</div>` — Phase 5 not started |
| GymSettings (DB) | Partial | `defaultWalkInFee` read in attendance and payments; monthly fee and walkInActiveDays deferred to Phase 5 |

---

## Critical Known Issues (Do Not Ignore)

1. **`Membership.planId` is always null for new memberships** — The V2 schema added `planId String?` and the seed creates three `MembershipPlan` records, but none of the three membership server actions (`createMember`, `convertToMember`, `renewMembership`) pass a `planId` to `tx.membership.create()`. New memberships are created with `planId = null`, the same as pre-V2. The UI dialogs still use hardcoded fees and durations. **See CODE-08 in `docs/TECHNICAL_DEBT.md`. Blocked until Phase 5.**

2. **`deleteClient()` does not enforce ADMIN role** — The action performs a soft delete and writes an AuditLog, but does not check `session.user.role`. A STAFF user can currently delete clients, which is an ADMIN-only operation by design. **See AUTH-01. Blocked until Phase 6.**

---

## Key Conventions

- **Name formatting:** All client names run through `src/lib/format-name.ts` before being stored
- **Client type** is derived at runtime (not stored) — a client with any membership is a MEMBER; otherwise WALK_IN
- **Client status** is derived at runtime via `src/lib/client-status.ts` — ACTIVE/EXPIRED/INACTIVE
- **Soft delete — Client:** After Phase 1, `deleteClient()` sets `deletedAt = now()`. Every active-client query must include `where: { deletedAt: null }`. See `docs/adr/ADR-001.md`.
- **Soft delete — User:** `User.deletedAt` exists from Phase 1. Staff queries and NextAuth credential checks must filter `deletedAt IS NULL`.
- **MembershipPlan:** Plans exist in the `MembershipPlan` table (seeded with 1/2/3 Month records). Query with `where: { isActive: true }` ordered by `sortOrder ASC` for the plan selector. Phase 5 connects the UI to live plan data.
- **Membership.planId:** Nullable in schema (for pre-migration records). The intent is for server actions to require `planId` for new memberships, but this is **not yet enforced** — all three membership creation actions currently create records with `planId = null`. See CODE-08. Phase 5 fixes this.
- **GymSettings singleton:** Always access via `prisma.gymSettings.findUniqueOrThrow({ where: { id: "default-settings" } })`. Never use `findFirst()`.
- **Walk-in active window:** After Phase 1, read `walkInActiveDays` from `GymSettings` instead of the hardcoded `7` in `client-status.ts`.
- **Decimal serialization:** Prisma `Decimal` types are manually converted to `Number` in the clients page component before passing to client components — this is a known debt item (CODE-06)
- **Design tokens:** All colors, radius, and spacing should use CSS custom properties from `globals.css`. Do not use hardcoded Tailwind color classes (e.g., `bg-blue-500`) in components — use token-based classes
- **AuditLog:** Write audit entries inside the same Prisma transaction as the action being logged. Never write an audit entry without the underlying action succeeding.

---

## Confirmed Design Decisions

These are locked-in decisions from the developer discovery session and V2 schema design. Do not contradict them without explicit re-confirmation.

**Business rules:**
- Single gym location, PHP currency only, no multi-tenancy in schema
- Separate deployment per gym customer (resale model)
- Walk-ins are recognized by name/phone — no anonymous/duplicate records
- Expired member check-in: allowed, but recorded as `visitType = WALK_IN` with walk-in fee charged
- One active membership per client at a time
- Membership payment always upfront — PENDING status not used for memberships

**Schema decisions (V2 — see `docs/DATABASE_SCHEMA.md` and `docs/adr/`):**
- Soft delete on both `Client` and `User` — `deletedAt DateTime?` field on each
- Configurable plans via `MembershipPlan` model — `Membership.planId` nullable in schema, required in code
- `MembershipPlan` uses `Restrict` referential action — archive instead of delete
- `Payment.paymentMethod` PaymentMethod enum (CASH, GCASH, PAYMAYA) — required, pre-migration rows default to CASH
- `AuditLog.action` uses `AuditAction` enum (DELETE_CLIENT, EDIT_PAYMENT) — immutable records
- `AuditLog.userId` uses SetNull on user delete — log is preserved, attribution lost
- `GymSettings` retains hardcoded `id: "default-settings"` singleton pattern
- `GymSettings` gains: gymName, address, contactEmail, contactPhone, walkInActiveDays
- ₱0.00 plans are valid (free/promotional plans allowed)
- `MembershipPlan.sortOrder` included for display order control
- `AuditLog.beforeState Json?` (not "metadata") for pre-change snapshots

**Access control:**
- ADMIN only: configure settings, manage staff accounts, delete clients, edit payments
- Partial audit log: DELETE_CLIENT and EDIT_PAYMENT only

---

## Related Documentation

- `docs/PROJECT_OVERVIEW.md` — high-level project description and feature status
- `docs/DATABASE_SCHEMA.md` — full schema documentation (V2 — currently live)
- `docs/ROADMAP.md` — implementation phases and feature backlog
- `docs/TECHNICAL_DEBT.md` — prioritized list of all known debt and broken functionality
- `docs/DESIGN_SYSTEM.md` — design token definitions, typography, component patterns, and Phase 9 implementation spec
- `docs/adr/` — Architecture Decision Records (ADR-001 through ADR-004)
