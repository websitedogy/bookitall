"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth, useAuthHydrated } from "@/features/auth/store";
import { SupportInbox } from "./support-chat-ui";
import { markSupportRead } from "./unread";
import { type SupportChat, type SupportTicketRow } from "./types";

export function UserSupportChat() {
  const router = useRouter();
  const ready = useAuthHydrated();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const [bucket, setBucket] = useState<"progressing" | "closed">("progressing");
  const [rows, setRows] = useState<SupportTicketRow[]>([]);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [bootError, setBootError] = useState("");

  const loadList = useCallback(
    async (nextBucket = bucket, silent = false) => {
      if (!token) return [];
      if (!silent) {
        setListLoading(true);
        setListError("");
      }
      try {
        const res = await api<SupportTicketRow[]>(`/support/chats?bucket=${nextBucket}&limit=50`, { token });
        const data = res.data ?? [];
        setRows(data);
        return data;
      } catch (err) {
        setRows([]);
        setListError(err instanceof Error ? err.message : "Could not load chats");
        return [];
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [bucket, token],
  );

  const openChat = useCallback(
    async (id: string, silent = false) => {
      if (!token) return;
      setSelectedId(id);
      if (!silent) setChatLoading(true);
      try {
        const res = await api<SupportChat>(`/support/chats/${id}`, { token });
        if (res.data) setChat(res.data);
        void markSupportRead(token).catch(() => undefined);
      } catch (err) {
        setBootError(err instanceof Error ? err.message : "Could not open chat");
      } finally {
        if (!silent) setChatLoading(false);
      }
    },
    [token],
  );

  const startNewChat = useCallback(async () => {
    if (!token) return;
    setBootError("");
    setBucket("progressing");
    setChatLoading(true);
    try {
      const started = await api<SupportChat>("/support/chats?force=1", { token, method: "POST" });
      if (started.data) {
        setChat(started.data);
        setSelectedId(started.data.id);
      }
      await loadList("progressing");
    } catch (err) {
      setBootError(err instanceof Error ? err.message : "Could not start chat");
    } finally {
      setChatLoading(false);
    }
  }, [token, loadList]);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?next=/support/chat");
  }, [ready, user, router]);

  useEffect(() => {
    if (!token) return;
    let live = true;
    async function boot() {
      const data = await loadList("progressing");
      if (!live) return;
      if (data[0]) await openChat(data[0].id);
    }
    void boot();
    return () => {
      live = false;
    };
  }, [token, loadList, openChat]);

  useEffect(() => {
    if (!token) return;
    void loadList(bucket);
  }, [bucket, loadList, token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    const timer = setInterval(() => {
      void openChat(selectedId, true);
      void loadList(bucket, true);
    }, 4000);
    return () => clearInterval(timer);
  }, [token, selectedId, bucket, openChat, loadList]);

  if (!ready || !user) {
    return <p className="px-4 py-10 text-sm text-[var(--text-muted)]">Opening support…</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {bootError ? <p className="bg-rose-50 px-4 py-2 text-sm text-rose-700">{bootError}</p> : null}
      <div className="min-h-0 flex-1">
        <SupportInbox
          role="user"
          bucket={bucket}
          onBucket={(next) => {
            setBucket(next);
            setSelectedId(null);
            setChat(null);
          }}
          rows={rows}
          loading={listLoading}
          error={listError}
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
          emptyList={bucket === "closed" ? "No closed tickets yet." : "No chats yet. Tap New chat and type your message."}
          composerHint="Type a message"
          onNewChat={() => void startNewChat()}
          onClose={() => {
            if (!token || !selectedId) return;
            void (async () => {
              setBusyStatus(true);
              try {
                await api(`/support/chats/${selectedId}`, {
                  token,
                  method: "PATCH",
                  body: JSON.stringify({ status: "RESOLVED" }),
                });
                await openChat(selectedId, true);
                setBucket("closed");
                await loadList("closed");
              } finally {
                setBusyStatus(false);
              }
            })();
          }}
          onSend={async (body) => {
            if (!token || !selectedId) return;
            setSending(true);
            try {
              await api(`/support/chats/${selectedId}/messages`, {
                token,
                method: "POST",
                body: JSON.stringify({ body }),
              });
              await openChat(selectedId, true);
              await loadList("progressing", true);
            } finally {
              setSending(false);
            }
          }}
        />
      </div>
      <p className="hidden px-4 py-2 text-center text-xs text-slate-500 md:block">
        Prefer email or phone?{" "}
        <Link href="/contact" className="font-medium text-[#0f766e]">
          Contact Support
        </Link>
      </p>
    </div>
  );
}
