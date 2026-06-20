# Development Log — Phase 1: Schema Redesign
**Date:** 2026-06-20
**Session type:** Implementation
**Branch:** main
**Migration applied:** `20260620084820_v2_schema_redesign`

---

## Overview

This session implemented Phase 1 of the Block23 Gym Management System roadmap: a full V2 database schema redesign. All changes were designed and documented in the previous discovery session (see `docs/logs/2026-06-20-discovery-and-schema-design.md`). No new architectural decisions were made in this session — every change here was pre-approved and recorded in `docs/DATABASE_SCHEMA.md`, `docs/ROADMAP.md`, and `docs/adr/`.

The primary goal was to bring the schema into a state where all future feature phases (attendance rebuild, payments, dashboard, settings, RBAC) can be built on a solid foundation without needing further structural migrations.

---

## Files Changed

| File | Change Type | Summary |
|---|---|---|
| `prisma/schema.prisma` | Modified | Full V2 schema — 2 new enums, 2 new models, 5 modified models |
| `prisma/migrations/20260620084820_v2_schema_redesign/` | New | Auto-generated SQL migration applied to Neon |
| `prisma/seed.ts` | Modified | Added 3 default MembershipPlan records; updated GymSettings fields |
| `prisma.config.ts` | Modified | Added seed command (`npx tsx prisma/seed.ts`) |
| `package.json` | Modified | Added `dotenv` as a declared devDependency |
| `pnpm-lock.yaml` | Modified | Updated by pnpm after dotenv install |
| `src/actions/client.ts` | Modified | Soft delete; deletedAt filters; auth import; removed dead import |
| `src/actions/attendance.ts` | Modified | Minimal type fix (pre-existing bugs; full rebuild in Phase 2) |
| `src/actions/membership.ts` | **Deleted** | Dead code removed (MEM-02 debt item) |
| `src/app/(dashboard)/clients/page.tsx` | Modified | Added `deletedAt: null` filter to findMany |
| `src/auth.ts` | Modified | Block soft-deleted users from logging in |
| `src/components/clients/delete-client-dialog.tsx` | Modified | UI copy updated to reflect soft delete (history preserved) |
| `src/components/clients/clients-table.tsx` | Modified | Removed dead import of `CreateMembershipButton` |
| `src/components/clients/create-membership-button.tsx` | **Deleted** | Dead code — `// NOT USED` component depending on deleted action |
| `src/lib/client-status.ts` | Modified | Extracted magic number `7` to named constant |

---

## Schema Changes in Detail

### New Enums

#### `PaymentMethod`
```prisma
enum PaymentMethod {
  CASH
  GCASH
  PAYMAYA
}
```
- Tracks how each payment was collected
- Required by business rule: staff explicitly selects payment method at time of transaction
- Pre-migration rows default to `CASH` (see ADR-004 for rationale)
- No `OTHER` value — these three methods are the complete confirmed set

#### `AuditAction`
```prisma
enum AuditAction {
  DELETE_CLIENT
  EDIT_PAYMENT
}
```
- Partial audit log — only the two confirmed high-risk actions require logging
- Enum-typed rather than free-text to enable reliable filtering and reporting
- Future actions (e.g., `EDIT_CLIENT`, `ARCHIVE_PLAN`) will be added when those phases are built

---

### New Models

#### `MembershipPlan`
```prisma
model MembershipPlan {
  id             String  @id @default(cuid())
  name           String
  durationInDays Int
  price          Decimal @db.Decimal(10, 2)
  isActive       Boolean @default(true)
  sortOrder      Int     @default(0)
  memberships    Membership[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```
- Replaces hardcoded 1/2/3-month plan logic scattered across 3 dialog components
- Admin-configurable from the Settings page (Phase 5)
- `sortOrder` field controls display order in plan selectors
- `isActive` enables archive-over-delete (plans in use cannot be deleted — `Restrict`)
- ₱0.00 plans are valid (free/promotional plans allowed)
- Seed records: `plan-1-month`, `plan-2-months`, `plan-3-months` with stable IDs for idempotent re-seeding

