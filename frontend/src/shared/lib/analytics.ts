export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
export const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim() || "";

type Gtag = (command: string, ...args: unknown[]) => void;

function gtag(): Gtag | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { gtag?: Gtag }).gtag;
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  const send = gtag();
  if (!GA_MEASUREMENT_ID || typeof send !== "function") return;
  send("event", name, params);
}

export function trackViewItem(params: { item_id: string; item_name: string; item_category?: string; value?: number }) {
  trackEvent("view_item", {
    currency: "INR",
    value: params.value,
    items: [{ item_id: params.item_id, item_name: params.item_name, item_category: params.item_category }],
  });
}

export function trackBeginCheckout(params: { value: number; item_count: number }) {
  trackEvent("begin_checkout", { currency: "INR", value: params.value, items: [{ quantity: params.item_count }] });
}

export function trackBookingConfirmed(params: { transaction_id: string; value: number; paid: boolean }) {
  trackEvent("booking_confirmed", {
    currency: "INR",
    transaction_id: params.transaction_id,
    value: params.value,
    paid: params.paid,
  });
}
