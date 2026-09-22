import type { Metadata } from "next";
import { TechnicianClientLayout } from "./technician-client-layout";
import { NOINDEX } from "@/shared/lib/seo";

export const metadata: Metadata = { title: "Technician", ...NOINDEX };

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return <TechnicianClientLayout>{children}</TechnicianClientLayout>;
}
