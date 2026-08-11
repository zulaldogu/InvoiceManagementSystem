"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthorizationProvider } from "@/components/authorization-context";

import AccountSettingsPanel from "@/components/account-settings-panel";
import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api";
import type { CurrentAuthorization } from "@/types/authorization";
import type { CurrentUser } from "@/types/auth";
import type { User } from "@/types/user";

type AppShellProps = {
  children: ReactNode;
};

type IconName =
  | "dashboard"
  | "customers"
  | "products"
  | "invoices"
  | "companies"
  | "users"
  | "authorization";

type NavigationItem = {
  label: string;
  href: string;
  icon: IconName;
  requiredRoles?: string[];
};

const navigation: NavigationItem[] = [
  {
    label: "Genel Bakış",
    href: "/",
    icon: "dashboard",
    requiredRoles: [
      "VIEW_CUSTOMERS",
      "MANAGE_PRODUCTS",
      "VIEW_INVOICES",
    ],
  },
  {
    label: "Faturalar",
    href: "/invoices",
    icon: "invoices",
    requiredRoles: ["VIEW_INVOICES"],
  },
  {
    label: "Müşteriler",
    href: "/customers",
    icon: "customers",
    requiredRoles: ["VIEW_CUSTOMERS"],
  },
  {
    label: "Ürün ve Hizmetler",
    href: "/products",
    icon: "products",
    requiredRoles: ["MANAGE_PRODUCTS"],
  },
];

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
    companies: (
      <>
        <path d="M3 21h18" />
        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M9 7h2" />
        <path d="M13 7h2" />
        <path d="M9 11h2" />
        <path d="M13 11h2" />
        <path d="M9 15h2" />
        <path d="M13 15h2" />
      </>
    ),
    users: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    authorization: (
      <>
        <path d="M12 3 4 7v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
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

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function hasRole(
  user: CurrentUser,
  authorization: CurrentAuthorization,
  roleName: string,
) {
  return (
    user.IsSuperAdmin ||
    authorization.Roles.includes("*") ||
    authorization.Roles.includes(roleName)
  );
}

function hasAllRoles(
  user: CurrentUser,
  authorization: CurrentAuthorization,
  roleNames: string[],
) {
  return roleNames.every((roleName) =>
    hasRole(user, authorization, roleName),
  );
}

function canAccessPath(
  pathname: string,
  user: CurrentUser,
  authorization: CurrentAuthorization,
) {
  if (user.IsSuperAdmin) {
    return true;
  }

  if (pathname === "/") {
    return hasAllRoles(user, authorization, [
      "VIEW_CUSTOMERS",
      "MANAGE_PRODUCTS",
      "VIEW_INVOICES",
    ]);
  }

  if (pathname === "/invoices/new") {
    return hasRole(
      user,
      authorization,
      "MANAGE_INVOICES",
    );
  }

  if (
    pathname.startsWith("/invoices/") &&
    pathname.endsWith("/edit")
  ) {
    return hasRole(
      user,
      authorization,
      "MANAGE_INVOICES",
    );
  }

  if (pathname.startsWith("/invoices")) {
    return hasRole(
      user,
      authorization,
      "VIEW_INVOICES",
    );
  }

  if (pathname.startsWith("/customers")) {
    return hasRole(
      user,
      authorization,
      "VIEW_CUSTOMERS",
    );
  }

  if (pathname.startsWith("/products")) {
    return hasRole(
      user,
      authorization,
      "MANAGE_PRODUCTS",
    );
  }

  if (pathname.startsWith("/authorization")) {
    return false;
  }

  return true;
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [authorization, setAuthorization] =
    useState<CurrentAuthorization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [
    isAccountSettingsOpen,
    setIsAccountSettingsOpen,
  ] = useState(false);

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

    Promise.all([
      apiRequest<CurrentUser>("/auth/me"),
      apiRequest<CurrentAuthorization>(
        "/auth/me/authorization",
      ),
    ])
      .then(([user, authorizationData]) => {
        if (!isActive) {
          return;
        }

        setCurrentUser(user);
        setAuthorization(authorizationData);
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

  useEffect(() => {
    if (
      !currentUser ||
      !authorization ||
      isLoginPage ||
      canAccessPath(
        pathname,
        currentUser,
        authorization,
      )
    ) {
      return;
    }

    router.replace("/companies");
  }, [
    authorization,
    currentUser,
    isLoginPage,
    pathname,
    router,
  ]);

  function handleLogout() {
    clearAccessToken();
    setCurrentUser(null);
    setAuthorization(null);
    setIsMobileMenuOpen(false);
    setIsAccountSettingsOpen(false);
    router.replace("/login");
    router.refresh();
  }

  function handleUserUpdated(user: User) {
    setCurrentUser(user);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (
    isLoading ||
    !currentUser ||
    !authorization
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />

          <p className="mt-4 text-sm text-text-muted">
            Oturum ve yetkiler doğrulanıyor...
          </p>
        </div>
      </main>
    );
  }

  const visibleNavigation = [
    ...navigation.filter((item) => {
      if (currentUser.IsSuperAdmin) {
        return true;
      }

      return item.requiredRoles
        ? hasAllRoles(
            currentUser,
            authorization,
            item.requiredRoles,
          )
        : true;
    }),
    {
      label: currentUser.IsSuperAdmin
        ? "Firmalar"
        : "Firma Bilgilerim",
      href: "/companies",
      icon: "companies" as const,
    },
    {
      label: currentUser.IsSuperAdmin
        ? "Kullanıcılar"
        : "Firma Kullanıcıları",
      href: "/users",
      icon: "users" as const,
    },
    ...(currentUser.IsSuperAdmin
      ? [
          {
            label: "Rol ve Profiller",
            href: "/authorization",
            icon: "authorization" as const,
          },
        ]
      : []),
  ];

  const canCreateInvoice = hasRole(
    currentUser,
    authorization,
    "MANAGE_INVOICES",
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isAccountSettingsOpen && (
        <AccountSettingsPanel
          currentUser={currentUser}
          onClose={() =>
            setIsAccountSettingsOpen(false)
          }
          onUpdated={handleUserUpdated}
          onLogout={handleLogout}
        />
      )}

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-app-border bg-surface transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-app-border px-5">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-9 w-9 text-sm shrink-0 items-center justify-center rounded-md bg-primary font-bold text-white">
              FY
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-primary-dark">
                Fatura Yönetimi
              </span>
              <span className="block truncate text-xs text-text-muted">
                Kurumsal Panel
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={closeMobileMenu}
            className="rounded-md p-2 text-text-muted transition hover:bg-surface-muted hover:text-primary lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {canCreateInvoice && (
          <div className="px-4 pt-4">
            <Link
              href="/invoices/new"
              onClick={closeMobileMenu}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              <span className="text-xl leading-none">
                +
              </span>
              Yeni Fatura Oluştur
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Ana Menü
          </p>

          {visibleNavigation.map((item) => {
            const isActive = isActiveRoute(
              pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary-soft text-primary-dark"
                    : "text-text-muted hover:bg-surface-muted hover:text-primary-dark"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />
                )}

                <NavigationIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-app-border bg-surface/95 px-5 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menüyü aç"
              aria-expanded={isMobileMenuOpen}
              onClick={() =>
                setIsMobileMenuOpen(true)
              }
              className="rounded-md p-2 text-text-muted transition hover:bg-surface-muted hover:text-primary lg:hidden"
            >
              <MenuIcon />
            </button>

            <p className="text-base font-semibold text-foreground">
              Fatura Yönetim Sistemi
            </p>
          </div>

          <button
            type="button"
            aria-label="Hesap ayarlarını aç"
            aria-expanded={isAccountSettingsOpen}
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsAccountSettingsOpen(true);
            }}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-muted"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">
                {currentUser.UserName}
              </p>

              <p className="text-xs text-text-muted">
                {currentUser.IsSuperAdmin
                  ? "Süper Yönetici"
                  : `Firma #${currentUser.CompanyId}`}
              </p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-dark">
              {currentUser.UserName
                .charAt(0)
                .toUpperCase()}
            </span>

            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-app-border text-lg text-text-muted"
            >
              ⚙
            </span>
          </button>
        </header>

        <AuthorizationProvider
          currentUser={currentUser}
          authorization={authorization}
        >
          <div>{children}</div>
        </AuthorizationProvider>      </div>
    </div>
  );
}