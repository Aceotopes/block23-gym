import { prisma } from "@/lib/prisma";

import { ClientsTable } from "@/components/clients/clients-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>

        <p className="text-muted-foreground">Manage gym clients</p>
      </div>

      <CreateClientDialog />
      <ClientsTable clients={serializedClients} />
    </div>
  );
}