#### `AuditLog`
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  action      AuditAction
  entityType  String
  entityId    String
  beforeState Json?
  createdAt   DateTime    @default(now())
}
```
- Immutable records — no `updatedAt` field; audit entries are never modified
- `userId` uses `onDelete: SetNull` — log is preserved when a staff account is deleted, attribution is nulled
- `beforeState Json?` stores a snapshot of the record before the action (not generic metadata)
- Always written inside the same Prisma transaction as the action being logged — no orphaned audit entries possible
- No `AuditLog[]` query interface yet (Phase 7 will add the Audit Log UI)

---

### Modified Models

#### `Client` — added `deletedAt`
```prisma
deletedAt DateTime?
```
- Implements soft delete (ADR-001)
- `deleteClient()` now sets this field instead of issuing `DELETE` SQL
- All active-client queries now include `WHERE deletedAt IS NULL`
- Attendance, membership, and payment records are fully preserved on delete
- Deleted clients are hidden from all UI but remain in the database

#### `User` — added `deletedAt` and `auditLogs` relation
```prisma
deletedAt DateTime?
auditLogs AuditLog[]
```
- Soft delete for staff accounts (ADR-001)
- Staff management UI is deferred to a future phase, but the field is ready
- NextAuth credential check now rejects users where `deletedAt IS NOT NULL`
- The `auditLogs` relation enables future attribution queries (`who deleted what`)

#### `Membership` — added `planId`
```prisma
planId String?
plan   MembershipPlan? @relation(fields: [planId], references: [id], onDelete: Restrict)
```
- Nullable in schema for compatibility with pre-migration records (which have no plan)
- Required in application code for all new membership creation (enforced at the action level — Phase 5 when dialogs are connected to live plan data)
- `onDelete: Restrict` — a plan cannot be deleted if any memberships reference it; use `isActive = false` to archive instead

#### `Payment` — added `paymentMethod` and `notes`
```prisma
paymentMethod PaymentMethod @default(CASH)
notes         String?
```
- `paymentMethod` with `@default(CASH)`: migration applies CASH to all pre-existing rows (see ADR-004 for documented assumption)
- `notes` field: free-text for ADMIN manual payment corrections; optional
- Enables daily cash reconciliation, cash vs. digital revenue breakdown (Phase 3)

#### `GymSettings` — extended with 5 new fields
```prisma
gymName          String  @default("Block23 Gym")
address          String?
contactEmail     String?
contactPhone     String?
walkInActiveDays Int     @default(7)
```
- `gymName`: displayed in reports and future client-facing materials
- `address`, `contactEmail`, `contactPhone`: gym profile fields for the Settings page (Phase 5)
- `walkInActiveDays`: configurable window for walk-in active status (replaces the magic number `7` in `client-status.ts`)
- Split contact fields (email + phone separately) to enable future email notifications without a schema migration

---

## Code Changes in Detail

### `src/actions/client.ts`

#### `deleteClient()` — soft delete with AuditLog
**Before (hard cascade delete):**
```typescript
export async function deleteClient(clientId: string) {
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { clientId } }),
    prisma.payment.deleteMany({ where: { clientId } }),
    prisma.membership.deleteMany({ where: { clientId } }),
    prisma.client.delete({ where: { id: clientId } }),
  ]);
  revalidatePath("/clients");
}
```

**After (soft delete + audit log):**
```typescript
export async function deleteClient(clientId: string) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  await prisma.$transaction(async (tx) => {
    const client = await tx.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, phone: true, createdAt: true },
    });

    await tx.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "DELETE_CLIENT",
        entityType: "Client",
        entityId: clientId,
        beforeState: client,
      },
    });
  });

  revalidatePath("/clients");
}
```

Key design choices:
- `auth()` is called inside the server action (not passed from the client) — avoids prop drilling and prevents the client from spoofing a userId
- `beforeState` captures the client's core fields as a JSON snapshot at the moment of deletion
- Transaction wraps all three operations: if the audit log write fails, the soft delete is also rolled back — no silent data loss
- `findUniqueOrThrow` rather than `findUnique` — fails loudly if the clientId doesn't exist rather than silently writing a null audit entry

#### Duplicate-check `findFirst` calls — added `deletedAt: null`

Three duplicate-check queries were each missing `deletedAt: null`. Without this filter, a deleted client with the same name as a new client would block re-registration permanently.

- `createWalkInClient()`: `where: { firstName, lastName, deletedAt: null }`
- `createMember()`: `where: { firstName, lastName, deletedAt: null }`
- `updateClient()`: `where: { firstName, lastName, deletedAt: null, NOT: { id: data.id } }`

---

### `src/app/(dashboard)/clients/page.tsx`

**Before:**
```typescript
const where: Prisma.ClientWhereInput = search
  ? { OR: [...] }
  : {};
