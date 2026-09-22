export const SUPPORT_UNREAD_EVENT = "bookitall-support-unread";

export function refreshSupportUnread() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SUPPORT_UNREAD_EVENT));
}

export async function markSupportRead(token: string | null) {
  if (!token) return;
  const { api } = await import("@/shared/lib/api");
  await api("/notifications/read-support", { method: "PATCH", token });
  refreshSupportUnread();
}
