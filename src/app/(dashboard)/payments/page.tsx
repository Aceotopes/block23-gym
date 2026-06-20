import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

import { PaymentsSummary } from "@/components/payments/payments-summary";
import { PaymentsFilter } from "@/components/payments/payments-filter";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Card, CardContent } from "@/components/ui/card";

const VALID_PERIODS = ["today", "week", "month"] as const;
type Period = (typeof VALID_PERIODS)[number];

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "today";

  const now = new Date();
  const { start: periodStart, end: periodEnd } = getPeriodRange(period);

  const [todayPayments, historyPayments, session] = await Promise.all([
    prisma.payment.findMany({
      where: {
        createdAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      select: { amount: true, type: true, paymentMethod: true, status: true },
    }),
    prisma.payment.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    auth(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  const paidToday = todayPayments.filter((p) => p.status === "PAID");
  const summary = {
    total: paidToday.reduce((sum, p) => sum + Number(p.amount), 0),
    cash: paidToday
      .filter((p) => p.paymentMethod === "CASH")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    gcash: paidToday
      .filter((p) => p.paymentMethod === "GCASH")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    paymaya: paidToday
      .filter((p) => p.paymentMethod === "PAYMAYA")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    membershipCount: paidToday.filter((p) => p.type === "MEMBERSHIP").length,
    walkInCount: paidToday.filter((p) => p.type === "WALK_IN").length,
  };

  const payments = historyPayments.map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          Transaction history and daily revenue summary
        </p>
      </div>

      <PaymentsSummary summary={summary} />

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {payments.length} transaction
              {payments.length !== 1 ? "s" : ""} &mdash;{" "}
              {PERIOD_LABELS[period]}
            </p>
            <PaymentsFilter currentPeriod={period} />
          </div>
          <PaymentsTable payments={payments} isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
