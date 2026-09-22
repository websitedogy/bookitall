import Link from "next/link";
import type { ReactNode } from "react";

export function InfoPage({
  kicker,
  title,
  intro,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-5xl pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{kicker}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)] md:text-lg">{intro}</p>
      {updated ? <p className="mt-3 text-xs text-[var(--text-muted)]">Last updated {updated}</p> : null}
      <div className="mt-10 space-y-8 text-[15px] leading-8 text-[var(--text)]">{children}</div>
    </article>
  );
}

export function InfoCard({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl bg-white p-6 ring-1 ring-[var(--border)] md:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-4 text-[var(--text-muted)]">{children}</div>
    </section>
  );
}

export function InfoCta({ href, label }: { href: string; label: string }) {
  const className = "inline-flex h-12 items-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white";
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

const LEGAL_NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact us" },
  { href: "/careers", label: "Careers" },
  { href: "/support", label: "Help Center" },
  { href: "/cancellation", label: "Cancellation" },
  { href: "/refunds", label: "Refunds" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

export function LegalNav({ current }: { current: string }) {
  return (
    <nav aria-label="Company pages" className="mb-8 flex flex-wrap gap-2">
      {LEGAL_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            current === item.href
              ? "rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white"
              : "rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] ring-1 ring-[var(--border)] hover:text-[var(--text)]"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
