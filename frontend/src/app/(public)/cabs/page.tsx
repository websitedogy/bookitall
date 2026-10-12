import { categoryMetadata } from "@/features/seo/category-copy";
import { CabBookingFlow } from "@/features/users/cabs/components/cab-quote-form";

export const generateMetadata = () => categoryMetadata("cabs");

export default function Page() {
  return <CabBookingFlow />;
}
