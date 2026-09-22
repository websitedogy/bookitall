import Link from "next/link";
import { Clock, Headphones, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/features/legal/contact-form";
import { InfoCard, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/ui/json-ld";
import { localBusinessNode } from "@/features/seo/json-ld";

export const metadata = publicPageMeta({
  title: "Contact Book It All in Hyderabad | Book It All",
  description: "Contact Book It All in Hyderabad for bookings, vendor listings, refunds, careers and press.",
  path: "/contact",
});

const desks = [
  { title: "Customers", email: "bookitallinfo@gmail.com", phone: "98489 05979", href: "mailto:bookitallinfo@gmail.com", text: "Bookings, cart, payments, cancellations, nearby listings." },
  { title: "Vendors", email: "bookitallinfo@gmail.com", phone: "98489 05979", href: "mailto:bookitallinfo@gmail.com", text: "Place Register, listing review, My Orders, payouts." },
  { title: "Careers & press", email: "bookitallinfo@gmail.com", phone: "98489 05979", href: "mailto:bookitallinfo@gmail.com", text: "Jobs in Bhadrachalam, media kits, partnerships." },
];

const hours = [
  { day: "Monday – Saturday", time: "9:00 AM – 8:00 PM IST" },
  { day: "Sunday", time: "10:00 AM – 6:00 PM IST" },
  { day: "Public holidays", time: "Emergency bookings only — WhatsApp or phone" },
];

export default function ContactPage() {
  return (
    <InfoPage
      kicker="Contact us"
      title="Talk to the Hyderabad desk"
      intro="Customers, vendors and partners reach the same company. Use the form for a written trail, call for live bookings, or WhatsApp for a quick status check. Keep your 10-digit mobile and booking number ready."
      updated="22 August 2026"
    >
      <LegalNav current="/contact" />
      <JsonLd data={localBusinessNode()} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <ContactForm />
        <div className="space-y-4">
          <InfoCard title="Reach us directly">
            <a href="mailto:bookitallinfo@gmail.com" className="flex gap-3 text-[var(--text)]">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-semibold">bookitallinfo@gmail.com</span>
                <span className="text-sm text-[var(--text-muted)]">General inbox — routed to the right team</span>
              </span>
            </a>
            <a href="tel:+919848905979" className="flex gap-3 text-[var(--text)]">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-semibold">98489 05979</span>
                <span className="text-sm text-[var(--text-muted)]">Customer and vendor helpline</span>
              </span>
            </a>
            <a href="https://wa.me/919848905979" className="flex gap-3 text-[var(--text)]">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-semibold">WhatsApp</span>
                <span className="text-sm text-[var(--text-muted)]">Send your booking number for faster help</span>
              </span>
            </a>
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-semibold text-[var(--text)]">Registered office</span>
                <span className="text-sm">Ambedkar Centre, Bhadrachalam, Telangana 507111, India</span>
              </span>
            </p>
          </InfoCard>
          <InfoCard title="Desk hours">
            <ul className="space-y-2">
              {hours.map((row) => (
                <li key={row.day} className="flex justify-between gap-4 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-[var(--text)]">
                    <Clock className="h-4 w-4 text-[var(--primary)]" />
                    {row.day}
                  </span>
                  <span>{row.time}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        </div>
      </div>

      <InfoCard id="desks" title="Which team should you write to?">
        <div className="grid gap-4 md:grid-cols-3">
          {desks.map((desk) => (
            <div key={desk.title} className="rounded-2xl bg-[var(--background-blue)] p-4">
              <p className="font-semibold text-[var(--text)]">{desk.title}</p>
              <p className="mt-2 text-sm">{desk.text}</p>
              <a href={desk.href} className="mt-3 block text-sm font-medium text-[var(--primary)]">
                {desk.email}
              </a>
              <p className="text-sm">{desk.phone}</p>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard id="before-you-write" title="Before you contact us">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Booking status, pay or cancel: open{" "}
            <Link href="/my-bookings" className="font-medium text-[var(--primary)]">
              My Bookings
            </Link>
            .
          </li>
          <li>
            Vendor jobs: open{" "}
            <Link href="/vendors/my-orders" className="font-medium text-[var(--primary)]">
              My Orders
            </Link>
            .
          </li>
          <li>
            Listing still pending: admin review is required. Check Posts after it is accepted.
          </li>
          <li>
            Refund timing: see the{" "}
            <Link href="/refunds" className="font-medium text-[var(--primary)]">
              refund policy
            </Link>
            .
          </li>
        </ul>
      </InfoCard>

      <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Headphones className="h-4 w-4 text-[var(--primary)]" />
        Help articles also live in the{" "}
        <Link href="/support" className="font-medium text-[var(--primary)]">
          Help Center
        </Link>
        .
      </p>
    </InfoPage>
  );
}
