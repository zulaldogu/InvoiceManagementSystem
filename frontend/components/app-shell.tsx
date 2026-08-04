"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api";
import type { CurrentUser } from "@/types/auth";

type AppShellProps = {
  children: ReactNode;
};

type IconName = "dashboard" | "customers" | "products" | "invoices";

const navigation: {
  label: string;
  href: string;
  icon: IconName;
}[] = [
  {
    label: "Genel Bakış",
    href: "/",
    icon: "dashboard",
  },
  {
    label: "Müşteriler",
    href: "/customers",
    icon: "customers",
  },
  {
    label: "Ürünler",
    href: "/products",
    icon: "products",
  },
  {
    label: "Faturalar",
    href: "/invoices",
    icon: "invoices",
  },
];

const pageTitles: Record<string, string> = {
  "/": "Genel Bakış",
  "/customers": "Müşteriler",
  "/products": "Ürünler",
  "/invoices": "Faturalar",
};

function NavigationIcon({ name }: { name: IconName }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    customers: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    products: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    invoices: (
      <>
        <path d="M6 2h9l5 5v15H6z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    let isActive = true;

    apiRequest<CurrentUser>("/auth/me")
      .then((user) => {
        if (!isActive) {
          return;
        }

        setCurrentUser(user);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        clearAccessToken();
        router.replace("/login");
      });

    return () => {
      isActive = false;
    };
  }, [isLoginPage, router]);

  function handleLogout() {
    clearAccessToken();
    setCurrentUser(null);
    router.replace("/login");
    router.refresh();
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
          <p className="mt-4 text-sm text-slate-400">
            Oturum doğrulanıyor...
          </p>
        </div>
      </main>
    );
  }

  const pageTitle =
    pageTitles[pathname] ??
    (pathname.startsWith("/invoices/")
      ? "Fatura Detayı"
      : "Yönetim Paneli");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950">
            FY
          </span>

          <div>
            <p className="font-semibold">Fatura Yönetimi</p>
            <p className="text-xs text-slate-500">Kurumsal Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Ana Menü
          </p>

          {navigation.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <NavigationIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-semibold text-cyan-300">
                {currentUser.UserName.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {currentUser.UserName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUser.IsSuperAdmin
                    ? "Süper Yönetici"
                    : `Firma #${currentUser.CompanyId}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
            >
              Oturumu kapat
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 backdrop-blur lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Fatura Yönetim Sistemi
            </p>
            <h1 className="mt-1 text-lg font-semibold">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <span className="text-sm font-medium">
              {currentUser.UserName}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs"
            >
              Çıkış
            </button>
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  );
}