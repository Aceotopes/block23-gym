# Development Log — Phase 3: Payments Page
**Date:** 2026-06-20
**Session type:** Implementation
**Branch:** main
**Builds on:** Phase 2 (commit `c1f4de5` or similar)

---

## Overview

Phase 3 delivers the Payments module and completes the payment recording story across all client flows. The module consists of four major areas:

1. **Full payments page** — transaction history table with date-range filter and daily cash summary
2. **Per-client payment history** — accessible from the clients page actions menu via a dialog
3. **ADMIN-only payment editing** — edit status and payment method; writes AuditLog entry
4. **Payment method recording in membership flows** — `createMember`, `convertToMember`, `renewMembership` now record `paymentMethod`; the three membership dialogs expose a method selector
5. **Walk-in fee from GymSettings** — removes the last hardcoded fee constant (`WALK_IN_FEE = 100`)

---

## Files Changed

| File | Change Type | Summary |
|---|---|---|
| `src/actions/payment.ts` | New | `editPayment` + `getClientPayments` server actions |
| `src/actions/attendance.ts` | Modified | Walk-in fee from GymSettings; removed `WALK_IN_FEE` constant |
| `src/actions/client.ts` | Modified | Added `paymentMethod` param to `createMember`, `convertToMember`, `renewMembership` |
| `src/app/(dashboard)/payments/page.tsx` | Rewritten | Full payments page (summary + filter + history table) |
| `src/app/(dashboard)/attendance/page.tsx` | Modified | Fetches `defaultWalkInFee` from GymSettings; passes to form |
| `src/components/payments/payments-summary.tsx` | New | Daily cash summary card |
| `src/components/payments/payments-filter.tsx` | New | Period filter (Today / This Week / This Month) |
| `src/components/payments/payments-table.tsx` | New | Transaction history table with ADMIN edit trigger |
| `src/components/payments/edit-payment-dialog.tsx` | New | ADMIN-only edit dialog (status + method) |
| `src/components/clients/client-payment-history-dialog.tsx` | New | Per-client payment history dialog |
| `src/components/clients/client-actions-menu.tsx` | Modified | Added "Payment History" menu item |
| `src/components/attendance/attendance-form.tsx` | Modified | Accepts `walkInFee` prop; removed `WALK_IN_FEE` constant |
| `src/components/clients/create-client-dialog.tsx` | Modified | Added `paymentMethod` state + selector (MEMBER tab only) |
| `src/components/clients/renew-membership-dialog.tsx` | Modified | Added `paymentMethod` state + selector |
| `src/components/clients/convert-to-member-dialog.tsx` | Modified | Added `paymentMethod` state + selector |

---

## New Server Actions — `src/actions/payment.ts`

### `editPayment(data)`

ADMIN-only action. Allows editing a payment's `status` and/or `paymentMethod`. Amount is immutable — not accepted as input.

```typescript
export async function editPayment(data: {
  id: string;
  status?: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod?: "CASH" | "GCASH" | "PAYMAYA";
})
```

**Implementation:**
1. Auth check: `session.user.role !== "ADMIN"` throws `"Only admins can edit payment records"`
2. Opens a transaction:
   - `findUniqueOrThrow` on the payment to capture `beforeState`
   - `update` the payment with only the fields provided (spread pattern with conditional spread)
   - Creates an `AuditLog` record with `action: "EDIT_PAYMENT"`, `beforeState` serializing the old record (amount converted to string for JSON compatibility)
3. `revalidatePath("/payments")` invalidates the Next.js cache

**Why a transaction?** Ensures the audit log is always written atomically with the edit. If the update fails, no audit entry is written. If the audit write fails, the update is rolled back. Both happen or neither does.

**Role check at the action level:** RBAC Phase (Phase 6) will add middleware route protection. For now, the server action itself enforces the admin requirement. The payments page also receives `isAdmin` from `auth()` and hides the edit button from non-admins in the UI, but the action is the authoritative guard.

---

### `getClientPayments(clientId)`

```typescript
export type ClientPayment = {
  id: string;
  amount: number;  // serialized from Decimal
  type: "MEMBERSHIP" | "WALK_IN";
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  createdAt: Date;
};

export async function getClientPayments(clientId: string): Promise<ClientPayment[]>
```

Called from `ClientPaymentHistoryDialog` when the user opens the dialog. Returns all payments for the client ordered by `createdAt desc`. Converts `Decimal` amount to `Number` before returning (resolves CODE-06 for this specific return path).

