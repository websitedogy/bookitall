import Link from "next/link";
import { InfoCard, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Privacy policy | Book It All",
  description: "How Book It All collects, uses and shares name, mobile, location, bookings and listing data in India.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <InfoPage
      kicker="Legal"
      title="Privacy policy"
      intro="This policy explains what Book It All stores when you use the website or app, why we need it, who sees it, and how long we keep it. We follow the same rules for customers and vendors because they share one account system."
      updated="22 August 2026"
    >
      <LegalNav current="/privacy" />

      <InfoCard id="controller" title="1. Who holds the data">
        <p>
          Book It All, Ambedkar Centre, Bhadrachalam, Telangana 507111, is the organisation that decides how account and booking data is processed. Write to
          bookitallinfo@gmail.com or use the{" "}
          <Link href="/contact" className="font-medium text-[var(--primary)]">
            contact form
          </Link>{" "}
          for privacy requests (access, correction, deletion where the law allows).
        </p>
      </InfoCard>

      <InfoCard id="collect" title="2. What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Name, 10-digit mobile, optional email, and a hashed secret for the session — not a customer password on phone login.</li>
          <li>Google email if you continue with Google, always tied to the mobile you entered.</li>
          <li>Service address, stay dates, traveler count, pickup/drop notes, and cart contents until checkout.</li>
          <li>Booking records: amounts, tax, commission, status history, payment reference and method.</li>
          <li>Vendor listing fields, photos you upload, map coordinates, and review status (pending, accepted, rejected).</li>
          <li>Approximate location when you allow the browser or app to share it, used to sort nearby listings (about 10 km).</li>
          <li>Device session tokens in local storage so you stay signed in. See the cookie policy.</li>
        </ul>
      </InfoCard>

      <InfoCard id="use" title="3. How we use it">
        <p>
          We use this data to create your account, show nearby services, price and confirm bookings, notify customers and vendors of status, run
          admin listing review, calculate partner wallets, and answer support tickets. We do not sell phone numbers to advertisers.
        </p>
        <p>
          Messages and emails may be sent for booking created, payment success, and status changes. Transactional messages are part of providing the
          service.
        </p>
      </InfoCard>

      <InfoCard id="share" title="4. Who can see it">
        <ul className="list-disc space-y-2 pl-5">
          <li>You — on Account, My Bookings, My Orders and your own listings.</li>
          <li>The vendor for a booking you placed (name, phone if needed to deliver, address, schedule, paid amount).</li>
          <li>The customer, for details needed to receive the service.</li>
          <li>Super admin — users, listings queue, bookings and finance, to operate the marketplace.</li>
          <li>Payment gateway and SMS/email providers when those are connected in production, only to complete the request.</li>
        </ul>
        <p>We may disclose data if Indian law or a lawful order requires it.</p>
      </InfoCard>

      <InfoCard id="location" title="5. Location">
        <p>
          Nearby search asks for GPS. If you refuse, listings still load without distance sorting, and city text on the listing may be used as a
          fallback. We store last known coordinates on field roles (for example drivers) when they are online, to assign nearby work — not to sell
          movement history.
        </p>
      </InfoCard>

      <InfoCard id="retention" title="6. Retention and security">
        <p>
          Accounts and bookings are kept while the account is active and for a reasonable period after for tax, dispute and accounting needs.
          Uploaded listing photos stay with the listing until it is removed. Access tokens expire; you can sign out to drop the local session.
        </p>
        <p>
          We use encrypted connections to the API, hashed credentials where passwords exist, and role checks so customers cannot open admin. No
          system is perfect — tell us at bookitallinfo@gmail.com if you think an account was misused.
        </p>
      </InfoCard>

      <InfoCard id="rights" title="7. Your choices">
        <p>
          Update your name from the sign-in flow when the number matches. Ask support to correct a booking address or to close an account after
          open jobs are settled. You can refuse location and still browse. Browser controls for cookies are described in{" "}
          <Link href="/cookies" className="font-medium text-[var(--primary)]">
            Cookie policy
          </Link>
          .
        </p>
      </InfoCard>
    </InfoPage>
  );
}
