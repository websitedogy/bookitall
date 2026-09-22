"use client";

import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/support" },
];

const serviceLinks = [
  { label: "Hotels", href: "/hotels" },
  { label: "Tours", href: "/tours" },
  { label: "Cabs", href: "/cabs" },
  { label: "Home Services", href: "/home-services" },
  { label: "Travel Services", href: "/services" },
];

const followLinks = ["Facebook", "Instagram", "YouTube", "LinkedIn"];

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#0f5549] text-[#edf7f5]">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Book It All
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#dfeae8]">
              Hotels, tours, cabs and home services — booked from the same desk.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#dfeae8]">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">Our Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#dfeae8]">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#dfeae8]">
              <li>
                <a href="mailto:bookitallinfo@gmail.com" className="transition-colors hover:text-white">
                  bookitallinfo@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919848905979" className="transition-colors hover:text-white">
                  98489 05979
                </a>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Ambedkar Centre, Bhadrachalam, Telangana 507111
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">Follow Us</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#dfeae8]">
              {followLinks.map((label) => (
                <li key={label}>
                  <Link href="/contact" className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1a6d60]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 text-sm text-[#e6f3f0] md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} Book It All. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-[#e6f3f0]">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link href="/refunds" className="transition-colors hover:text-white">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