---

## Server Action Changes — `src/actions/attendance.ts`

### Walk-in fee from GymSettings

**Before:**
```typescript
const WALK_IN_FEE = 100;
// ...used inside checkIn transaction
```

**After:**
```typescript
export async function checkIn(data: CheckInInput) {
  const settings = await prisma.gymSettings.findUniqueOrThrow({
    where: { id: "default-settings" },
    select: { defaultWalkInFee: true },
  });
  const walkInFee = Number(settings.defaultWalkInFee);

  await prisma.$transaction(async (tx) => {
    // ... uses walkInFee
  });
}
```

The GymSettings read happens **outside** the transaction. This is intentional: the walk-in fee is a configuration value that changes rarely. Reading it outside the transaction avoids holding the transaction open longer than needed. The tiny risk of a fee change between the GymSettings read and the payment creation is acceptable (the new fee applies on the next check-in).

`defaultWalkInFee` is a Prisma `Decimal` — `Number()` converts it before use. This is consistent with the `Decimal` serialization pattern used elsewhere in the project.

This resolves **ATT-03** (walk-in fee hardcoded) from `docs/TECHNICAL_DEBT.md`.

---

## Server Action Changes — `src/actions/client.ts`

Added `paymentMethod: "CASH" | "GCASH" | "PAYMAYA"` as a required field to three input types:

| Type | Location |
|---|---|
| `CreateMemberInput` | `createMember` |
| Inline type on `convertToMember` data param | `convertToMember` |
| `RenewMembershipInput` | `renewMembership` |

Each corresponding `tx.payment.create` call (or `prisma.payment.create`) now includes `paymentMethod: data.paymentMethod`.

**Before Phase 3:** All membership payments recorded `paymentMethod` as CASH (the schema default), regardless of actual method. The payments page would show misleading "Cash" for GCash or PayMaya transactions.

**After Phase 3:** The staff selects the actual method when registering or renewing a membership. The database records the correct method. The payments page summary and history reflect the true breakdown.

---

## New Page — `src/app/(dashboard)/payments/page.tsx`

Full server component. URL param: `?period=today|week|month` (defaults to `today`).

### Data fetching

Two Prisma queries run in parallel (`Promise.all`):

1. **Today's payments** — used exclusively for the daily summary card; always shows today regardless of the selected period filter
2. **Period payments** — used for the transaction history table; filtered by the selected period

Auth session is also fetched in the same `Promise.all` to determine `isAdmin`.

### Date range computation

```typescript
function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "today":   return { start: startOfDay(now), end: endOfDay(now) };
    case "week":    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":   return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}
```

Week starts on Monday (`weekStartsOn: 1`) — appropriate for business/gym scheduling.

### Summary computation

Computed from today's payments on the server side. Only `PAID` payments count toward the totals — `PENDING`, `FAILED`, and `REFUNDED` are excluded from revenue figures:

```typescript
const paidToday = todayPayments.filter((p) => p.status === "PAID");
const summary = {
  total:            paidToday.reduce((sum, p) => sum + Number(p.amount), 0),
  cash:             paidToday.filter(...CASH).reduce(sum + amount),
  gcash:            paidToday.filter(...GCASH).reduce(sum + amount),
  paymaya:          paidToday.filter(...PAYMAYA).reduce(sum + amount),
  membershipCount:  paidToday.filter(...MEMBERSHIP).length,
  walkInCount:      paidToday.filter(...WALK_IN).length,
};
```

### Decimal serialization

`historyPayments` contains Prisma `Decimal` amounts. Serialized before passing to client components:
```typescript
const payments = historyPayments.map((p) => ({ ...p, amount: Number(p.amount) }));
```

---

## New Components

### `PaymentsSummary` (`src/components/payments/payments-summary.tsx`)

Server component. Receives pre-computed summary data as props. Renders:
- Large "Today's Collection" total
- Membership + walk-in transaction counts
- Row of 3 breakdown cards: Cash / GCash / PayMaya

### `PaymentsFilter` (`src/components/payments/payments-filter.tsx`)

Client component (`"use client"`). Renders 3 period buttons. Active button uses `variant="default"`, inactive uses `variant="outline"`. Navigation via `router.push("/payments?period=...")` — avoids a full page reload while still triggering server component re-render with new `searchParams`.

Receives `currentPeriod` as prop from the server page (avoids `useSearchParams` hook in client component).

### `PaymentsTable` (`src/components/payments/payments-table.tsx`)

