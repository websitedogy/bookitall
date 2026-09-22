import type { Metadata } from "next";
import { CheckoutSuccessPage } from "@/features/cart";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutSuccessPage />;
}
