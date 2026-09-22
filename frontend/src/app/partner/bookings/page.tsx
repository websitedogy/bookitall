import { BookingsList } from "@/features/booking/components/bookings-list";

export default function PartnerBookingsPage() {
  return (
    <div>
      <h1 className="serif mt-2 text-4xl">Incoming bookings</h1>
      <div className="mt-6">
        <BookingsList scope="orders" emptyHint="No bookings" />
      </div>
    </div>
  );
}