Server component. Receives typed payment data and `isAdmin` boolean as props.

Columns: Date (date + time in 2 lines), Client, Type (badge), Method, Amount, Status (badge), Edit button (ADMIN only).

Renders `<EditPaymentDialog>` (client component) per row when `isAdmin === true`. This is a valid pattern: server components can render client components.

Empty state: shown when no payments exist for the selected period.

### `EditPaymentDialog` (`src/components/payments/edit-payment-dialog.tsx`)

Client component. Triggered by a ghost icon button in the table row. Shows:
- Immutable payment info (type + amount) for context
- Status select (PAID / PENDING / FAILED / REFUNDED)
- Payment method select (Cash / GCash / PayMaya)

On submit, calls `editPayment` server action. Toast on success or error. Resets select state to current payment values on open.

### `ClientPaymentHistoryDialog` (`src/components/clients/client-payment-history-dialog.tsx`)

Client component. Triggered from the client actions dropdown menu via a `DropdownMenuItem`. Pattern mirrors existing dialog triggers (`ViewClientDialog`, `RenewMembershipDialog`).

**Lazy loading:** Data is NOT pre-fetched. On `onOpenChange(true)`, calls `getClientPayments(client.id)`. Shows a "Loading..." state until data arrives. This avoids pre-fetching payment data for all clients on the clients page.

Renders payments as a scrollable list (max-height 24rem / 96) with: date, type badge, method label, amount, status badge.

---

## Dialog Changes — Membership Flows

Three dialogs received the same change pattern:

1. New state variable: `const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH" | "PAYMAYA">("CASH")`
2. Reset on dialog close: `setPaymentMethod("CASH")`
3. Payment method selector UI (3 toggle buttons: Cash / GCash / PayMaya)
4. Passed to the server action as `paymentMethod`

**Default is CASH.** This matches the existing schema default (`@default(CASH)`) and the practical reality that most membership payments at a gym are cash. Staff can override to GCash or PayMaya when needed. The attendance form (check-in) requires explicit selection; the membership dialogs default to Cash for lower friction in the common case.

---

## Attendance Form — Walk-In Fee Prop

`AttendanceForm` previously had `const WALK_IN_FEE = 100` hardcoded and displayed it in the UI. Now:

- The component signature changed to `AttendanceForm({ walkInFee }: { walkInFee: number })`
- The constant is removed; `walkInFee` is used everywhere `WALK_IN_FEE` was
- The attendance page fetches `defaultWalkInFee` from GymSettings and passes it as a prop

The GymSettings fetch and the attendance query now run in parallel in the page:
```typescript
const [attendances, settings] = await Promise.all([
  prisma.attendance.findMany({ ... }),
  prisma.gymSettings.findUniqueOrThrow({ where: { id: "default-settings" }, select: { defaultWalkInFee: true } }),
]);
```

---

## Technical Debt Resolved

| Debt Item | Status |
|---|---|
| ATT-03 — Walk-in fee hardcoded | **Resolved** — `checkIn()` reads `GymSettings.defaultWalkInFee`; form displays live value |
| PAY-01 — Payment status always PAID | **Partially resolved** — `editPayment()` allows status correction; new payments still default to PAID as intended |

**Partially addressed (not resolved):**

| Debt Item | Notes |
|---|---|
| MEM-01 — Membership fee hardcoded | Dialogs still default to ₱1200/month; Phase 5 connects to `MembershipPlan` records |
| CODE-06 — Decimal serialization | Resolved for payment actions; still exists in the clients page component |

---

## What Is NOT Changed

Per Phase 3 scope boundary:
- No CSV/PDF export (Phase 7)
- No pagination UI on the payments table — all payments for the selected period are shown. With < 500 clients, period-filtered sets will remain manageable.
- No receipt generation (confirmed not needed)
- `Membership.planId` still not connected — Phase 5
- Walk-in active window in `client-status.ts` still hardcoded at 7 days — Phase 5
- GymSettings `walkInActiveDays` not yet read — Phase 5
- No loading.tsx for the payments page — Phase 9 (UI improvements)

---

## Next Phase

**Phase 4 — Dashboard Analytics**

The `Payment` and `Attendance` models now have complete, reliable data. Phase 4 builds:
- Today's attendance count KPI
- Active member count KPI
- Expiring memberships list (within 7 days)
- Monthly revenue KPI
- Attendance trend graph (last 30 days)
- Revenue trend graph (last 30 days)
