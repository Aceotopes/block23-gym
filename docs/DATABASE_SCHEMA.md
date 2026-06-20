# Database Schema — Block23 Gym Management System

## Connection

- **Provider:** PostgreSQL
- **Host:** Neon (serverless PostgreSQL, ap-southeast-1 AWS region)
- **ORM:** Prisma 7.8.0 with `@prisma/adapter-pg` runtime adapter
- **Schema file:** `prisma/schema.prisma`

---

## Schema Version

| Version | Status | Notes |
|---|---|---|
| V1 | Superseded | Original MVP schema. No MembershipPlan, no soft delete, no PaymentMethod. |
| V2 | Specified — pending Phase 1 migration | All decisions finalized. See ADRs in `docs/adr/`. |

This document describes the **V2 schema** — the authoritative specification for Phase 1 implementation. The Prisma schema file (`prisma/schema.prisma`) must match this document after Phase 1 is complete.

---

## Enums

### Unchanged from V1

```
Role
  ADMIN
  STAFF

MembershipStatus
  ACTIVE
  EXPIRED
  CANCELLED

VisitType
  MEMBER
  WALK_IN

PaymentType
  MEMBERSHIP
  WALK_IN

PaymentStatus
  PAID
  PENDING
  FAILED
  REFUNDED
```

### New in V2

```
PaymentMethod                   ← NEW
  CASH
  GCASH
  PAYMAYA

AuditAction                     ← NEW
  DELETE_CLIENT
  EDIT_PAYMENT
```

---

## Models

### User
Authentication accounts for gym staff.

| Field | Type | V2 Change | Notes |
|---|---|---|---|
| id | String (CUID) | — | Primary key |
| name | String? | — | Optional display name |
| email | String | — | Unique |
| password | String | — | bcrypt hash |
| role | Role | — | Default: STAFF |
| deletedAt | DateTime? | **NEW** | Null = active. Non-null = soft-deleted staff account |
| createdAt | DateTime | — | Default: now() |
| updatedAt | DateTime | — | Auto-updated |

Relations: `accounts Account[]`, `sessions Session[]`, `auditLogs AuditLog[]`

**Soft delete notes:**
- `deletedAt` is added now to support a future staff management UI (deferred to a later phase)
- All staff account queries must filter `WHERE deletedAt IS NULL`
- A soft-deleted user's audit log entries remain intact (userId on AuditLog uses SetNull on user delete — see AuditLog model)
- See `docs/adr/ADR-001.md`

---

### Account
NextAuth internal model for OAuth provider tokens. Unchanged from V1.

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| userId | String | FK → User (cascade delete) |
| type | String | — |
| provider | String | — |
| providerAccountId | String | — |
| refresh_token | String? | — |
| access_token | String? | — |
| expires_at | Int? | — |
| token_type | String? | — |
| scope | String? | — |
| id_token | String? | — |
| session_state | String? | — |

Unique constraint: `[provider, providerAccountId]`

---

### Session
NextAuth internal model. Unchanged from V1.

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| sessionToken | String | Unique |
| userId | String | FK → User (cascade delete) |
| expires | DateTime | — |

---

### VerificationToken
NextAuth internal model. Unchanged from V1.

| Field | Type | Notes |
|---|---|---|
| identifier | String | — |
| token | String | Unique |
| expires | DateTime | — |

Unique constraint: `[identifier, token]`

---

### Client
Core entity. Represents every person who interacts with the gym — members and walk-in visitors.

| Field | Type | V2 Change | Notes |
|---|---|---|---|
| id | String (CUID) | — | Primary key |
| firstName | String | — | Formatted on write (proper case) |
| lastName | String | — | Formatted on write (proper case) |
| phone | String? | — | Optional |
| deletedAt | DateTime? | **NEW** | Null = active. Non-null = soft-deleted |
| createdAt | DateTime | — | Default: now() |
| updatedAt | DateTime | — | Auto-updated |

Indexes: `firstName`, `lastName`, `phone`

Relations: `attendances Attendance[]`, `payments Payment[]`, `memberships Membership[]`

**Soft delete rules:**
- `deleteClient()` sets `deletedAt = now()` — no cascade delete
- All attendance, payment, and membership records are preserved intact
- Every active-client query must include `WHERE deletedAt IS NULL`
- Affected queries: client list page, status derivation in `client-status.ts`, all dashboard counts
- See `docs/adr/ADR-001.md`

