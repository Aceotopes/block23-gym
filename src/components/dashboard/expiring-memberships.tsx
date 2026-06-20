import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExpiringMembership = {
  id: string;
  endDate: Date;
  client: { firstName: string; lastName: string };
};

type Props = {
  memberships: ExpiringMembership[];
};

function DaysLeftBadge({ days }: { days: number }) {
  if (days <= 7) return <Badge variant="destructive">{days}d left</Badge>;
  if (days <= 14) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{days}d left</Badge>;
  return <Badge variant="secondary">{days}d left</Badge>;
}

export function ExpiringMemberships({ memberships }: Props) {
  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Expiring Soon</CardTitle>
        <p className="text-xs text-muted-foreground">Members expiring within 30 days</p>
      </CardHeader>
      <CardContent className="p-0">
        {memberships.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No memberships expiring in the next 30 days.
          </p>
        ) : (
          <ul className="divide-y">
            {memberships.map((m) => {
              const days = differenceInDays(m.endDate, now);
              return (
                <li key={m.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm font-medium">
                    {m.client.firstName} {m.client.lastName}
                  </span>
                  <DaysLeftBadge days={Math.max(0, days)} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
