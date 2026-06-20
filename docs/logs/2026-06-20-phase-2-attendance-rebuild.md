# Development Log — Phase 2: Attendance Module Rebuild
**Date:** 2026-06-20
**Session type:** Implementation
**Branch:** main
**Builds on:** Phase 1 (commit `0359e15`)

---

## Overview

Phase 2 rebuilds the attendance module from the ground up. The previous implementation was broken in two critical ways (ATT-01, ATT-02 from `docs/TECHNICAL_DEBT.md`): every check-in created a brand-new client record regardless of whether the person had visited before, and the `visitType` field on the `Attendance` model was never set by any server action.

The rebuild introduces a search-first check-in flow. Staff now search for an existing client by name or phone, select them from a live results list, and confirm. If the person is not in the system, a "New Walk-In" path creates them as a new client record — but only if the name doesn't already match an existing record, preventing the duplicate-creation bug.

The `checkIn` server action is now the single entry point for all check-in scenarios. It derives `visitType` from the client's current membership status in the database, creates a walk-in payment when needed, and guards against double check-in.

---

## Files Changed

| File | Change Type | Summary |
|---|---|---|
| `src/actions/attendance.ts` | Rewritten | `searchClients` + unified `checkIn` action; `timeOutAttendance` retained |
| `src/components/attendance/attendance-form.tsx` | Rewritten | Search → confirm/new-walkin flow with debounced lookup |
| `src/components/attendance/attendance-table.tsx` | Modified | Added Visit Type column; improved formatting; empty state |
| `src/app/(dashboard)/attendance/page.tsx` | Modified | Explicit field select; live count subtitle |

---

## Server Action Changes — `src/actions/attendance.ts`

The file previously contained two functions: `createWalkInAttendance` (broken) and `timeOutAttendance` (correct). Phase 2 replaces the first with two new functions and retains the second.

### `searchClients(query: string): Promise<ClientSearchResult[]>`

New exported server action. Called from `AttendanceForm` on each debounced keystroke.

```typescript
export type ClientSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActiveMember: boolean;
  isExpiredMember: boolean;
  membershipEndDate: Date | null;
};
```

**Implementation details:**
- Minimum query length of 2 characters before hitting the database
- Searches `firstName`, `lastName` (case-insensitive `contains`), and `phone` (`contains`)
- Filters `deletedAt: null` — soft-deleted clients never appear in search results
- Includes only the latest membership (`orderBy: createdAt desc, take: 1`) to determine status
- `isActiveMember`: membership exists, status is ACTIVE, and `endDate > now`
- `isExpiredMember`: membership exists, but not active (catches EXPIRED and CANCELLED)
- Returns up to 10 results ordered by first name then last name
- `membershipEndDate` is passed to the UI so the confirm screen can show "Expires Dec 31, 2026" for active members

**Why a server action for search (not a route handler)?**
The rest of the app uses server actions exclusively. Adding a search route handler just for this feature would be inconsistent. Server actions as async functions called from client components are fully supported in Next.js App Router and work well for debounced search patterns.

---

### `checkIn(data: CheckInInput)`

New exported server action. Unified entry point for all check-in scenarios.

```typescript
export type CheckInInput =
  | { clientId: string; paymentMethod?: "CASH" | "GCASH" | "PAYMAYA" }
  | { firstName: string; lastName: string; phone?: string; paymentMethod: "CASH" | "GCASH" | "PAYMAYA" };
```

The discriminated union separates the two paths:
- `clientId` branch: existing client selected from search
- `firstName` branch: new walk-in entered manually

**Full transaction sequence:**

**Step 1 — Resolve client:**

_Existing client path (`clientId` in data):_
```typescript
const client = await tx.client.findUniqueOrThrow({
  where: { id: data.clientId, deletedAt: null },
  ...
});
```
`findUniqueOrThrow` fails loudly if the client was soft-deleted between search and submit (race condition guard).

_New walk-in path:_
```typescript
const firstName = formatName(data.firstName);
const lastName = data.lastName ? formatName(data.lastName) : "";

const existing = await tx.client.findFirst({
  where: { firstName, lastName, deletedAt: null },
});
```
Names are formatted through `formatName()` before the duplicate check — same normalisation used in `client.ts` actions, so "juan santos" and "Juan Santos" resolve to the same record.

If a name match is found, the existing client is reused rather than creating a duplicate. This is the core fix for ATT-01: the system now prevents multiple client records for the same person.

