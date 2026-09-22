import type { Metadata } from "next";
import { UserSupportChat } from "@/features/support/user-support-chat";

export const metadata: Metadata = {
  title: "Chat with Support",
  robots: { index: false, follow: false },
};

export default function SupportChatPage() {
  return (
    <div className="h-full min-h-0">
      <UserSupportChat />
    </div>
  );
}
