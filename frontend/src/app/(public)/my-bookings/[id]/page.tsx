import type { Metadata } from "next";
import { BookingDetailPage } from "@/features/customers";

export const metadata: Metadata = {
  title: "Booking",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailPage id={id} />;
}
