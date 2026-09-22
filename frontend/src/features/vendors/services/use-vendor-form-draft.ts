"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/features/auth/store";

const memory = new Map<string, Record<string, unknown>>();

function persistedUserId() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("bookitall-auth");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { state?: { user?: { id?: string } } };
    return parsed.state?.user?.id || "";
  } catch {
    return "";
  }
}

function storageKey(formId: string, userId: string) {
  return `bookitall-vendor-form:${formId}:${userId}`;
}

function readBlob(key: string) {
  if (memory.has(key)) return memory.get(key)!;
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, unknown>;
    memory.set(key, parsed);
    return parsed;
  } catch {
    const empty = {};
    memory.set(key, empty);
    return empty;
  }
}

function readJson<T>(key: string, field: string, fallback: T): T {
  const value = readBlob(key)[field];
  return value === undefined ? fallback : (value as T);
}

function writeJson(key: string, field: string, value: unknown) {
  if (typeof window === "undefined") return;
  const blob = readBlob(key);
  blob[field] = value;
  memory.set(key, blob);
  window.localStorage.setItem(key, JSON.stringify(blob));
}

type StoredFile = { name: string; type: string; lastModified: number; buffer: ArrayBuffer };

function openDraftDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open("bookitall-vendor-drafts", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("files")) req.result.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function fileToStored(file: File): Promise<StoredFile> {
  return {
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    buffer: await file.arrayBuffer(),
  };
}

function storedToFile(row: StoredFile) {
  return new File([row.buffer], row.name, { type: row.type, lastModified: row.lastModified });
}

async function readStoredFiles(key: string, field: string): Promise<StoredFile[] | StoredFile | null | undefined> {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("files").objectStore("files").get(`${key}:${field}`);
    req.onsuccess = () => resolve(req.result as StoredFile[] | StoredFile | null | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function writeStoredFiles(key: string, field: string, value: StoredFile[] | StoredFile | null) {
  const db = await openDraftDb();
  return new Promise<void>((resolve, reject) => {
    const store = db.transaction("files", "readwrite").objectStore("files");
    const req = value == null || (Array.isArray(value) && value.length === 0) ? store.delete(`${key}:${field}`) : store.put(value, `${key}:${field}`);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function useDraftKey(formId: string) {
  const liveId = useAuth((s) => s.user?.id);
  return storageKey(formId, liveId || persistedUserId() || "guest");
}

export function useDraftState<T>(formId: string, field: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const key = useDraftKey(formId);
  const [value, setValue] = useState<T>(() => readJson(key, field, initial));

  useEffect(() => {
    setValue(readJson(key, field, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, field]);

  useEffect(() => {
    writeJson(key, field, value);
  }, [key, field, value]);

  return [value, setValue];
}

export function useDraftFile(formId: string, field: string): [File | null, Dispatch<SetStateAction<File | null>>] {
  const key = useDraftKey(formId);
  const [value, setValue] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    skip.current = true;
    void readStoredFiles(key, field)
      .then((row) => {
        if (cancelled) return;
        if (row && !Array.isArray(row)) setValue((current) => current ?? storedToFile(row));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key, field]);

  useEffect(() => {
    if (!ready) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    void (async () => {
      const stored = value ? await fileToStored(value) : null;
      await writeStoredFiles(key, field, stored);
    })().catch(() => undefined);
  }, [key, field, value, ready]);

  return [value, setValue];
}

export function useDraftFiles(formId: string, field: string): [File[], Dispatch<SetStateAction<File[]>>] {
  const key = useDraftKey(formId);
  const [value, setValue] = useState<File[]>([]);
  const [ready, setReady] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    skip.current = true;
    void readStoredFiles(key, field)
      .then((row) => {
        if (cancelled) return;
        if (Array.isArray(row) && row.length) {
          const files = row.map(storedToFile);
          setValue((current) => (current.length ? current : files));
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key, field]);

  useEffect(() => {
    if (!ready) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    void (async () => {
      const stored = await Promise.all(value.map(fileToStored));
      await writeStoredFiles(key, field, stored);
    })().catch(() => undefined);
  }, [key, field, value, ready]);

  return [value, setValue];
}
