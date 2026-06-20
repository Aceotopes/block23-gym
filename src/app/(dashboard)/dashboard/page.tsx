import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  addDays,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { ExpiringMemberships } from "@/components/dashboard/expiring-memberships";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const last30Start = startOfDay(subDays(now, 29));
  const last12Start = startOfMonth(subMonths(now, 11));

  const [
    todayAttendance,
    activeMemberCount,
    walkInsThisMonth,
    currentMonthPayments,
    prevMonthPayments,
    expiringRaw,
    attendanceTrendRaw,
    revenueTrendRaw,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: { timeIn: { gte: todayStart, lte: todayEnd } },
      select: { visitType: true },
    }),
    prisma.membership.count({
      where: {
        status: "ACTIVE",
        endDate: { gt: now },
        client: { deletedAt: null },
      },
    }),
    prisma.attendance.count({
      where: {
        visitType: "WALK_IN",
        timeIn: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      select: { amount: true },
    }),
    prisma.membership.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: addDays(now, 30) },
        client: { deletedAt: null },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    }),
    prisma.attendance.findMany({
      where: { timeIn: { gte: last30Start, lte: todayEnd } },
      select: { timeIn: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: last12Start, lte: monthEnd },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // KPI derivations
  const todayMembers = todayAttendance.filter((a) => a.visitType === "MEMBER").length;
  const todayWalkIns = todayAttendance.filter((a) => a.visitType === "WALK_IN").length;
  const todayTotal = todayAttendance.length;

  const currentMonthRevenue = currentMonthPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const prevMonthRevenue = prevMonthPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const revenueDelta = currentMonthRevenue - prevMonthRevenue;
  const revenueDeltaPct =
    prevMonthRevenue > 0
      ? Math.round((revenueDelta / prevMonthRevenue) * 100)
      : null;

  // Attendance trend — fill every day in the last 30 days
  const attendanceByDay = new Map<string, number>();
  for (const record of attendanceTrendRaw) {
    const key = format(record.timeIn, "MM/dd");
    attendanceByDay.set(key, (attendanceByDay.get(key) ?? 0) + 1);
  }
  const attendanceTrendData = eachDayOfInterval({
    start: last30Start,
    end: now,
  }).map((day) => {
    const key = format(day, "MM/dd");
    return { date: key, count: attendanceByDay.get(key) ?? 0 };
  });

  // Revenue trend — fill every month in the last 12 months
  const revenueByMonth = new Map<string, number>();
  for (const record of revenueTrendRaw) {
    const key = format(record.createdAt, "MMM yy");
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(record.amount));
  }
  const revenueTrendData = eachMonthOfInterval({
    start: last12Start,
    end: now,
  }).map((month) => {
    const key = format(month, "MMM yy");
    return { month: key, revenue: revenueByMonth.get(key) ?? 0 };
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DashboardKpiCards
        todayTotal={todayTotal}
        todayMembers={todayMembers}
        todayWalkIns={todayWalkIns}
        activeMemberCount={activeMemberCount}
        walkInsThisMonth={walkInsThisMonth}
        currentMonthRevenue={currentMonthRevenue}
        revenueDelta={revenueDelta}
        revenueDeltaPct={revenueDeltaPct}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceChart data={attendanceTrendData} />
        <RevenueChart data={revenueTrendData} />
      </div>

      <ExpiringMemberships memberships={expiringRaw} />
    </div>
  );
}
