"use client";

import Link from "next/link";
import { useVisibleServices } from "./service-catalog-provider";

export function VisibleServiceLinks({
  className,
  itemClassName,
  limit,
}: {
  className?: string;
  itemClassName?: string;
  limit?: number;
}) {
  const items = useVisibleServices().slice(0, limit);
  if (!items.length) return null;
  return (
    <ul className={className}>
      {items.map((service) => (
        <li key={service.id}>
          <Link href={service.href} className={itemClassName}>
            {service.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
