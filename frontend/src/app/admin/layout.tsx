import type { Metadata } from "next";
import { AdminClientLayout } from "./admin-client-layout";
import { NOINDEX } from "@/shared/lib/seo";

export const metadata: Metadata = {
  title: "Admin",
  ...NOINDEX,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
