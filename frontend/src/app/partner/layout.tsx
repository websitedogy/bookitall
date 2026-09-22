import type { Metadata } from "next";
import { PartnerClientLayout } from "./partner-client-layout";
import { NOINDEX } from "@/shared/lib/seo";

export const metadata: Metadata = { title: "Partner", ...NOINDEX };

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerClientLayout>{children}</PartnerClientLayout>;
}
