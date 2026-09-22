import { VendorPostsPage } from "@/features/vendors";

import { publicPageMeta } from "@/shared/lib/seo";

export const metadata = publicPageMeta({
  title: "My Services | Book It All",
  description: "Your listed services across hotels, tours, cabs, jobs and home services.",
  path: "/vendors/posts",
});

export default function PostsPage() {
  return <VendorPostsPage />;
}
