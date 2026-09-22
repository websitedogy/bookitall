import Link from "next/link";
import { JsonLd } from "@/shared/ui/json-ld";
import { SITE_URL } from "@/shared/lib/site-url";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items, visual = true }: { items: Crumb[]; visual?: boolean }) {
  if (!items.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  if (!visual) return <JsonLd data={jsonLd} />;

  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-3 md:px-7 md:pt-0">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1 text-[12px] text-[var(--studio-muted)] md:text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.href}-${item.name}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {last ? (
                <span className="truncate font-medium text-[var(--studio-ink)]">{item.name}</span>
              ) : (
                <Link href={item.href} className="truncate hover:text-[var(--primary)]">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
