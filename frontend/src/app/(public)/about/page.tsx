import { InfoCard, InfoCta, InfoPage, LegalNav } from "@/features/legal/info-page";
import { VisibleServiceLinks } from "@/features/services/visible-service-links";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "About Book It All | Book It All",
  description: "Book It All is a Hyderabad-built marketplace for hotels, tours, cabs and home services — one account on website and app.",
  path: "/about",
});

const steps = [
  { n: "01", title: "Choose a service", text: "Open Hotels, Tours, Cabs or a home service such as electrician, plumber, AC, cleaning, beauty, painting, carpenter or appliance repair." },
  { n: "02", title: "See what is nearby", text: "Accepted vendor listings show within about 10 km when location is on. Distance, price and photos come from the live catalog, not dummy ads." },
  { n: "03", title: "Book and pay", text: "Pick a time, address or stay dates, then pay with UPI, card, net banking, wallet or pay after service." },
  { n: "04", title: "Track the booking", text: "My Bookings shows status from awaiting payment through confirmed, assigned, in progress and completed. Vendors see the same job in My Orders." },
];

export default function AboutPage() {
  return (
    <InfoPage
      kicker="About"
      title="Book hotels, tours, cabs and home services from one desk"
      intro="Book It All is a marketplace for everyday India. Customers find nearby, reviewed listings. Vendors publish a service once and it appears on the website and the Android/iOS app. Super admin reviews every post before it goes live."
      updated="22 August 2026"
    >
      <LegalNav current="/about" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Categories", value: "13+" },
          { label: "Home of the product", value: "Hyderabad" },
          { label: "One account", value: "Web + app" },
        ].map((item) => (
          <p key={item.label} className="rounded-3xl bg-[var(--primary-soft)] px-5 py-6">
            <span className="block text-2xl font-semibold text-[var(--primary)]">{item.value}</span>
            <span className="mt-1 block text-sm text-[var(--text-muted)]">{item.label}</span>
          </p>
        ))}
      </div>

      <InfoCard id="story" title="Why we exist">
        <p>
          Most families in Indian cities still juggle five apps for a weekend stay, a cab, a plumber and a salon visit. Book It All puts those
          verticals on one catalog with one login. Your 10-digit mobile number is the account — the same profile on the website and the app, with
          no duplicate numbers.
        </p>
        <p>
          The company is based in Ambedkar Centre, Bhadrachalam, Telangana 507111. Pricing is in Indian rupees. Nearby search, GST-style tax at checkout, UPI
          and pay-after-service are built for how people here actually book.
        </p>
      </InfoCard>

      <InfoCard id="customers" title="For customers">
        <p>
          Sign in with name and mobile (Google on the app uses that same number). Browse Posts for live vendor cards, or open a category from Home.
          Listings that admin has accepted are bookable: pick details, pay, done. You can call the vendor from the listing if a number is published.
        </p>
        <p>
          Hotels need check-in / check-out, tours need a travel date and travelers, cabs need pickup and drop, and home visits need a slot and
          address. After payment the booking sits in My Bookings. If something is wrong, cancel from the booking page while the status still allows it.
        </p>
      </InfoCard>

      <InfoCard id="vendors" title="For vendors">
        <p>
          Tap Place Register, pick a category, fill the form, add photos and pin a location. The listing stays pending until admin accepts it. After
          accept it is public on My Services and in nearby results, and a catalog record is created so customers can pay through the booking engine.
        </p>
        <p>
          Confirmed jobs appear in My Orders. Wallet and commission split happen when a booking is completed. One phone number cannot open a second
          customer account — if you already booked as a customer, listing a service upgrades that same user to a partner.
        </p>
      </InfoCard>

      <InfoCard id="how" title="How a booking moves">
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.n} className="rounded-2xl bg-[var(--background-blue)] p-4">
              <p className="text-xs font-bold text-[var(--primary)]">{step.n}</p>
              <p className="mt-1 font-semibold text-[var(--text)]">{step.title}</p>
              <p className="mt-1 text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
      </InfoCard>

      <InfoCard id="catalog" title="What you can book today">
        <VisibleServiceLinks
          className="grid gap-2 sm:grid-cols-2 md:grid-cols-3"
          itemClassName="block rounded-2xl bg-[var(--background-blue)] px-4 py-3 font-medium text-[var(--text)] hover:bg-[var(--primary-soft)]"
        />
      </InfoCard>

      <InfoCard id="trust" title="Trust and review">
        <p>
          Every vendor post is reviewed in the admin control center before customers see it. Rejected posts stay off the public feed. Super admin
          can also watch bookings, users and finance. We do not let anyone self-register as admin.
        </p>
        <p>
          Payments currently run in a sandbox capture for development. Production will use the same checkout with a live gateway. Refunds and
          cancellations are documented on their own pages.
        </p>
      </InfoCard>

      <div className="flex flex-wrap gap-3">
        <InfoCta href="/services" label="Browse all services" />
        <InfoCta href="/vendors/services" label="Place Register" />
        <InfoCta href="/contact" label="Contact us" />
      </div>
    </InfoPage>
  );
}
