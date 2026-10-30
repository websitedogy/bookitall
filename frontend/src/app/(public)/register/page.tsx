import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { ServiceGrid } from "@/features/home/components/service-grid";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <>
      <Suspense>
        <LoginForm />
      </Suspense>
      <ServiceGrid heading="Explore our services" />
    </>
  );
}