**Step 2 — Guard against double check-in:**
```typescript
const alreadyIn = await tx.attendance.findFirst({
  where: { clientId, timeOut: null },
});
if (alreadyIn) throw new Error(`${displayName} is already checked in`);
```
If a client is already checked in (has an attendance record with `timeOut: null`), the action throws. The error message includes the client's name and is surfaced to staff via Sonner toast.

**Step 3 — Determine visit type:**
```typescript
const latestMembership = await tx.membership.findFirst({
  where: { clientId },
  orderBy: { createdAt: "desc" },
  select: { status: true, endDate: true },
});

const isActiveMember = Boolean(
  latestMembership &&
  latestMembership.status === "ACTIVE" &&
  latestMembership.endDate > new Date()
);

const visitType = isActiveMember ? "MEMBER" : "WALK_IN";
```

This is re-derived from the database inside the transaction — not taken from the UI's `isActiveMember` flag. This is intentional: a membership could expire in the seconds between the staff searching and confirming. The action always reflects the true current state.

This also resolves the edge case where an expired member is checked in via the search form: the UI shows "Expired" and prompts for payment method. The action re-validates and confirms walk-in + fee.

**Step 4 — Create attendance record:**
```typescript
await tx.attendance.create({ data: { clientId, visitType } });
```
`visitType` is now always explicitly set. This resolves ATT-02.

**Step 5 — Create walk-in payment (conditional):**
```typescript
if (visitType === "WALK_IN") {
  const pm = data.paymentMethod;
  if (!pm) throw new Error("Payment method is required for walk-ins");

  await tx.payment.create({
    data: {
      clientId,
      amount: WALK_IN_FEE,
      type: "WALK_IN",
      status: "PAID",
      paymentMethod: pm,
    },
  });
}
```
Walk-in payments now include `paymentMethod` (CASH/GCASH/PAYMAYA) — the `Payment.paymentMethod` field added in Phase 1 is now used for the first time. Member check-ins create no payment record.

`WALK_IN_FEE = 100` is a module-level constant. Phase 3 will replace this with a read from `GymSettings.defaultWalkInFee`.

---

### `timeOutAttendance(attendanceId: string)` — retained, minor fix

The function logic is unchanged. Added `revalidatePath("/attendance")` which was missing — without it, the live table did not reflect the time-out without a manual page reload.

---

## UI Changes — `src/components/attendance/attendance-form.tsx`

Complete rewrite. The previous form had three text inputs and a submit button. The new form has three distinct modes managed with a discriminated union state type.

```typescript
type Mode =
  | { type: "search" }
  | { type: "confirm"; client: ClientSearchResult }
  | { type: "new-walkin" };
```

### Mode: `search` (default)

Displayed on mount and after each successful check-in (via `resetForm()`).

**Search input:**
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [debouncedQuery] = useDebounce(searchQuery, 350);
```
`use-debounce` (already in the project) debounces at 350ms. The search call only fires when the debounced value changes, not on every keystroke.

**Search effect:**
```typescript
useEffect(() => {
  if (debouncedQuery.trim().length < 2) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }

  let cancelled = false;
  setIsSearching(true);

  searchClients(debouncedQuery)
    .then((data) => { if (!cancelled) setSearchResults(data); })
    .catch(() => { if (!cancelled) setSearchResults([]); })
    .finally(() => { if (!cancelled) setIsSearching(false); });

  return () => { cancelled = true; };
}, [debouncedQuery]);
```

The `cancelled` flag handles race conditions: if the user types quickly, earlier in-flight requests are ignored when their promise resolves — only the latest query's results are applied to state. This is important because server action calls are not cancellable, so multiple requests can be in-flight simultaneously.

**Results list:** Each result renders the client's name, phone, and a `ClientStatusBadge` (Active Member / Expired / Walk-In). Clicking any result transitions to `confirm` mode.

**"New Walk-In" button:** Always visible below the results. Transitions to `new-walkin` mode. If there is text in the search box when this button is clicked, it is pre-filled as the `firstName` in the new walk-in form — a small convenience for the common case where staff typed a name, found no match, and want to register them.

### Mode: `confirm` (existing client selected)

**Client info card:** Shows name, phone, expiry date (for active members), and status badge.

**Check-in type summary:**
- Active member: "Member Check-In — No payment required"
- Expired member: "Walk-In (expired member) — Fee: ₱100.00" + payment method selector
- Walk-in: "Walk-In — Fee: ₱100.00" + payment method selector

The `PaymentMethodSelector` is a shared sub-component rendering 3 toggle buttons (Cash / GCash / PayMaya). Selected button uses `variant="default"`, unselected use `variant="outline"`.

**"Change client" link:** Calls `resetForm()`, returning to search mode with state cleared.

**Client-side validation before submission:**
- Walk-in/expired client: `paymentMethod` must be selected (toast error if not)
- No validation needed for active members (no payment required)

### Mode: `new-walkin`

Three inputs: First Name (required, auto-focused), Last Name (optional), Phone (optional).

Always shows the payment method selector and walk-in fee summary.

**Client-side validation:**
- `firstName.trim()` must not be empty
- `paymentMethod` must be selected

**"Back to search" link:** Calls `resetForm()`, returns to search mode.

### Post-check-in state reset

After a successful `checkIn()` call:
1. `toast.success("Checked in successfully")` is shown
2. `resetForm()` is called — all state cleared, returns to search mode
3. `router.refresh()` is called — triggers re-fetch of the server component data (attendance table)

The `revalidatePath("/attendance")` in the action ensures the Next.js cache is also invalidated for any navigation-based re-render.

---

## UI Changes — `src/components/attendance/attendance-table.tsx`

### Visit Type column added

New column between Phone and Time In:
```tsx
<TableHead>Type</TableHead>
// ...
<TableCell>
  <VisitTypeBadge visitType={attendance.visitType} />
