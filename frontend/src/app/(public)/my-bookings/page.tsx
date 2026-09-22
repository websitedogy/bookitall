import type { Metadata } from "next";
import { MyBookingsPage } from "@/features/customers";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyBookingsPage />;
}
