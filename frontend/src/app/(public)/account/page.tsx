import type { Metadata } from "next";
import { ProfilePage } from "@/features/customers/components/profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfilePage />;
}
