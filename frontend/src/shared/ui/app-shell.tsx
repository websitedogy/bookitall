"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useAuthHydrated, isPanelRole, type AuthUser } from "@/features/auth/store";

export function AppShell({
  role,
  title,
  nav,
  children,
}: {
  role: AuthUser["role"];
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const pathname = usePathname();
  const router = useRouter();
  const ready = useAuthHydrated();
  const loginHref = isPanelRole(role) ? "/admin/login" : `/login?next=${encodeURIComponent(pathname || "/")}`;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(loginHref);
    }
  }, [ready, user, router, loginHref]);

  if (!ready) {
    return <div className="p-10 text-sm text-[var(--ink-soft)]">Checking access…</div>;
  }

  if (!user) {
    return <div className="p-10 text-sm text-[var(--ink-soft)]">Redirecting to sign in…</div>;
  }

  if (user.role !== role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title} login needed</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          You are signed in as {user.fullName}. Sign in with the {title.toLowerCase()} account to continue.
        </p>
        <div className="mt-8 grid gap-2">
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace(loginHref);
            }}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            {role === "SUPER_ADMIN" ? "Go to admin login" : "Sign in"}
          </button>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (role === "PARTNER") {
    return (
      <div className="min-h-screen bg-[var(--cream)]">
        <header className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 md:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="serif text-2xl text-[var(--ink)]">
                Book It All
              </Link>
              <nav aria-label={`${title} navigation`} className="flex flex-wrap items-center gap-1 text-sm">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`rounded-full px-4 py-2 font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "text-[var(--ink-soft)] hover:bg-slate-50 hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="max-w-48 truncate text-[var(--ink-soft)]">{user.fullName}</span>
              <button onClick={logout} className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 pb-28 md:px-8 md:pb-32">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--teal-dark)] p-6 text-[var(--cream)] md:min-h-screen md:border-b-0">
        <Link href="/" className="serif text-2xl">
          Book It All
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">{title}</p>
        <nav className="mt-8 grid gap-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 ${pathname === item.href ? "bg-[var(--gold)] text-[var(--ink)]" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mt-10 text-sm text-[var(--sand)]">
          Sign out
        </button>
      </aside>
      <section className="px-5 py-8 md:px-10">
        <p className="text-sm text-[var(--ink-soft)]">{user.fullName}</p>
        {children}
      </section>
    </div>
  );
}
