"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { SuperOnly } from "@/features/admin/super-only";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";

type Rule = { id: string; serviceType: string; percent: string };
type Payout = { id: string; amount: string; status: string; user?: { fullName: string } };
const CREDIT_SERVICES = [
  { id: "hotels", label: "Hotels" },
  { id: "tours", label: "Tours" },
  { id: "cabs", label: "Cabs" },
  { id: "electrician", label: "Electrician" },
  { id: "plumber", label: "Plumber" },
  { id: "ac", label: "AC repair" },
  { id: "cleaning", label: "Cleaning" },
  { id: "jobs", label: "Jobs" },
  { id: "beautician", label: "Beautician" },
  { id: "painting", label: "Painting" },
  { id: "carpenter", label: "Carpenter" },
  { id: "appliance", label: "Appliance repair" },
  { id: "public-transport", label: "Public transport" },
  { id: "goods-transport", label: "Goods transport" },
  { id: "packers-movers", label: "Packers & movers" },
  { id: "cloud-kitchen", label: "Cloud kitchen" },
  { id: "local-shops", label: "Local shops" },
  { id: "home-services", label: "Other home services" },
] as const;
type CreditService = (typeof CREDIT_SERVICES)[number]["id"];
type CreditsSetting = {
  creditsPerOrder?: number;
  creditRates?: Partial<Record<CreditService, number>>;
};

export default function AdminFinancePage() {
  const token = useAdminAuth((s) => s.accessToken);
  const [rules, setRules] = useState<Rule[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [creditRates, setCreditRates] = useState<Record<CreditService, string>>(
    Object.fromEntries(CREDIT_SERVICES.map(({ id }) => [id, ""])) as Record<CreditService, string>,
  );
  const [creditBusy, setCreditBusy] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditSaved, setCreditSaved] = useState("");

  useEffect(() => {
    if (!token) return;
    api<Rule[]>("/commission/rules", { token }).then((r) => setRules(r.data ?? []));
    api<Payout[]>("/payouts", { token }).then((r) => setPayouts(r.data ?? []));
    api<CreditsSetting>("/admin/vendor-credits/settings", { token })
      .then((r) =>
        setCreditRates(
          Object.fromEntries(
            CREDIT_SERVICES.map(({ id }) => [
              id,
              String(r.data?.creditRates?.[id] ?? r.data?.creditsPerOrder ?? 0),
            ]),
          ) as Record<CreditService, string>,
        ),
      )
      .catch((err) => setCreditError(err instanceof Error ? err.message : "Could not load credit settings."));
  }, [token]);

  async function saveCreditRule(event: React.FormEvent<HTMLFormElement>, serviceType: CreditService) {
    event.preventDefault();
    if (!token) return;
    const points = Number(creditRates[serviceType]);
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
        body: JSON.stringify({ points, serviceType }),
      });
      setCreditRates((current) => ({
        ...current,
        [serviceType]: String(result.data?.creditsPerOrder ?? points),
      }));
      setCreditSaved(`${CREDIT_SERVICES.find((service) => service.id === serviceType)?.label} credit deduction saved.`);
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
            Set the credit charge for each service. Credits are deducted when the order is completed. Vendors with fewer than 5 credits appear in Low credits.
          </p>
          <div className="mt-4 space-y-3">
            {CREDIT_SERVICES.map((service) => (
              <form
                key={service.id}
                onSubmit={(event) => void saveCreditRule(event, service.id)}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 p-3"
              >
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">{service.label} · credits per completed order</span>
                  <input
                    inputMode="numeric"
                    value={creditRates[service.id]}
                    onChange={(event) => {
                      setCreditRates((current) => ({
                        ...current,
                        [service.id]: event.target.value.replace(/\D/g, "").slice(0, 7),
                      }));
                      setCreditError("");
                      setCreditSaved("");
                    }}
                    className="mt-1 block h-10 w-40 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    aria-label={`${service.label} credits deducted per completed order`}
                  />
                </label>
                <button
                  type="submit"
                  disabled={creditBusy || creditRates[service.id] === ""}
                  className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creditBusy ? "Saving…" : "Save"}
                </button>
              </form>
            ))}
          </div>
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