```

**After:**
```typescript
const where: Prisma.ClientWhereInput = {
  deletedAt: null,
  ...(search ? { OR: [...] } : {}),
};
```

`deletedAt: null` is always applied regardless of whether a search term is present. The spread merges the search OR clause into the same where object without nesting.

---

### `src/lib/client-status.ts`

**Before:**
```typescript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
return latestAttendance.timeIn >= sevenDaysAgo ? "ACTIVE" : "INACTIVE";
```

**After:**
```typescript
const WALK_IN_ACTIVE_DAYS = 7;
// ...
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - WALK_IN_ACTIVE_DAYS);
return latestAttendance.timeIn >= cutoff ? "ACTIVE" : "INACTIVE";
```

Phase 5 will replace the constant with a live read from `GymSettings.walkInActiveDays`. The comment on the constant documents this intent.

---

### `src/auth.ts`

**Before:**
```typescript
if (!user) {
  return null;
}
```

**After:**
```typescript
if (!user || user.deletedAt !== null) {
  return null;
}
```

A deactivated staff account (soft-deleted) is now blocked at the credential provider level. The response is identical to a wrong password — no information is leaked about whether the account exists.

---

### `src/actions/attendance.ts` — Minimal type fix

Pre-existing type errors in `createWalkInAttendance()` that now block compilation:
1. `lastName` parameter is `string | undefined` but `Client.lastName` is `String` (non-nullable) — fixed with `lastName ?? ""`
2. `Attendance.visitType` is required in the schema but was never set — fixed with `visitType: "WALK_IN"` as a placeholder

These are not functional fixes. The entire function is broken (ATT-01, ATT-02) and will be fully rewritten in Phase 2. The comment `// ATT-02: visitType set to WALK_IN here as a minimal fix; full rebuild in Phase 2` documents this explicitly in the code.

---

### Dead Code Removed

**`src/actions/membership.ts`** (MEM-02):
- Contained `createMembership()` which was incomplete (missing `durationInDays`, `amountPaid`, no payment creation)
- Was not called from any meaningful code path
- Superseded by the membership creation logic inside `src/actions/client.ts`

**`src/components/clients/create-membership-button.tsx`**:
- Had `// NOT USED` comment at the top
- Imported from the deleted `membership.ts` action
- Import was also dead in `clients-table.tsx` (imported but never used in JSX)
- Both the component and its dead import in `clients-table.tsx` were removed

---

### `src/components/clients/delete-client-dialog.tsx` — UI copy update

The dialog previously described the delete action as permanent and listed "Data That Will Be Deleted" with all history items. Since the operation is now a soft delete (history preserved), the UI copy was updated:
- Title: "Permanently Delete Client" → "Delete Client"
- Description: "This action cannot be undone" → "This client will be removed from active records. Their history is preserved."
- Section header: "Data That Will Be Deleted" → "What Happens"
- List items reworded from "deleted" to "retained"
- Removed the red warning box ("Once deleted, this client's history cannot be recovered")

---

## Seed Data Applied

Three default `MembershipPlan` records were upserted with stable IDs (safe to re-run):

| ID | Name | Duration | Price | Sort |
|---|---|---|---|---|
| `plan-1-month` | 1 Month | 30 days | ₱1,200.00 | 1 |
| `plan-2-months` | 2 Months | 60 days | ₱2,400.00 | 2 |
| `plan-3-months` | 3 Months | 90 days | ₱3,600.00 | 3 |

`GymSettings` singleton was updated with new fields:
- `gymName: "Block23 Gym"` (default)
- `walkInActiveDays: 7` (default — matches extracted constant)

---

## Technical Debt Resolved

| Debt Item | Status |
|---|---|
| SCHEMA-01 — Hard delete on Client | **Resolved** — soft delete implemented |
| SCHEMA-03 — No soft delete on User | **Resolved** — `deletedAt` added, credential check updated |
| MEM-02 — Dead membership action file | **Resolved** — file deleted |
| PAY-02 — No payment method field | **Resolved** — `PaymentMethod` enum and field added |
| CODE-07 — Magic number (7 days) | **Partially resolved** — constant extracted; Phase 5 connects to GymSettings |
| MEM-01 — Membership fee hardcoded | **Schema ready** — `MembershipPlan` model seeded; UI connection in Phase 5 |

---

## Infrastructure Note

`dotenv` was only a transitive dependency (installed via Prisma) but not declared in `package.json`. This caused a red underline in the IDE on `import "dotenv/config"` in `prisma/seed.ts` and `prisma.config.ts`. Fixed by adding `dotenv@17.4.2` as an explicit devDependency via `pnpm add -D dotenv`.

---

## What Is NOT Changed

Per the Phase 1 scope boundary:
- No UI changes to membership plan selectors (dialogs still use hardcoded values — Phase 5)
- No connection between server actions and `GymSettings` fees (Phase 3–5)
- No RBAC enforcement (Phase 6)
- `Attendance.visitType` is still not properly set in the check-in flow (Phase 2 rewrite)
- No `Membership.planId` enforcement in dialog components yet (Phase 5)
- No staff management UI (deferred indefinitely — managed via seed/DB)

---

## Next Phase

**Phase 2 — Attendance Module Rebuild**

The attendance module is the most broken part of the current system (ATT-01, ATT-02). Phase 2 will:
- Redesign `createWalkInAttendance()` with name+phone lookup to prevent duplicate client records
- Add a member check-in action (search existing clients, set `visitType = MEMBER`)
- Handle expired-member check-in as walk-in (fee charged, `visitType = WALK_IN`)
- Rebuild `attendance-form.tsx` with search input, result dropdown, and payment method selector
- Update `attendance-table.tsx` to display `visitType` and `paymentMethod`
