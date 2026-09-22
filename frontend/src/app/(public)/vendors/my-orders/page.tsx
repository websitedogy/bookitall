import type { Metadata } from "next";
import { MyOrdersPage } from "@/features/vendors";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyOrdersPage />;
}
