"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/store";
import { DesktopServicesLayout, InnerPageShell } from "@/features/public-site";
import { VendorPostsFeed } from "./vendor-posts-feed";
import { VendorWallet, VendorWalletHistory } from "./vendor-wallet";
import { cn } from "@/shared/lib/cn";

type Tab = "posts" | "wallet" | "history";

export function VendorPostsPage() {
  const user = useAuth((s) => s.user);
  const isVendor = Boolean(user);
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <DesktopServicesLayout>
      <InnerPageShell
        kicker="Vendor"
        title="My Services"
        subtitle="Your live listings and wallet."
        tabs={
          isVendor ? (
            <div className="flex flex-wrap gap-1 px-3 pt-2 md:px-7">
              <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
                My Services
              </TabButton>
              <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")}>
                Wallet
              </TabButton>
              <TabButton active={tab === "history"} onClick={() => setTab("history")}>
                Wallet History
              </TabButton>
            </div>
          ) : null
        }
      >
        <div className="pb-4">
          {isVendor && tab === "wallet" ? (
            <VendorWallet />
          ) : isVendor && tab === "history" ? (
            <VendorWalletHistory />
          ) : (
            <VendorPostsFeed compact={!isVendor} />
          )}
        </div>
      </InnerPageShell>
    </DesktopServicesLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold",
        active ? "bg-[var(--primary)] text-white" : "text-[var(--studio-muted)] hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
