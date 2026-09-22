import Link from "next/link";
import { InfoCard, InfoCta, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Cancellation policy | Book It All",
  description: "How to cancel a Book It All hotel, tour, cab or home-service booking, and when cancellation is blocked.",
  path: "/cancellation",
});

export default function CancellationPage() {
  return (
    <InfoPage
      kicker="Support"
      title="Cancellation policy"
      intro="You cancel from My Bookings, not by ignoring a technician or a hotel. Whether money comes back depends on status, booking type and the refund policy. This page is the how; refunds have their own rules."
      updated="22 August 2026"
    >
      <LegalNav current="/cancellation" />

      <InfoCard id="how" title="How to cancel">
        <ol className="list-decimal space-y-3 pl-5">
          <li>Sign in with the same 10-digit mobile used at checkout (website or app — same account).</li>
          <li>
            Open{" "}
            <Link href="/my-bookings" className="font-medium text-[var(--primary)]">
              My Bookings
            </Link>{" "}
            and tap the booking.
          </li>
          <li>Choose Cancel booking. Give a short reason if asked — it helps the vendor and support.</li>
          <li>If you already paid, the refund follows the refund policy and the original method (UPI, card, net banking, wallet, or sandbox capture in development).</li>
        </ol>
      </InfoCard>

      <InfoCard id="when" title="When cancellation is allowed">
        <p>
          You can cancel while the booking is awaiting payment, confirmed or assigned. Awaiting payment means nobody has been locked in yet —
          cancelling just drops the unpaid order.
        </p>
        <p>
          After a vendor marks the job in progress, a cab is on the way as started, or hotel check-in / tour travel has begun, the Cancel button
          may be hidden. Call support only for safety issues or a no-show — we cannot unwind a completed job as a free cancel.
        </p>
      </InfoCard>

      <InfoCard id="windows" title="Typical windows by type">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text)]">
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 pr-4 font-semibold">Free cancel (if still confirmed / assigned)</th>
                <th className="py-2 font-semibold">Usually not cancellable</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Hotels</td>
                <td className="py-3 pr-4">Before check-in date (listing may add a cut-off hour)</td>
                <td className="py-3">After check-in or no-show at the property</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Tours</td>
                <td className="py-3 pr-4">Before the travel date shown at checkout</td>
                <td className="py-3">On or after travel day once the operator has started</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Cabs</td>
                <td className="py-3 pr-4">Before the ride is marked in progress</td>
                <td className="py-3">Driver arrived / trip started / completed</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Home services</td>
                <td className="py-3 pr-4">Before the technician is marked in progress</td>
                <td className="py-3">Work started or marked completed</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm">A listing can show stricter partner rules. Those win when they are stated on the listing before you pay.</p>
      </InfoCard>

      <InfoCard id="vendor" title="If you are the vendor">
        <p>
          Do not silently drop a job. Update status in My Orders. If you cannot fulfil, tell the customer and support so we can cancel and refund
          under the refund policy. Repeat no-shows can take the listing off Posts.
        </p>
      </InfoCard>

      <div className="flex flex-wrap gap-3">
        <InfoCta href="/my-bookings" label="Go to My Bookings" />
        <Link href="/refunds" className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          Read refund policy
        </Link>
      </div>
    </InfoPage>
  );
}
