"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { SuperOnly } from "@/features/admin/super-only";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";

type Rule = { id: string; serviceType: string; percent: string };
type Payout = { id: string; amount: string; status: string; user?: { fullName: string } };
type CreditsSetting = { creditsPerOrder: number };

export default function AdminFinancePage() {
  const token = useAdminAuth((s) => s.accessToken);
  const [rules, setRules] = useState<Rule[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [creditsPerOrder, setCreditsPerOrder] = useState("");
  const [creditBusy, setCreditBusy] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditSaved, setCreditSaved] = useState("");

  useEffect(() => {
    if (!token) return;
    api<Rule[]>("/commission/rules", { token }).then((r) => setRules(r.data ?? []));
    api<Payout[]>("/payouts", { token }).then((r) => setPayouts(r.data ?? []));
    api<CreditsSetting>("/admin/vendor-credits/settings", { token })
      .then((r) => setCreditsPerOrder(String(r.data?.creditsPerOrder ?? 0)))
      .catch((err) => setCreditError(err instanceof Error ? err.message : "Could not load credit settings."));
  }, [token]);

  async function saveCreditRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const points = Number(creditsPerOrder);
    if (!Number.isInteger(points) || points < 0 || points > 1000000) {
      setCreditError("Enter a whole number between 0 and 1,000,000.");
      return;
    }
    setCreditBusy(true);
    setCreditError("");
    setCreditSaved("");
    try {
      const result = await api<CreditsSetting>("/admin/vendor-credits/settings", {
        method: "PATCH",
        token,
        body: JSON.stringify({ points }),
      });
      setCreditsPerOrder(String(result.data?.creditsPerOrder ?? points));
      setCreditSaved("Per-order credit deduction saved.");
    } catch (err) {
      setCreditError(err instanceof Error ? err.message : "Could not save credit settings.");
    } finally {
      setCreditBusy(false);
    }
  }

  return (
    <SuperOnly>
    <div>
      <AdminHeader title="Finance" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-base font-semibold">Vendor credit deduction</h2>
          <p className="mt-2 text-sm text-slate-500">
            Credits deducted each time a vendor accepts or is assigned an order. Vendors with fewer than 5 credits appear in Low credits.
          </p>
          <form onSubmit={saveCreditRule} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Credits per order</span>
              <input
                inputMode="numeric"
                value={creditsPerOrder}
                onChange={(event) => {
                  setCreditsPerOrder(event.target.value.replace(/\D/g, "").slice(0, 7));
                  setCreditError("");
                  setCreditSaved("");
                }}
                className="mt-1 block h-10 w-40 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                aria-label="Credits deducted per order"
              />
            </label>
            <button
              type="submit"
              disabled={creditBusy || creditsPerOrder === ""}
              className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creditBusy ? "Saving…" : "Save rule"}
            </button>
          </form>
          {creditError ? <p className="mt-3 text-sm text-rose-600">{creditError}</p> : null}
          {creditSaved ? <p className="mt-3 text-sm text-emerald-700">{creditSaved}</p> : null}
        </AdminCard>
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
                <li key={payout.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="min-w-0 break-words">{payout.user?.fullName ?? payout.id}</span>
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
