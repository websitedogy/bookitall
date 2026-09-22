"use client";

import { usePathname } from "next/navigation";
import { isCategoryBrowse, isHomeServicesPath, isPublicListingPath } from "@/shared/lib/public-paths";

const tabPad = "pb-[calc(5.5rem+env(safe-area-inset-bottom))]";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isServices = isHomeServicesPath(pathname);
  const isAddServicePicker = pathname === "/vendors/services";
  const isAddServiceForm = pathname.startsWith("/vendors/services/");
  const isMyOrders = pathname.startsWith("/vendors/my-orders");
  const isMyBookings = pathname === "/my-bookings";
  const isPosts = pathname.startsWith("/vendors/posts");
  const isHome = pathname === "/";
  const isListing = isPublicListingPath(pathname);
  const isProfessionals = isCategoryBrowse(pathname);
  const fullBleed = isServices;
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSupportChat = pathname.startsWith("/support/chat");
  const hideTabs = isAuth || isSupportChat;
  const pad = hideTabs ? "" : tabPad;

  return (
    <main
      id="main-content"
      className={
        isAuth
          ? "min-h-[calc(100dvh-3.5rem)] bg-[var(--auth-ivory)] p-0 md:min-h-[calc(100dvh-4rem)]"
          : isSupportChat
            ? "h-[100dvh] overflow-hidden bg-[#efeae2] p-0 md:h-[calc(100dvh-4rem)] md:px-6 md:py-4"
          : isProfessionals
          ? `min-h-[100dvh] bg-[var(--studio)] p-0 ${pad} md:mx-auto md:min-h-[70vh] md:max-w-7xl md:bg-transparent md:px-8 md:py-8 md:pb-16`
          : fullBleed
            ? `bg-white md:mx-auto md:max-w-[1180px] md:px-6 md:py-8 md:pb-28 max-md:h-[100dvh] max-md:overflow-hidden max-md:p-0 ${hideTabs ? "" : pad}`
            : isAddServicePicker
              ? `bg-white md:mx-auto md:max-w-[1180px] md:px-6 md:py-8 md:pb-28 max-md:h-[100dvh] max-md:overflow-hidden max-md:p-0`
              : isAddServiceForm
              ? `min-h-[70vh] bg-white ${pad} max-md:px-0 max-md:pt-0 md:mx-auto md:max-w-[1180px] md:bg-transparent md:px-6 md:pt-0 md:pb-28`
              : isMyOrders || isMyBookings || isPosts
              ? `min-h-[70vh] bg-[var(--studio)] ${pad} max-md:px-0 max-md:pt-0 md:mx-auto md:max-w-7xl md:bg-transparent md:px-8 md:pt-8 md:pb-16`
              : isHome
                ? `${pad} md:pb-0`
                : isListing
                  ? `min-h-[70vh] bg-[var(--studio)] ${pad} max-md:px-0 max-md:pt-0 md:mx-auto md:max-w-[1180px] md:px-6 md:py-8 md:pb-28`
                : `mx-auto min-h-[70vh] max-w-[1180px] bg-[var(--studio)] px-5 py-8 ${pad} md:bg-transparent md:px-6 md:pb-28`
      }
    >
      {children}
    </main>
  );
}
