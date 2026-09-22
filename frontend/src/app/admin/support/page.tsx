"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { qs, useAdminList } from "@/features/admin/use-admin-list";
import { SupportInbox } from "@/features/support/support-chat-ui";
import { isClosedTicket, type SupportChat, type SupportTicketRow } from "@/features/support/types";

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-slate-500">Loading support…</p>}>
      <AdminSupportDesk />
    </Suspense>
  );
}

function AdminSupportDesk() {
  const search = useSearchParams();
  const token = useAdminAuth((s) => s.accessToken);
  const [bucket, setBucket] = useState<"progressing" | "closed">("progressing");
  const { rows, loading, error, reload } = useAdminList<SupportTicketRow>(
    `/admin/support${qs({ bucket, limit: "50" })}`,
    8000,
  );
  const [selectedId, setSelectedId] = useState<string | null>(search.get("chat"));
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const openChat = useCallback(
    async (id: string, silent = false) => {
      if (!token) return;
      setSelectedId(id);
      if (!silent) setChatLoading(true);
      try {
        const res = await api<SupportChat>(`/admin/support/${id}`, { token });
        if (res.data) {
          setChat(res.data);
          setBucket(isClosedTicket(res.data.status) ? "closed" : "progressing");
        }
      } finally {
        if (!silent) setChatLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const fromUrl = search.get("chat");
    if (fromUrl) void openChat(fromUrl);
  }, [search, openChat]);

  useEffect(() => {
    if (!token || !selectedId) return;
    const timer = setInterval(() => void openChat(selectedId, true), 5000);
    return () => clearInterval(timer);
  }, [token, selectedId, openChat]);

  async function setStatus(next: "IN_PROGRESS" | "RESOLVED") {
    if (!token || !selectedId) return;
    setBusyStatus(true);
    try {
      await api(`/admin/support/${selectedId}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await openChat(selectedId, true);
      await reload(true);
      setBucket(next === "RESOLVED" ? "closed" : "progressing");
    } finally {
      setBusyStatus(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[32rem] flex-col md:h-[calc(100dvh-8.5rem)]">
      <SupportInbox
        role="admin"
        bucket={bucket}
        onBucket={(next) => {
          setBucket(next);
          setSelectedId(null);
          setChat(null);
        }}
        rows={rows}
        loading={loading}
        error={error}
        selectedId={selectedId}
        onSelect={(id) => void openChat(id)}
        chat={chat}
        chatLoading={chatLoading}
        onBack={() => {
          setSelectedId(null);
          setChat(null);
        }}
        sending={sending}
        busyStatus={busyStatus}
        onClose={() => void setStatus("RESOLVED")}
        onReopen={() => void setStatus("IN_PROGRESS")}
        emptyList={bucket === "closed" ? "No closed tickets." : "No chats on progressing."}
        composerHint="Reply to customer"
        onSend={async (body) => {
          if (!token || !selectedId) return;
          setSending(true);
          try {
            await api(`/admin/support/${selectedId}/messages`, {
              token,
              method: "POST",
              body: JSON.stringify({ body }),
            });
            await openChat(selectedId, true);
            await reload(true);
          } finally {
            setSending(false);
          }
        }}
      />
    </div>
  );
}