</TableCell>
```

`VisitTypeBadge` is a local helper:
- `"MEMBER"` → `<Badge variant="default">Member</Badge>`
- `"WALK_IN"` → `<Badge variant="secondary">Walk-In</Badge>`

### Time In formatting

Changed from `attendance.timeIn.toLocaleString()` (locale-dependent, full date) to `format(timeIn, "h:mm a")` from date-fns. The live table shows only today's attendances, so showing "9:45 AM" is more readable than "6/20/2026, 9:45:00 AM".

### Empty state

Added an empty state for when no one is currently checked in:
```tsx
if (attendances.length === 0) {
  return (
    <div className="rounded-xl border bg-background py-16 text-center text-sm text-muted-foreground">
      No one is currently checked in.
    </div>
  );
}
```

Previously the table rendered an empty `<tbody>` with no visual indication, which looked broken.

### Type correction

`client.lastName` was typed as `string | null` in the old component. `Client.lastName` is `String` (non-nullable) in the schema. Corrected to `string`.

---

## Page Changes — `src/app/(dashboard)/attendance/page.tsx`

### Switched from `include` to `select`

**Before:**
```typescript
include: { client: true }
```

**After:**
```typescript
select: {
  id: true,
  visitType: true,
  timeIn: true,
  client: {
    select: { firstName: true, lastName: true, phone: true },
  },
}
```

`include: { client: true }` returned all client fields (including `deletedAt`, `createdAt`, `updatedAt`, all memberships, payments — none of which the table needs). The explicit `select` is more efficient and makes the data contract clear.

### Live count subtitle

**Before:** Static "Live gym attendance monitoring"

**After:** `"3 people currently in the gym"` / `"1 person currently in the gym"` / `"No one is currently checked in"` — derived from `attendances.length`.

---

## Technical Debt Resolved

| Debt Item | Status |
|---|---|
| ATT-01 — Attendance creates duplicate client records | **Resolved** — search-first flow; name-match deduplication in new walk-in path |
| ATT-02 — `Attendance.visitType` never set | **Resolved** — `checkIn()` explicitly sets `visitType` in every attendance create |

**Partially addressed (not resolved):**

| Debt Item | Notes |
|---|---|
| ATT-03 — Walk-in fee hardcoded | `WALK_IN_FEE = 100` constant in `attendance.ts`; Phase 3 will connect to `GymSettings.defaultWalkInFee` |
| CODE-06 — Decimal serialization | `Payment.amount` is still a Prisma Decimal; not surfaced in the attendance UI, so not a concern for this phase |

---

## What Is NOT Changed

Per Phase 2 scope boundary:
- No AuditLog entries for check-in events (not a confirmed requirement)
- No attendance history view (full history with date filters is Phase 7)
- Walk-in fee still hardcoded at ₱100 (Phase 3 connects to GymSettings)
- `Membership.planId` still not set in any check-in path (not applicable here)
- `timeOutAttendance` is unchanged beyond adding `revalidatePath`
- No changes to the clients module, payments module, or any other page

---

## Next Phase

**Phase 3 — Payments Page**

The `Payment` model now has `paymentMethod` populated for all walk-in payments created via Phase 2. The payment table data is ready. Phase 3 builds:
- Full transaction history table (paginated, date-range filter)
- Daily cash summary card (total by method)
- Per-client payment history (from the clients page actions menu)
- ADMIN-only payment edit (status + method)
- Walk-in and membership fee connections to `GymSettings`
