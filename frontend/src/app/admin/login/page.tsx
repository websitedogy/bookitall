import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
