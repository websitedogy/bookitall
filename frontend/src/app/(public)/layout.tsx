import { MobileTabBar, PublicFooter, PublicMain, SiteHeader } from "@/features/public-site";
import { RegisterServiceWorker } from "@/features/public-site/components/register-sw";
import { VendorOrderAlert } from "@/features/vendors/my-orders/vendor-order-alert";
import { VendorOrderPush } from "@/features/vendors/my-orders/vendor-order-push";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <RegisterServiceWorker />
      <div className="sticky top-0 z-50 bg-white pt-[env(safe-area-inset-top)]">
        <VendorOrderPush />
        <SiteHeader />
      </div>
      <PublicMain>{children}</PublicMain>
      <PublicFooter />
      <MobileTabBar />
      <VendorOrderAlert />
    </>
  );
}
