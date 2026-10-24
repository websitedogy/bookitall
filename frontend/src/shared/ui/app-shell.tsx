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
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 md:flex md:justify-between md:gap-8 md:px-8 md:py-4">
            <div className="contents md:flex md:min-w-0 md:items-center md:gap-8">
              <Link href="/" className="serif w-fit shrink-0 whitespace-nowrap text-xl leading-none text-[var(--ink)] sm:text-2xl">
                Book It All
              </Link>
              <nav
                aria-label={`${title} navigation`}
                className="col-span-2 -mx-4 flex min-w-0 items-center gap-1 overflow-x-auto border-t border-[var(--line)] px-3 pt-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-5 md:mx-0 md:col-span-1 md:overflow-visible md:border-0 md:px-0 md:pt-0"
              >
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`shrink-0 rounded-full px-3 py-2 font-medium transition-colors sm:px-4 ${
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
            <div className="flex items-center justify-end text-sm">
              <span className="hidden max-w-48 truncate text-[var(--ink-soft)] sm:block">{user.fullName}</span>
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
