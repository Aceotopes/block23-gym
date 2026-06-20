type Summary = {
  total: number;
  cash: number;
  gcash: number;
  paymaya: number;
  membershipCount: number;
  walkInCount: number;
};

export function PaymentsSummary({ summary }: { summary: Summary }) {
  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Today&apos;s Collection</p>
        <p className="text-3xl font-bold">
          ₱{summary.total.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {summary.membershipCount} membership
          {summary.membershipCount !== 1 ? "s" : ""} &middot;{" "}
          {summary.walkInCount} walk-in
          {summary.walkInCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Cash", amount: summary.cash },
          { label: "GCash", amount: summary.gcash },
          { label: "PayMaya", amount: summary.paymaya },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-semibold">
              ₱{m.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
