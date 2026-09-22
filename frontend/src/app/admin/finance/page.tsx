"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { SuperOnly } from "@/features/admin/super-only";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";

type Rule = { id: string; serviceType: string; percent: string };
type Payout = { id: string; amount: string; status: string; user?: { fullName: string } };

export default function AdminFinancePage() {
  const token = useAdminAuth((s) => s.accessToken);
  const [rules, setRules] = useState<Rule[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (!token) return;
    api<Rule[]>("/commission/rules", { token }).then((r) => setRules(r.data ?? []));
    api<Payout[]>("/payouts", { token }).then((r) => setPayouts(r.data ?? []));
  }, [token]);

  return (
    <SuperOnly>
    <div>
      <AdminHeader title="Finance" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-base font-semibold">Commission rules</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {rules.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No rules yet.</p>
            ) : (
              rules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{rule.serviceType.replaceAll("_", " ")}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{rule.percent}%</span>
                </li>
              ))
            )}
          </ul>
        </AdminCard>
        <AdminCard>
          <h2 className="text-base font-semibold">Payout queue</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {payouts.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No payouts waiting.</p>
            ) : (
              payouts.map((payout) => (
                <li key={payout.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{payout.user?.fullName ?? payout.id}</span>
                  <span className="text-slate-500">
                    ₹{payout.amount} · {payout.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </AdminCard>
      </div>
    </div>
    </SuperOnly>
  );
}
