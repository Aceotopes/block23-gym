import { Users, UserCheck, UserPlus, UserX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { getClientStatus, getClientType } from "@/lib/client-status";

type Client = {
  memberships: {
    endDate: Date;
  }[];

  attendances: {
    timeIn: Date;
  }[];
};

type Props = {
  clients: Client[];
};

type KpiCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
};

function KpiCard({ title, value, description, icon }: KpiCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientKpiCards({ clients }: Props) {
  const totalClients = clients.length;

  const activeMembers = clients.filter(
    (client) =>
      getClientType(client.memberships.length > 0) === "MEMBER" &&
      getClientStatus(client) === "ACTIVE"
  ).length;

  const walkInClients = clients.filter(
    (client) => getClientType(client.memberships.length > 0) === "WALK_IN"
  ).length;

  const expiredMembers = clients.filter(
    (client) =>
      getClientType(client.memberships.length > 0) === "MEMBER" &&
      getClientStatus(client) === "EXPIRED"
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Clients"
        value={totalClients}
        description="Registered gym clients"
        icon={
          <div className="w-fit rounded-lg bg-blue-500/10 p-3">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        }
      />

      <KpiCard
        title="Active Members"
        value={activeMembers}
        description="Currently enrolled members"
        icon={
          <div className="w-fit rounded-lg bg-green-500/10 p-3">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        }
      />

      <KpiCard
        title="Walk-In Clients"
        value={walkInClients}
        description="Non-member gym clients"
        icon={
          <div className="w-fit rounded-lg bg-orange-500/10 p-3">
            <UserPlus className="h-8 w-8 text-orange-600" />
          </div>
        }
      />

      <KpiCard
        title="Expired Members"
        value={expiredMembers}
        description="Membership renewal required"
        icon={
          <div className="w-fit rounded-lg bg-red-500/10 p-3">
            <UserX className="h-8 w-8 text-red-600" />
          </div>
        }
      />
    </div>
  );
}
