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
│   │   ├── attendance/         # Attendance module (broken — see TECHNICAL_DEBT.md)
│   │   ├── clients/            # Clients module (complete)
│   │   ├── dashboard/          # Dashboard (stub)
│   │   ├── payments/           # Payments (stub)
│   │   ├── settings/           # Settings (stub)
│   │   └── layout.tsx          # Auth gate
│   ├── api/auth/[...nextauth]/ # NextAuth handler
│   ├── globals.css             # Tailwind + design tokens
│   └── layout.tsx              # Root layout (fonts, Sonner)
├── actions/
│   ├── client.ts               # Primary action file — complete
│   ├── attendance.ts           # Broken — see TECHNICAL_DEBT.md
│   └── membership.ts           # Dead code — createMembership() is incomplete and unused
├── components/
│   ├── attendance/             # 3 components (attendance-form, attendance-table, time-out-button)
│   ├── clients/                # 11 components (full CRUD dialogs, table, toolbar, KPI cards)
│   ├── dashboard/              # navbar.tsx, sidebar.tsx
│   └── ui/                     # 15 shadcn/ui components
├── constants/
│   └── navigation.ts           # Sidebar nav items
├── lib/
│   ├── client-status.ts        # getClientType(), getClientStatus() — magic number: 7 days
│   ├── format-name.ts          # Proper-case name formatting
│   ├── prisma.ts               # Prisma singleton
│   ├── utils.ts                # cn() classname utility
│   └── validations/client.ts  # Zod schema for client creation only
└── types/
    └── next-auth.d.ts          # Session augmentation (id, role)

prisma/
├── schema.prisma               # Full schema — see DATABASE_SCHEMA.md
└── seed.ts                     # Creates admin user + GymSettings
```

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Authentication | Working (~95%) | Roles exist but RBAC is not enforced anywhere |
| Clients CRUD | Complete | Search, filter, create, edit, delete (hard delete — see debt) |
| Membership lifecycle | Working (~90%) | Fees hardcoded; orphan action file exists |
| Attendance | Broken (~40%) | Creates duplicate clients; members cannot check in; visitType never set |
| Payments UI | Stub | `<div>Payments Page</div>` |
| Dashboard | Stub | Logout button only |
| Settings | Stub | `<div>Settings Page</div>` |
| GymSettings (DB) | Unused | Model exists with defaults; never read in any action or component |

---

## Critical Known Issues (Do Not Ignore)

1. **`src/actions/attendance.ts` — `createWalkInAttendance()`** creates a brand-new `Client` record on every call. Existing members and returning walk-ins are not looked up. This produces duplicate client records and must be redesigned before the attendance module is used. **Resolved in Phase 2.**

2. **`Attendance.visitType` is never set** in any server action. All attendance records in the database have an unset visit type. **Resolved in Phase 2.**

3. **`src/actions/membership.ts`** — the `createMembership()` function is incomplete (missing `durationInDays`, missing `amountPaid`, no payment creation) and is not called from anywhere meaningful. It is dead code. **Delete this file in Phase 1.**

4. **`GymSettings` is never read** — membership fees (₱1200) and walk-in fees (₱100) are hardcoded in multiple files instead of reading from the database. **Resolved progressively across Phases 3–5.**

5. **Hard delete** — `deleteClient()` permanently removes all attendance, payment, and membership history. **V2 schema adds `Client.deletedAt`. Code fix in Phase 1.**

---

## Key Conventions

- **Name formatting:** All client names run through `src/lib/format-name.ts` before being stored
- **Client type** is derived at runtime (not stored) — a client with any membership is a MEMBER; otherwise WALK_IN
- **Client status** is derived at runtime via `src/lib/client-status.ts` — ACTIVE/EXPIRED/INACTIVE
- **Soft delete — Client:** After Phase 1, `deleteClient()` sets `deletedAt = now()`. Every active-client query must include `where: { deletedAt: null }`. See `docs/adr/ADR-001.md`.
- **Soft delete — User:** `User.deletedAt` exists from Phase 1. Staff queries and NextAuth credential checks must filter `deletedAt IS NULL`.
- **MembershipPlan:** After Phase 1, plans come from the `MembershipPlan` table. Query with `where: { isActive: true }` ordered by `sortOrder ASC` for the plan selector. Do not hardcode durations or prices anywhere.
- **Membership.planId:** Nullable in schema (for pre-migration records), but server actions must require it for all new memberships. Reject at the action level if not provided.
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
- `docs/DATABASE_SCHEMA.md` — full schema documentation and planned changes
- `docs/ROADMAP.md` — implementation phases and feature backlog
- `docs/TECHNICAL_DEBT.md` — prioritized list of all known debt and broken functionality
