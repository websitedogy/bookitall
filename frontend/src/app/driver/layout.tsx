import type { Metadata } from "next";
import { DriverClientLayout } from "./driver-client-layout";
import { NOINDEX } from "@/shared/lib/seo";

export const metadata: Metadata = { title: "Driver", ...NOINDEX };

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <DriverClientLayout>{children}</DriverClientLayout>;
}
