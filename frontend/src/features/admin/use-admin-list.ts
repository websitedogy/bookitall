"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";

export function useAdminList<T>(path: string | null, pollMs = 12000) {
  const token = useAdminAuth((s) => s.accessToken);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (silent = false) => {
    if (!token || !path) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await api<T[]>(path, { token });
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
      setTotalPages(res.meta?.totalPages ?? 0);
      setError("");
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Could not load");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, path]);

  useEffect(() => {
    void reload();
    if (!pollMs) return;
    const timer = setInterval(() => void reload(true), pollMs);
    return () => clearInterval(timer);
  }, [reload, pollMs]);

  return { rows, total, totalPages, loading, error, reload, token };
}

export const ROW_OPTIONS = [
  { id: "50", label: "50" },
  { id: "100", label: "100" },
  { id: "250", label: "250" },
  { id: "500", label: "500" },
  { id: "1000", label: "1000" },
  { id: "all", label: "All" },
];

export const ALL_ROWS = 10000;

export function rowLimit(value: string) {
  return value === "all" ? ALL_ROWS : Number(value) || 50;
}

export function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}
