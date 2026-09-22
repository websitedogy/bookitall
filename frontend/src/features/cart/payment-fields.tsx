"use client";

export const PAY_METHODS = ["UPI", "CARD", "NET_BANKING", "WALLET", "CASH"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export const BANKS = [
  { id: "SBI", label: "State Bank of India" },
  { id: "HDFC", label: "HDFC Bank" },
  { id: "ICICI", label: "ICICI Bank" },
  { id: "AXIS", label: "Axis Bank" },
  { id: "KOTAK", label: "Kotak Mahindra" },
  { id: "PNB", label: "Punjab National Bank" },
  { id: "BOB", label: "Bank of Baroda" },
  { id: "UNION", label: "Union Bank" },
] as const;

export type PaymentDraft = {
  method: PayMethod;
  upiId: string;
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  bankCode: string;
};

export const emptyPayment = (method: PayMethod = "UPI"): PaymentDraft => ({
  method,
  upiId: "",
  cardNumber: "",
  cardHolder: "",
  cardExpiry: "",
  cardCvv: "",
  bankCode: "HDFC",
});

export function paymentPayload(draft: PaymentDraft) {
  if (draft.method === "UPI") return { method: "UPI" as const, upiId: draft.upiId.trim() };
  if (draft.method === "CARD") {
    return {
      method: "CARD" as const,
      cardNumber: draft.cardNumber.replace(/\s+/g, ""),
      cardHolder: draft.cardHolder.trim(),
      cardExpiry: draft.cardExpiry.trim(),
    };
  }
  if (draft.method === "NET_BANKING") return { method: "NET_BANKING" as const, bankCode: draft.bankCode };
  return { method: draft.method };
}

export function validatePaymentDraft(draft: PaymentDraft, walletBalance = 0, amount = 0): string | null {
  if (draft.method === "UPI") {
    if (!/^[a-z0-9._-]{2,256}@[a-z]{2,64}$/i.test(draft.upiId.trim())) {
      return "Enter a valid UPI ID, like name@oksbi";
    }
  }
  if (draft.method === "CARD") {
    const number = draft.cardNumber.replace(/\s+/g, "");
    if (!draft.cardHolder.trim()) return "Enter the name on the card";
    if (!/^\d{13,19}$/.test(number)) return "Enter a valid card number";
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(draft.cardExpiry.trim())) return "Expiry must be MM/YY";
    if (!/^\d{3,4}$/.test(draft.cardCvv.trim())) return "Enter the CVV";
  }
  if (draft.method === "NET_BANKING" && !draft.bankCode) return "Choose a bank";
  if (draft.method === "WALLET" && walletBalance + 0.001 < amount) {
    return "Wallet balance is too low. Add money first.";
  }
  return null;
}

const inputClass = "mt-2 w-full rounded-2xl border border-[var(--border)] px-3 py-3 text-sm";

export function PaymentFields({
  draft,
  onChange,
}: {
  draft: PaymentDraft;
  onChange: (patch: Partial<PaymentDraft>) => void;
}) {
  if (draft.method === "UPI") {
    return (
      <label className="mt-4 block">
        <span className="text-sm font-medium">UPI ID</span>
        <input
          value={draft.upiId}
          onChange={(e) => onChange({ upiId: e.target.value })}
          placeholder="name@oksbi"
          autoComplete="off"
          className={inputClass}
        />
      </label>
    );
  }

  if (draft.method === "CARD") {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-medium">Card number</span>
          <input
            value={draft.cardNumber}
            onChange={(e) => onChange({ cardNumber: formatCard(e.target.value) })}
            placeholder="4111 1111 1111 1111"
            inputMode="numeric"
            autoComplete="cc-number"
            className={inputClass}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-medium">Name on card</span>
          <input
            value={draft.cardHolder}
            onChange={(e) => onChange({ cardHolder: e.target.value })}
            placeholder="Name as on card"
            autoComplete="cc-name"
            className={inputClass}
          />
        </label>
        <label>
          <span className="text-sm font-medium">Expiry</span>
          <input
            value={draft.cardExpiry}
            onChange={(e) => onChange({ cardExpiry: formatExpiry(e.target.value) })}
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            className={inputClass}
          />
        </label>
        <label>
          <span className="text-sm font-medium">CVV</span>
          <input
            value={draft.cardCvv}
            onChange={(e) => onChange({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            type="password"
            className={inputClass}
          />
        </label>
      </div>
    );
  }

  if (draft.method === "NET_BANKING") {
    return (
      <label className="mt-4 block">
        <span className="text-sm font-medium">Bank</span>
        <select
          value={draft.bankCode}
          onChange={(e) => onChange({ bankCode: e.target.value })}
          className={inputClass}
        >
          {BANKS.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (draft.method === "CASH") {
    return (
      <p className="mt-4 rounded-2xl bg-[var(--background-blue)] px-3 py-3 text-sm text-[var(--text-muted)]">
        Booking is confirmed now. Pay cash or UPI to the vendor after the service. Admin can mark it collected later.
      </p>
    );
  }

  return null;
}

function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
