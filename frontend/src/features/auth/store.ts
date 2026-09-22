"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProfileGender = "MALE" | "FEMALE" | "OTHER";
export type ProfileStatus = "PENDING" | "COMPLETE";

export type AuthUser = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: ProfileGender | null;
  personalAddress?: string | null;
  pincode?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  profileStatus?: ProfileStatus;
  missingFields?: string[];
  role: "CUSTOMER" | "PARTNER" | "DRIVER" | "TECHNICIAN" | "SUPER_ADMIN" | "SUB_EDITOR";
  partnerType?: string | null;
  businessName?: string | null;
  lastSeenAt?: string | null;
  isOnline?: boolean;
};

type SessionPayload = { accessToken: string; refreshToken: string; user: AuthUser };

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (payload: SessionPayload) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
};

export function isPanelRole(role?: AuthUser["role"] | string | null) {
  return role === "SUPER_ADMIN" || role === "SUB_EDITOR";
}

export function isSuperAdmin(role?: AuthUser["role"] | string | null) {
  return role === "SUPER_ADMIN";
}

function createAuthStore(name: string) {
  return create<AuthState>()(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        user: null,
        setSession: (payload) => set(payload),
        updateUser: (patch) =>
          set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),
        logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      }),
      { name },
    ),
  );
}

export const useAdminAuth = createAuthStore("bookitall-admin-auth");

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (payload) => {
        if (isPanelRole(payload.user.role)) {
          useAdminAuth.getState().setSession(payload);
          return;
        }
        set(payload);
      },
      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "bookitall-auth",
      onRehydrateStorage: () => (state) => {
        if (!state?.user || !isPanelRole(state.user.role)) return;
        useAdminAuth.setState({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
        });
        state.logout();
      },
    },
  ),
);

export function homeForRole(role?: AuthUser["role"]) {
  switch (role) {
    case "SUPER_ADMIN":
    case "SUB_EDITOR":
      return "/admin";
    default:
      return "/";
  }
}

function usePersistedHydrated(store: { persist?: { hasHydrated?: () => boolean; onFinishHydration?: (cb: () => void) => () => void } }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const persistApi = store.persist;
    if (persistApi?.hasHydrated?.()) {
      setReady(true);
      return;
    }
    const unsub = persistApi?.onFinishHydration?.(() => setReady(true));
    const timeout = window.setTimeout(() => setReady(true), 0);
    return () => {
      unsub?.();
      window.clearTimeout(timeout);
    };
  }, [store]);
  return ready;
}

export function useAuthHydrated() {
  return usePersistedHydrated(useAuth as typeof useAuth & Parameters<typeof usePersistedHydrated>[0]);
}

export function useAdminAuthHydrated() {
  const marketReady = useAuthHydrated();
  const adminReady = usePersistedHydrated(useAdminAuth as typeof useAdminAuth & Parameters<typeof usePersistedHydrated>[0]);
  return marketReady && adminReady;
}
