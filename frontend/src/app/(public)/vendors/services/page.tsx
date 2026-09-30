import { AddServicePicker } from "@/features/vendors/services/add-service-picker";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "Place Register | Book It All",
  description: "Vendors: choose a category and submit details for that service only.",
  path: "/vendors/services",
  index: false,
});

export default function AddServicePage() {
  return <AddServicePicker />;
}
