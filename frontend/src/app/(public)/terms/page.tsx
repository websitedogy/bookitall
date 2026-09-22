import Link from "next/link";
import { InfoCard, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Terms of use | Book It All",
  description: "Full terms of use for the Book It All website and app: accounts, listings, bookings, payments and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <InfoPage
      kicker="Legal"
      title="Terms of use"
      intro="These terms govern Book It All on the website and the mobile app. By creating an account, listing a service or placing a booking you agree to them. If you do not agree, do not use the product."
      updated="22 August 2026"
    >
      <LegalNav current="/terms" />

      <InfoCard id="parties" title="1. Who we are">
        <p>
          Book It All operates a marketplace from Hyderabad, Telangana, India. We provide software, listing review, checkout, booking status and
          customer support. We are not the hotel, tour operator, cab owner or technician unless a listing clearly says so.
        </p>
        <p>
          A booking is an agreement between the customer and the vendor (partner). We may collect payment as agent and pass the partner share after
          commission, as shown in the booking and wallet.
        </p>
      </InfoCard>

      <InfoCard id="accounts" title="2. Accounts">
        <p>
          Identity is the 10-digit Indian mobile number. Website login, app login and Google continue (when a number is supplied) must resolve to
          one user. Duplicate numbers are merged or blocked. You must be able to receive calls or messages on that number.
        </p>
        <p>
          You must give a real name. Do not impersonate another person or business. Super-admin accounts are created only by Book It All. You cannot
          self-register as SUPER_ADMIN or SUB_EDITOR.
        </p>
        <p>
          If you list a service, the same account may be marked as a partner. You remain responsible for both customer bookings and vendor jobs on
          that profile. We may suspend or close an account for fraud, abuse, fake listings or unpaid obligations.
        </p>
      </InfoCard>

      <InfoCard id="listings" title="3. Vendor listings">
        <p>
          Vendors submit photos, price, location and service details. Listings stay pending until a super admin accepts or rejects them. Only
          accepted listings are public and bookable. You warrant that photos are yours to use, prices are honoured, and the service is lawful.
        </p>
        <p>
          We may reject, hide or take down a listing that is misleading, duplicate, unsafe, outside the category, or in breach of Indian law. Price
          and tax at checkout are calculated by the booking engine from the listing (or linked catalog) plus the tax rules for that vertical.
        </p>
      </InfoCard>

      <InfoCard id="bookings" title="4. Bookings, cart and checkout">
        <p>
          Adding an item to cart does not reserve inventory until checkout succeeds. Hotels need valid check-in and check-out. Tours need a travel
          date and traveler count. Home services need a slot and service address. Cabs should include pickup and drop where asked.
        </p>
        <p>
          When you pay, the booking moves from awaiting payment to confirmed or assigned. Pay-after-service is allowed where offered; you still
          agree to pay the stated total. If two customers try to book the same lock at once, one request may fail — try again.
        </p>
      </InfoCard>

      <InfoCard id="payments" title="5. Payments, tax and commission">
        <p>
          Checkout may offer UPI, card, net banking, wallet or cash/pay after service. Development uses a sandbox capture. Live gateway charges will
          follow the same flow. Taxes (for example GST-style percentages on hotels, tours and home services) are added to the vendor subtotal.
        </p>
        <p>
          Book It All deducts a platform commission from the vendor subtotal. The partner wallet is credited when a booking is marked completed.
          Payouts follow finance operations and may take bank working days.
        </p>
      </InfoCard>

      <InfoCard id="cancellations" title="6. Cancellations and refunds">
        <p>
          Customers may cancel from the booking page while status is awaiting payment, confirmed or assigned, unless the listing says otherwise.
          After a job is in progress, completed, or a stay has begun, cancellation can be refused. Refunds follow the{" "}
          <Link href="/refunds" className="font-medium text-[var(--primary)]">
            refund policy
          </Link>{" "}
          and the{" "}
          <Link href="/cancellation" className="font-medium text-[var(--primary)]">
            cancellation guide
          </Link>
          .
        </p>
      </InfoCard>

      <InfoCard id="conduct" title="7. Acceptable use">
        <p>
          Do not scrape the catalog, bypass payment, harass vendors or customers, upload illegal content, or attempt to access admin or other users’
          data. Location is only requested to sort nearby listings. Do not spoof GPS to game search.
        </p>
      </InfoCard>

      <InfoCard id="liability" title="8. Liability">
        <p>
          Vendors are responsible for the actual stay, ride or workmanship. Book It All is not liable for vendor no-shows, quality disputes beyond
          facilitating cancel/refund rules, or device/network failure. Our liability for a booking is limited to the amount paid through the
          platform for that booking, except where Indian law does not allow a limit.
        </p>
      </InfoCard>

      <InfoCard id="law" title="9. Law and contact">
        <p>
          These terms are governed by the laws of India. Courts in Hyderabad, Telangana have jurisdiction, subject to mandatory consumer protections.
          Questions:{" "}
          <Link href="/contact" className="font-medium text-[var(--primary)]">
            Contact us
          </Link>{" "}
          or email bookitallinfo@gmail.com. Related documents:{" "}
          <Link href="/privacy" className="font-medium text-[var(--primary)]">
            Privacy
          </Link>
          ,{" "}
          <Link href="/cookies" className="font-medium text-[var(--primary)]">
            Cookies
          </Link>
          .
        </p>
      </InfoCard>
    </InfoPage>
  );
}
