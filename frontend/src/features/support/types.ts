export type SupportTicketRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
  bookingRef: string | null;
  status: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSender?: "USER" | "ADMIN";
  createdAt: string;
};

export type SupportMessage = {
  id: string;
  sender: "USER" | "ADMIN";
  body: string;
  createdAt: string;
};

export type SupportChat = SupportTicketRow & {
  messages: SupportMessage[];
};

export function isClosedTicket(status?: string) {
  return status === "RESOLVED";
}

export function ticketStatusLabel(status?: string) {
  return isClosedTicket(status) ? "Closed" : "On progressing";
}

export function formatChatTime(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function previewText(value?: string | null) {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return "No messages yet";
  return text.length > 56 ? `${text.slice(0, 56)}…` : text;
}
