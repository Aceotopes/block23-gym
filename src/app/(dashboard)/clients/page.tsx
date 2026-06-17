import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { ClientsTable } from "@/components/clients/clients-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ClientSearch } from "@/components/clients/client-search";
import { ClientToolbar } from "@/components/clients/client-toolbar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  searchParams: Promise<{
    search?: string;

    type?: string;
    status?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const { search, type, status } = await searchParams;
  const where: Prisma.ClientWhereInput = search
    ? {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ],
      }
    : {};

  const clients = await prisma.client.findMany({
    where,

    include: {
      memberships: {
        select: {
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          amountPaid: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      attendances: {
        select: {
          id: true,
          timeIn: true,
        },

        orderBy: {
          timeIn: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  // PRISMA SCHEMA SERIALIZED FOR AMOUNT PAID
  const serializedClients = clients.map((client) => ({
    ...client,

    memberships: client.memberships.map((membership) => ({
      ...membership,

      amountPaid: Number(membership.amountPaid),
    })),
  }));

  // FILTERS
  let filteredClients = serializedClients;
  // TYPE FILTER MEMBER | WALK IN
  if (type === "MEMBER") {
    filteredClients = filteredClients.filter(
      (client) => client.memberships.length > 0
    );
  }
  if (type === "WALK_IN") {
    filteredClients = filteredClients.filter(
      (client) => client.memberships.length === 0
    );
  }
  // STATUS FILTER ACTIVE | EXPIRED
  if (status === "ACTIVE") {
    filteredClients = filteredClients.filter((client) => {
      const latestMembership = client.memberships[0];

      return latestMembership?.status === "ACTIVE";
    });
  }

  if (status === "EXPIRED") {
    filteredClients = filteredClients.filter((client) => {
      const latestMembership = client.memberships[0];

      return latestMembership?.status === "EXPIRED";
    });
  }
  return (
    <div className="space-y-6">
      <div className=" flex items-center justify-between ">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your gym members and walk-ins
          </p>
        </div>
        <div>
          <CreateClientDialog />
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">...</div>

      {/* Management Card */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <ClientSearch />

            <ClientToolbar />
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredClients.length} client
            {filteredClients.length !== 1 ? "s" : ""} found
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2"></div>
          </div>
          <ClientsTable clients={filteredClients} />
        </CardContent>
      </Card>
    </div>
  );
}
