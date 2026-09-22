import Link from "next/link";
import { Headphones, Mail, MessageCircle, Phone } from "lucide-react";
import { InfoCard, InfoCta, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Help Center | Book It All",
  description: "Book It All help for bookings, payments, nearby listings, vendor posts and account login.",
  path: "/support",
});

const faqs = [
  {
    q: "Website and app — is it the same account?",
    a: "Yes. The 10-digit mobile number is the account. Google on the app still needs that number so we do not create a second user.",
  },
  {
    q: "Why is my listing not on Posts?",
    a: "New services stay pending until super admin accepts them. Rejected posts stay off the public feed. Edit and resubmit if you were asked to fix photos or price.",
  },
  {
    q: "Nearby is empty.",
    a: "Allow location, or browse a category from Home. Only accepted listings inside about 10 km of you show as nearby. You can still open All services without GPS.",
  },
  {
    q: "Cart disappeared after I closed the tab.",
    a: "Cart is saved in the browser. A different device, private window, or cleared site data starts empty. Sign-in does not currently sync cart across phones.",
  },
  {
    q: "I paid but My Bookings is empty.",
    a: "Sign in with the same number used at checkout. If you used pay after service, the booking still appears as awaiting or confirmed. Write to support with the time and listing name if nothing shows.",
  },
  {
    q: "How do I become a vendor?",
    a: "Tap Place Register, pick a category, fill the form, add photos and a map pin. When admin accepts, the listing is bookable and jobs land in My Orders.",
  },
];

export default function SupportPage() {
  return (
    <InfoPage
      kicker="Help Center"
      title="Get help with bookings, listings and pay"
      intro="Most answers live in My Bookings, My Orders or the policies below. If you still need a person, call Hyderabad support, WhatsApp the booking number, or use Contact us."
      updated="22 August 2026"
    >
      <LegalNav current="/support" />

      <div className="grid gap-3 sm:grid-cols-3">
        <a href="mailto:bookitallinfo@gmail.com" className="rounded-3xl bg-white p-5 ring-1 ring-[var(--border)]">
          <Mail className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 font-semibold">Email</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">bookitallinfo@gmail.com</p>
        </a>
        <a href="tel:+919848905979" className="rounded-3xl bg-white p-5 ring-1 ring-[var(--border)]">
          <Phone className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 font-semibold">Call</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">98489 05979 · 9 AM–8 PM IST</p>
        </a>
        <a href="https://wa.me/919848905979" className="rounded-3xl bg-white p-5 ring-1 ring-[var(--border)]">
          <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 font-semibold">WhatsApp</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Send booking number first</p>
        </a>
      </div>

      <InfoCard title="Guides">
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/cancellation", title: "Cancel a booking", text: "When the button is available and what happens next." },
            { href: "/refunds", title: "Refunds", text: "Hotels, tours, cabs, home services and timelines." },
            { href: "/cart", title: "Cart & checkout", text: "Qty, dates, UPI, card, net banking, wallet, cash." },
            { href: "/vendors/services", title: "Place Register", text: "Vendor form, photos, admin review." },
            { href: "/terms", title: "Terms of use", text: "Accounts, listings, liability." },
            { href: "/privacy", title: "Privacy", text: "Phone, location, who sees a booking." },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-2xl bg-[var(--background-blue)] p-4 hover:bg-[var(--primary-soft)]">
                <p className="font-semibold text-[var(--text)]">{item.title}</p>
                <p className="mt-1 text-sm">{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="Common questions">
        {faqs.map((item) => (
          <div key={item.q} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
            <p className="font-semibold text-[var(--text)]">{item.q}</p>
            <p className="mt-1">{item.a}</p>
          </div>
        ))}
      </InfoCard>

      <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Headphones className="h-4 w-4 text-[var(--primary)]" />
        Still stuck? The{" "}
        <Link href="/contact" className="font-medium text-[var(--primary)]">
          contact form
        </Link>{" "}
        reaches the same desk.
      </p>
      <InfoCta href="/contact" label="Contact us" />
    </InfoPage>
  );
}
