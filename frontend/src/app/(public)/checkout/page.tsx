import type { Metadata } from "next";
import { CheckoutPage } from "@/features/cart";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutPage />;
}
