import { VendorPostEdit } from "@/features/vendors/posts/vendor-post-edit";

type Props = { params: Promise<{ id: string }> };

export default async function EditVendorPostPage({ params }: Props) {
  const { id } = await params;
  return <VendorPostEdit id={id} />;
}