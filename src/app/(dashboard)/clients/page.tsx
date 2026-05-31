import { prisma } from "@/lib/prisma";

import { ClientsTable } from "@/components/clients/clients-table";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      memberships: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>

        <p className="text-muted-foreground">Manage gym clients</p>
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
