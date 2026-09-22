import Link from "next/link";
import { InfoCard, InfoCta, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Refund policy | Book It All",
  description: "When Book It All refunds hotels, tours, cabs and home services, timelines, and how money returns to UPI, card or wallet.",
  path: "/refunds",
});

export default function RefundsPage() {
  return (
    <InfoPage
      kicker="Support"
      title="Refund policy"
      intro="Refunds follow booking type, how far the job or stay has gone, and whether you paid through checkout. This is the money page. How to tap Cancel is on the cancellation policy. Development uses a sandbox capture; production will return to the same UPI, card, net banking or wallet."
      updated="22 August 2026"
    >
      <LegalNav current="/refunds" />

      <InfoCard id="full" title="Full refund">
        <p>You get the booking total (subtotal plus tax shown at checkout) back when all of these are true:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You paid (not an unpaid awaiting-payment order).</li>
          <li>You cancelled while status was still confirmed or assigned, or support cancelled because the vendor no-showed.</li>
          <li>The type window in the table below still applies, and the listing did not state a stricter non-refundable rate that you accepted.</li>
        </ul>
      </InfoCard>

      <InfoCard id="table" title="By service type">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text)]">
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 pr-4 font-semibold">Full refund</th>
                <th className="py-2 font-semibold">No refund (except verified fault)</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Hotels</td>
                <td className="py-3 pr-4">Cancel before check-in, unless the listing is marked non-refundable</td>
                <td className="py-3">After check-in, early checkout by choice, or no-show</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Tours</td>
                <td className="py-3 pr-4">Cancel before the travel date</td>
                <td className="py-3">On travel day after the operator has started, or unused seats you booked</td>
              </tr>
              <tr className="border-b border-[var(--border)] align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Cabs</td>
                <td className="py-3 pr-4">Cancel before the ride is in progress</td>
                <td className="py-3">Trip started or completed; waiting charges already incurred stay with the partner</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4 font-medium text-[var(--text)]">Home services</td>
                <td className="py-3 pr-4">Cancel before the technician is in progress</td>
                <td className="py-3">Work started or completed. Spare parts already billed on the job are not returned as cash unless unused and returned</td>
              </tr>
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard id="issues" title="Service issues after the job">
        <p>
          If the stay, tour, ride or home visit was paid and completed but clearly not delivered (wrong listing, unsafe work, no technician), write
          to support within 48 hours with the booking number and photos. We may refund in full, refund in part, or ask the vendor to rework. This is
          not a substitute for a free cancel after you simply changed your mind.
        </p>
      </InfoCard>

      <InfoCard id="timing" title="When money comes back">
        <ul className="list-disc space-y-2 pl-5">
          <li>Sandbox / development: the capture is reversed in the booking record immediately after an eligible cancel.</li>
          <li>UPI and wallets (production): often 1–3 bank working days.</li>
          <li>Cards and net banking (production): often 5–7 bank working days, depending on the issuing bank.</li>
          <li>Pay after service / cash: there is nothing to reverse unless you already paid the vendor in cash — settle that with the vendor, then tell support.</li>
        </ul>
        <p>
          Commission is reversed with the booking when a full refund is issued before completion. After a job is completed, partner wallet credit
          stands unless support claws back for a verified fault.
        </p>
      </InfoCard>

      <InfoCard id="how-to" title="How to ask">
        <p>
          First cancel from{" "}
          <Link href="/my-bookings" className="font-medium text-[var(--primary)]">
            My Bookings
          </Link>{" "}
          if the button is there. If it is not, use{" "}
          <Link href="/contact" className="font-medium text-[var(--primary)]">
            Contact us
          </Link>{" "}
          with booking number, mobile, and what went wrong. Do not share full card numbers.
        </p>
      </InfoCard>

      <div className="flex flex-wrap gap-3">
        <InfoCta href="/support" label="Talk to support" />
        <Link href="/cancellation" className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          Cancellation steps
        </Link>
      </div>
    </InfoPage>
  );
}