**Design note:** Client type (MEMBER vs WALK_IN) and status (ACTIVE / EXPIRED / INACTIVE) are not stored — they are derived at runtime from related membership and attendance records. This derivation must also respect `deletedAt`.

---

### MembershipPlan
**New in V2.** Admin-configurable subscription plans. Replaces hardcoded 1/2/3-month plan logic scattered across dialog components.

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| name | String | e.g., "1 Month", "3 Months", "Student" |
| durationInDays | Int | e.g., 30, 60, 90 |
| price | Decimal(10,2) | Price in PHP. ₱0.00 is valid (free/promotional plans) |
| isActive | Boolean | Default: true. False = archived — not selectable for new memberships but existing references remain valid |
| sortOrder | Int | Default: 0. Controls display order in plan selector dropdowns |
| createdAt | DateTime | Default: now() |
| updatedAt | DateTime | Auto-updated |

Relations: `memberships Membership[]`

**Referential action:** `onDelete: Restrict` — a plan cannot be deleted while any `Membership` record references it. Admins must archive (set `isActive = false`) to retire a plan.

**See:** `docs/adr/ADR-002.md`

---

### Membership
Subscription entitlement for a client.

| Field | Type | V2 Change | Notes |
|---|---|---|---|
| id | String (CUID) | — | Primary key |
| clientId | String | — | FK → Client |
| planId | String? | **NEW** | Nullable FK → MembershipPlan. Null for memberships created before V2 migration |
| durationInDays | Int | — | Retained for historical records and as a denormalized copy of plan duration at time of purchase |
| amountPaid | Decimal(10,2) | — | Amount actually paid. Preserved separately from plan price to handle pricing changes over time |
| startDate | DateTime | — | When membership begins |
| endDate | DateTime | — | When membership expires |
| status | MembershipStatus | — | Default: ACTIVE |
| createdAt | DateTime | — | Default: now() |
| updatedAt | DateTime | — | Auto-updated |

Indexes: `clientId`, `status`

**V2 planId rules:**
- Nullable in schema to avoid breaking pre-migration records
- Required in application code for all new memberships — the server action throws a validation error if no `planId` is provided
- See `docs/adr/ADR-002.md`

**Why `durationInDays` is kept alongside `planId`:**
Plan duration could change after a membership is created. Retaining `durationInDays` on the membership record preserves the duration that was in effect at purchase time, independent of any future plan edits.

---

### Attendance
Check-in and check-out records. Schema unchanged from V1 — fixes are in application code (Phase 2).

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| clientId | String | FK → Client |
| visitType | VisitType | MEMBER or WALK_IN — **must be set explicitly in every server action (Phase 2 fix)** |
| timeIn | DateTime | Default: now() |
| timeOut | DateTime? | Optional — set when client checks out |
| createdAt | DateTime | Default: now() |

Indexes: `clientId`, `timeIn`

**Known issue carried forward from V1:** `visitType` is defined but never populated by any current server action. This is a code fix (Phase 2), not a schema change.

---

### Payment
Financial transaction records.

| Field | Type | V2 Change | Notes |
|---|---|---|---|
| id | String (CUID) | — | Primary key |
| clientId | String | — | FK → Client |
| amount | Decimal(10,2) | — | Amount collected |
| type | PaymentType | — | MEMBERSHIP or WALK_IN |
| paymentMethod | PaymentMethod | **NEW** | CASH, GCASH, or PAYMAYA. `@default(CASH)` applied to all pre-migration rows |
| status | PaymentStatus | — | Default: PAID. Other statuses (PENDING, FAILED, REFUNDED) become accessible via ADMIN edit in Phase 3 |
| notes | String? | **NEW** | Optional staff annotation |
| createdAt | DateTime | — | Default: now() |
| updatedAt | DateTime | — | Auto-updated |

**Migration note for `paymentMethod`:** All existing payment rows receive `paymentMethod = CASH` during the V2 migration. This is a documented assumption — early-stage gym payments are presumed to be cash. See `docs/adr/ADR-004.md`.

---

### GymSettings
Singleton configuration record for the gym.

| Field | Type | V2 Change | Notes |
|---|---|---|---|
| id | String | — | Fixed: `"default-settings"` — intentional singleton pattern |
| gymName | String | **NEW** | Default: "Block23 Gym". Used in report headers |
| address | String? | **NEW** | Optional full gym address |
| contactEmail | String? | **NEW** | Optional. Used for future email notifications |
| contactPhone | String? | **NEW** | Optional. Displayed on reports and portal |
| defaultMonthlyFee | Decimal(10,2) | — | Default: 1200. Referenced by membership creation flows after Phase 5 |
| defaultWalkInFee | Decimal(10,2) | — | Default: 100. Referenced by attendance check-in after Phase 3 |
| walkInActiveDays | Int | **NEW** | Default: 7. Replaces magic number hardcoded in `client-status.ts` |
| createdAt | DateTime | — | Default: now() |
| updatedAt | DateTime | — | Auto-updated |

