"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";

export function SuperOnly({ children }: { children: ReactNode }) {
  const user = useAdminAuth((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) router.replace("/admin");
  }, [user, router]);

  if (!isSuperAdmin(user?.role)) {
    return <p className="py-10 text-center text-sm text-slate-500">Only the super admin can open this page.</p>;
  }
  return children;
}
