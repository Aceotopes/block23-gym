import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  todayTotal: number;
  todayMembers: number;
  todayWalkIns: number;
  activeMemberCount: number;
  walkInsThisMonth: number;
  currentMonthRevenue: number;
  revenueDelta: number;
  revenueDeltaPct: number | null;
};

export function DashboardKpiCards({
  todayTotal,
  todayMembers,
  todayWalkIns,
  activeMemberCount,
  walkInsThisMonth,
  currentMonthRevenue,
  revenueDelta,
  revenueDeltaPct,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Today&apos;s Attendance</p>
          <p className="text-3xl font-bold mt-1">{todayTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {todayMembers} member{todayMembers !== 1 ? "s" : ""} &middot;{" "}
            {todayWalkIns} walk-in{todayWalkIns !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Active Members</p>
          <p className="text-3xl font-bold mt-1">{activeMemberCount}</p>
          <p className="text-xs text-muted-foreground mt-1">With valid membership</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Walk-ins This Month</p>
          <p className="text-3xl font-bold mt-1">{walkInsThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">Pay-per-visit visitors</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Revenue This Month</p>
          <p className="text-3xl font-bold mt-1">
            &#8369;{currentMonthRevenue.toLocaleString()}
          </p>
          {revenueDeltaPct !== null ? (
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${
                revenueDelta >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {revenueDelta >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {revenueDelta >= 0 ? "+" : ""}
              {revenueDeltaPct}% vs last month
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No data last month</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
