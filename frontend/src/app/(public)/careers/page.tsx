import Link from "next/link";
import { InfoCard, InfoCta, InfoPage, LegalNav } from "@/features/legal/info-page";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Careers at Book It All | Book It All",
  description: "Open roles at Book It All in Hyderabad — operations, vendor onboarding, product and engineering.",
  path: "/careers",
});

const roles = [
  {
    title: "Customer operations associate",
    type: "Full-time · Hyderabad",
    text: "Help customers with cart, checkout, nearby listings and status. You will live in My Bookings, WhatsApp and the phone desk. Clear written English and Telugu or Hindi is a plus.",
  },
  {
    title: "Vendor onboarding specialist",
    type: "Full-time · Hyderabad",
    text: "Walk hotels, tour desks, cab owners and home-service partners through Place Register. Check photos, price and pin. Queue listings for admin accept so My Services stay trustworthy.",
  },
  {
    title: "Product designer",
    type: "Full-time · Hyderabad",
    text: "Website and Flutter app share one booking engine. You will design cart, listing detail, vendor forms and the compact desktop tab bar so both surfaces feel like the same product.",
  },
  {
    title: "Full-stack engineer",
    type: "Full-time · Hyderabad",
    text: "NestJS API, Next.js website, Flutter app. Auth is one mobile number. You will work on listings review, quote/checkout, wallets and admin. TypeScript first.",
  },
  {
    title: "Field quality (home services)",
    type: "Contract · Hyderabad metro",
    text: "Spot-check electrician, plumber, AC and cleaning jobs after completion. Report no-shows and unsafe work so refunds and partner scores stay honest.",
  },
];

export default function CareersPage() {
  return (
    <InfoPage
      kicker="Careers"
      title="Build the booking desk for Indian cities"
      intro="Book It All is hiring in Hyderabad. One catalog for hotels, tours, cabs and home services. One account on website and app. We are a small team — you will ship to customers, not sit in a slide deck."
      updated="22 August 2026"
    >
      <LegalNav current="/careers" />

      <InfoCard title="How we work">
        <p>
          Office days in Ambedkar Centre, Bhadrachalam, with remote overlap when a role allows it. We review every vendor post before it is public. We do not
          invent fake listings for demos in production. English is the working language; local languages help on the phone.
        </p>
        <p>
          Apply with a CV and 8–12 lines on a product you shipped. Mention the role title in the subject. We reply to shortlisted people within
          ten working days.
        </p>
      </InfoCard>

      {roles.map((role) => (
        <InfoCard key={role.title} title={role.title}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">{role.type}</p>
          <p>{role.text}</p>
        </InfoCard>
      ))}

      <InfoCard title="What to send">
        <ul className="list-disc space-y-2 pl-5">
          <li>PDF or link to CV.</li>
          <li>City you can work from, and notice period.</li>
          <li>For engineering: GitHub or a repo you can talk through.</li>
          <li>For design: a case study of a booking or marketplace flow.</li>
        </ul>
        <p>
          Email{" "}
          <a href="mailto:bookitallinfo@gmail.com" className="font-medium text-[var(--primary)]">
            bookitallinfo@gmail.com
          </a>
          . Press and internships can use the same inbox with a clear subject.
        </p>
      </InfoCard>

      <div className="flex flex-wrap gap-3">
        <InfoCta href="mailto:bookitallinfo@gmail.com?subject=Book%20It%20All%20careers" label="Email bookitallinfo@gmail.com" />
        <Link href="/about" className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          Read about the product
        </Link>
      </div>
    </InfoPage>
  );
}