**Singleton pattern:** Always access via `prisma.gymSettings.findUniqueOrThrow({ where: { id: "default-settings" } })`. Never use `findFirst()`.

**Note:** `defaultMonthlyFee` is kept for backward compatibility. Once `MembershipPlan` is fully in use (Phase 5), this field becomes redundant. It will be evaluated for removal in a future phase.

---

### AuditLog
**New in V2.** Partial audit trail covering client deletions and payment changes.

| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | Primary key |
| userId | String? | FK → User. Nullable — set to null if the user record is deleted (SetNull referential action) |
| action | AuditAction | DELETE_CLIENT or EDIT_PAYMENT |
| entityType | String | e.g., "Client", "Payment" |
| entityId | String | ID of the affected record |
| beforeState | Json? | Snapshot of the record immediately before the change |
| createdAt | DateTime | Default: now(). No `updatedAt` — audit logs are immutable |

**Immutability:** Audit log records are never updated or deleted via application code. No UPDATE or DELETE operations are permitted on this table.

**Referential action on User:** `onDelete: SetNull` — if a staff account is removed, existing audit log entries retain their data but `userId` becomes null. The UI displays these as "Deleted User."

**See:** `docs/adr/ADR-003.md`

---

## Relationships

```
User
  └── Account[]           (1:many, cascade delete)
  └── Session[]           (1:many, cascade delete)
  └── AuditLog[]          (1:many, SetNull on user delete)     ← NEW

MembershipPlan
  └── Membership[]        (1:many, Restrict on plan delete)    ← NEW

Client
  └── Attendance[]        (1:many)
  └── Payment[]           (1:many)
  └── Membership[]        (1:many)
```

---

## V2 Migration Summary

A single Prisma migration covers all Phase 1 schema changes:

| Change | Type | Risk |
|---|---|---|
| Add `User.deletedAt DateTime?` | Additive | None — nullable |
| Add `MembershipPlan` model | Additive | None — new table |
| Add `Membership.planId String?` | Additive | None — nullable FK |
| Add `Client.deletedAt DateTime?` | Additive | None — nullable |
| Add `PaymentMethod` enum | Additive | None — new enum |
| Add `Payment.paymentMethod PaymentMethod @default(CASH)` | Additive with default | Low — default fills existing rows |
| Add `Payment.notes String?` | Additive | None — nullable |
| Add `AuditAction` enum | Additive | None — new enum |
| Add `AuditLog` model | Additive | None — new table |
| Extend `GymSettings` with 6 new fields | Additive with defaults | Low — nullables and defaults fill existing row |

All changes are additive. No existing column is modified or dropped. The migration is safe to run against a database with existing data.

---

## Seed Data (V2)

`prisma/seed.ts` must create the following records on a fresh database:

**User** (unchanged)
- Email: `admin@block23gym.com` / Password: `admin123` / Role: `ADMIN`

**GymSettings** (updated)
- id: `"default-settings"`
- gymName: `"Block23 Gym"`
- defaultMonthlyFee: `1200`
- defaultWalkInFee: `100`
- walkInActiveDays: `7`

**MembershipPlan** (new — three default plans)

| name | durationInDays | price | sortOrder |
|---|---|---|---|
| 1 Month | 30 | 1200.00 | 1 |
| 2 Months | 60 | 2400.00 | 2 |
| 3 Months | 90 | 3600.00 | 3 |

---

## Future Schema (Post-MVP)

These models are not in Phase 1 but are documented here so V2 design does not create structural conflicts.

### LoyaltyTransaction

| Field | Planned Type | Notes |
|---|---|---|
| id | String (CUID) | — |
| clientId | String | FK → Client |
| points | Int | Positive = earned, negative = redeemed |
| reason | String | e.g., "CHECK_IN", "MEMBERSHIP_PURCHASE", "REDEMPTION" |
| createdAt | DateTime | — |

Points balance = `SUM(points)` across all client transactions.

### ClientPortalUser

When a client-facing portal or mobile app is built, clients need their own authentication separate from staff `User` accounts. This model will be a new entity — it does not extend `User`.
