# Project Overview — Block23 Gym Management System

## What Is This?

Block23 Gym Management System is a staff-operated internal web application for managing a gym's daily operations. It handles client registration, membership management, attendance tracking, and payment recording. It is designed for use by gym staff and administrators on a single-location gym.

The system is built as a private internal tool — clients do not log in or self-register. All interactions are performed by authorized staff members through a protected web interface.

---

## Who Uses It?

| Role | Capabilities |
|---|---|
| Admin | Full access: create/edit/delete clients, configure settings, manage staff accounts, view and edit payments, view all reports |
| Staff | Create and edit clients, check in clients, renew memberships, view all clients and payments |

Role-based access control is defined and planned but **not yet enforced** in the current codebase.

---

## Core Features

### Clients
Register and manage all gym visitors — both members (paid subscriptions) and walk-in visitors (pay-per-visit). Client type is not stored explicitly; it is derived at runtime based on whether the client has a membership record.

### Memberships
Create, renew, and track membership subscriptions. Membership plans will be configurable by the admin (name, duration, price). Currently, plans are hardcoded as 1, 2, or 3 months at ₱1,200/month. A `MembershipPlan` model is planned as part of the next schema redesign.

### Attendance
Record client check-ins and check-outs. The intended flow:
- Staff searches for a client by name or phone
- Selects the matching client from results
- Records the check-in against that existing client record

Walk-in visitors are recognized by name and phone number. Returning walk-ins are matched to their existing record rather than creating duplicates. If a returning member's membership is expired, they can still check in but are recorded as a walk-in visit and charged the walk-in fee.

**Current status: Broken.** The attendance module needs to be rebuilt before it is usable. See `TECHNICAL_DEBT.md` for details.

### Payments
Record and track all financial transactions — membership payments and walk-in fees. Payment method is recorded at the time of collection (cash, GCash, or PayMaya).

**Current status: Not implemented.** Only the database model and automatic payment record creation (during membership and check-in flows) are in place.

### Dashboard
The main landing page after login. Will display:
- Today's attendance count
- Active member count
- Memberships expiring within the next 7–30 days
- Monthly revenue summary
- Attendance and revenue trend charts

**Current status: Not implemented.** The page currently shows only a logout button.

### Settings
Admin-only configuration page. Will include:
- Gym profile (name, address, contact information)
- Membership plan management (create, edit, archive plans)
- Walk-in fee configuration
- Walk-in active window (number of days a walk-in is considered active)

**Current status: Not implemented.**

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.4 |
| Database | PostgreSQL (Neon, ap-southeast-1) | — |
| ORM | Prisma | ^7.8.0 |
| Authentication | NextAuth.js | 5.0.0-beta.31 (beta) |
| UI Components | shadcn/ui + Radix UI | ^4.7.0 |
| Styling | Tailwind CSS | ^4 (CSS-first) |
| Validation | Zod | ^4.4.3 |
| Date utilities | date-fns | ^4.4.0 |
| Notifications | Sonner | ^2.0.7 |
| Icons | Lucide React | ^1.16.0 |

---

## Architecture Overview

### Routing
The application uses Next.js App Router with two route groups:
- `(auth)` — unauthenticated routes (login page)
- `(dashboard)` — protected routes, guarded by a session check in the group layout

### Data Mutations
All data mutations use **Next.js Server Actions** exclusively. There are no REST API endpoints other than the NextAuth authentication handler. This is appropriate for a staff-operated internal tool but will require an API layer if a client-facing portal or mobile app is developed in the future.

### Authentication
JWT-based sessions using NextAuth.js v5 (beta) with an email/password credentials provider. Passwords are hashed with bcryptjs. The session includes the user's `id` and `role`.

### Database Access
Prisma 7 with a runtime adapter (`@prisma/adapter-pg`) connecting to Neon PostgreSQL. A singleton Prisma client is maintained in `src/lib/prisma.ts`.

### Styling
Tailwind CSS v4 (CSS-first) with shadcn/ui components. Design tokens are defined as CSS custom properties using the `oklch()` color space in `src/app/globals.css`. Both light and dark mode are supported.

---

## Feature Status Summary

| Feature | Status | Completeness |
|---|---|---|
| Authentication | Working | ~95% |
| Clients CRUD | Complete | ~100% |
| Membership lifecycle | Working | ~90% |
| Attendance check-in | Broken | ~40% |
| Payments UI | Not started | 0% |
| Dashboard | Not started | ~5% |
| Settings | Not started | 0% |
| GymSettings integration | Not started | 0% |
| Role enforcement (RBAC) | Not started | 0% |
| Audit logging | Not started | 0% |
| CSV/PDF exports | Not started | 0% |

---

## Deployment

| Environment | Platform | Database |
|---|---|---|
| Production | Vercel | Neon PostgreSQL (ap-southeast-1) |
| Staging | Vercel (separate project) | Neon (separate staging DB) |
| Local dev | `npm run dev` | Neon (shared dev DB or local) |

CI/CD pipeline (GitHub Actions) is planned with lint, type-check, and build verification on every pull request.

---

## Resale Model

The system is designed to be sold to other gym owners. Each customer receives a fully separate deployment with its own database — there is no shared multi-tenant infrastructure. The schema is single-tenant by design.

---

## Future Roadmap

1. Schema redesign (MembershipPlan model, soft delete, payment method field, audit log)
2. Attendance module rebuild (search-based check-in)
3. Payments page (full transaction history, daily summary, method recording)
4. Dashboard (KPIs + trend charts)
5. Settings page (plans, gym profile, fee configuration)
6. Role enforcement (RBAC on server actions and routes)
7. CI/CD pipeline (GitHub Actions)
8. UI/design system improvements
9. Client-facing portal or mobile app (requires REST/tRPC API layer)
10. Loyalty and rewards system

See `docs/ROADMAP.md` for the full phased plan.
