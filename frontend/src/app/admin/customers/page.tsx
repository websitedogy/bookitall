"use client";

import { AdminPeoplePanel } from "@/features/admin/people-panel";

export default function AdminCustomersPage() {
  return <AdminPeoplePanel title="Customers" role="CUSTOMER" empty="No customers yet." />;
}
