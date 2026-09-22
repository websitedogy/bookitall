"use client";

import { FormEvent, useEffect, useRef } from "react";
import { ArrowLeft, CheckCheck, Headphones, SendHorizonal } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  formatChatTime,
  isClosedTicket,
  previewText,
  ticketStatusLabel,
  type SupportChat,
  type SupportMessage,
  type SupportTicketRow,
} from "./types";

export function SupportInbox({
  role,
  bucket,
  onBucket,
  rows,
  loading,
  error,
  selectedId,
  onSelect,
  chat,
  chatLoading,
  onBack,
  onSend,
  sending,
  onClose,
  onReopen,
  onNewChat,
  busyStatus,
  emptyList,
  composerHint,
}: {
  role: "user" | "admin";
  bucket: "progressing" | "closed";
  onBucket: (bucket: "progressing" | "closed") => void;
  rows: SupportTicketRow[];
  loading?: boolean;
  error?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  chat: SupportChat | null;
  chatLoading?: boolean;
  onBack: () => void;
  onSend: (body: string) => Promise<void> | void;
  sending?: boolean;
  onClose?: () => void;
  onReopen?: () => void;
  onNewChat?: () => void;
  busyStatus?: boolean;
  emptyList: string;
  composerHint: string;
}) {
  const mine = role === "user" ? "USER" : "ADMIN";
  const closed = isClosedTicket(chat?.status);
  const peerName = role === "user" ? "Book It All Support" : chat?.name || "Customer";
  const peerMeta =
    role === "user"
      ? ticketStatusLabel(chat?.status)
      : [chat?.phone, chat?.email].filter(Boolean).join(" · ");

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-none bg-[#efeae2] shadow-sm ring-0 md:rounded-3xl md:ring-1 md:ring-black/5">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-black/5 bg-white md:w-[320px] lg:w-[360px]",
          selectedId ? "hidden md:flex" : "flex",
        )}
      >
        <div className="flex items-end justify-between gap-3 bg-[#0f766e] px-4 py-3 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {role === "user" ? "Support" : "User support"}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">
              {role === "user" ? "Chat with Support" : "Customer chats"}
            </p>
          </div>
          {role === "user" && onNewChat ? (
            <button
              type="button"
              onClick={onNewChat}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              New chat
            </button>
          ) : null}
        </div>
        <div className="flex gap-2 border-b border-slate-100 px-3 py-2.5">
          <BucketChip active={bucket === "progressing"} onClick={() => onBucket("progressing")}>
            On progressing
          </BucketChip>
          <BucketChip active={bucket === "closed"} onClick={() => onBucket("closed")}>
            Closed tickets
          </BucketChip>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Loading chats…</p>
          ) : error ? (
            <p className="px-4 py-10 text-center text-sm text-rose-600">{error}</p>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-500">{emptyList}</p>
              {role === "user" && onNewChat && bucket === "progressing" ? (
                <button
                  type="button"
                  onClick={onNewChat}
                  className="mt-3 rounded-full bg-[#0f766e] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Start a new chat
                </button>
              ) : null}
            </div>
          ) : (
            <ul>
              {rows.map((row) => {
                const active = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(row.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                        active ? "bg-[#e7f6f3]" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-sm font-semibold text-white">
                        {role === "user" ? <Headphones className="h-5 w-5" /> : initialsFor(row.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {role === "user" ? "Support" : row.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatChatTime(row.lastMessageAt || row.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-slate-500">
                          {row.lastSender === "ADMIN" && role === "user" ? "Support: " : null}
                          {row.lastSender === "USER" && role === "admin" ? `${row.name.split(" ")[0]}: ` : null}
                          {previewText(row.lastMessage || row.message)}
                        </span>
                        <span
                          className={cn(
                            "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            isClosedTicket(row.status) ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800",
                          )}
                        >
                          {ticketStatusLabel(row.status)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className={cn("flex min-w-0 flex-1 flex-col", selectedId ? "flex" : "hidden md:flex")}>
        {selectedId && chat ? (
          <>
            <header className="flex items-center gap-3 bg-[#0f766e] px-3 py-2.5 text-white md:px-4">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 md:hidden"
                aria-label="Back to chats"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                {role === "user" ? <Headphones className="h-5 w-5" /> : <span className="text-sm font-semibold">{initialsFor(peerName)}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-5">{peerName}</p>
                <p className="truncate text-xs text-white/75">{peerMeta}</p>
              </div>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold">
                {ticketStatusLabel(chat.status)}
              </span>
              {closed && onReopen ? (
                <button
                  type="button"
                  disabled={busyStatus}
                  onClick={onReopen}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
                >
                  Reopen
                </button>
              ) : null}
              {!closed && onClose ? (
                <button
                  type="button"
                  disabled={busyStatus}
                  onClick={onClose}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
                >
                  Close
                </button>
              ) : null}
            </header>
            <ChatThread messages={chat.messages} mine={mine} role={role} loading={chatLoading} />
            {closed ? (
              <div className="border-t border-black/5 bg-[#f0f2f5] px-4 py-3 text-center">
                <p className="text-sm text-slate-500">This ticket is closed.</p>
                {onNewChat ? (
                  <button
                    type="button"
                    onClick={onNewChat}
                    className="mt-2 rounded-full bg-[#0f766e] px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Start a new chat
                  </button>
                ) : null}
              </div>
            ) : (
              <ChatComposer onSend={onSend} sending={sending} placeholder={composerHint} />
            )}
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center bg-[#efeae2] text-center md:flex">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0f766e] text-white">
              <Headphones className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-800">
              {role === "user" ? "Pick a support chat" : "Pick a customer chat"}
            </p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Same WhatsApp-style thread on both sides — your messages stay on the right.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ChatThread({
  messages,
  mine,
  role,
  loading,
}: {
  messages: SupportMessage[];
  mine: "USER" | "ADMIN";
  role: "user" | "admin";
  loading?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6"
      style={{
        backgroundColor: "#efeae2",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(15,118,110,0.06), transparent 28%), radial-gradient(circle at 80% 90%, rgba(15,118,110,0.05), transparent 24%)",
      }}
    >
      {loading && messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Opening chat…</p>
      ) : messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Say hello — support will reply here.</p>
      ) : (
        <ul className="space-y-1.5">
          {messages.map((row) => {
            const own = row.sender === mine;
            return (
              <li key={row.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[82%] rounded-lg px-3 py-1.5 shadow-sm md:max-w-[68%]",
                    own ? "rounded-tr-none bg-[#d9fdd3] text-slate-900" : "rounded-tl-none bg-white text-slate-900",
                  )}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-6">{row.body}</p>
                  <p className={cn("mt-1 flex items-center justify-end gap-1", own ? "text-slate-600" : "text-slate-500")}>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                        own ? "bg-[#b7e4b0] text-[#146c2e]" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {own ? "You" : role === "user" ? "Support" : "Customer"}
                    </span>
                    <span className="text-[10px]">{formatChatTime(row.createdAt)}</span>
                    {own ? <CheckCheck className="h-3 w-3 text-[#53bdeb]" /> : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={endRef} />
    </div>
  );
}

function ChatComposer({
  onSend,
  sending,
  placeholder,
}: {
  onSend: (body: string) => Promise<void> | void;
  sending?: boolean;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!value || sending) return;
    await onSend(value);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2.5">
      <input
        ref={inputRef}
        type="text"
        maxLength={4000}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 rounded-full border-0 bg-white px-4 text-[15px] text-slate-900 outline-none ring-1 ring-black/5 placeholder:text-slate-400"
      />
      <button
        type="submit"
        disabled={sending}
        aria-label="Send"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0f766e] text-white shadow-sm hover:bg-[#0b5f59] disabled:opacity-50"
      >
        <SendHorizonal className="h-5 w-5" />
      </button>
    </form>
  );
}

function BucketChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-[#0f766e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
