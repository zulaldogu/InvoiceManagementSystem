"use client";

import { useEffect, useState } from "react";

import UserFormModal from "@/components/user-form-modal";
import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/types/auth";
import type { Company } from "@/types/company";
import type { User } from "@/types/user";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("tr-TR");
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] =
    useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [deactivatingUserId, setDeactivatingUserId] =
    useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPage() {
      try {
        const user =
          await apiRequest<CurrentUser>("/auth/me");

        if (!isActive) {
          return;
        }

        setCurrentUser(user);

        const usersRequest =
          apiRequest<User[]>("/users/");

        const companiesRequest = user.IsSuperAdmin
          ? apiRequest<Company[]>("/companies/")
          : apiRequest<Company>("/companies/current").then(
              (company) => [company],
            );

        const [userData, companyData] =
          await Promise.all([
            usersRequest,
            companiesRequest,
          ]);

        if (!isActive) {
          return;
        }

        setUsers(userData);
        setCompanies(companyData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Kullanıcı bilgileri alınırken beklenmeyen bir hata oluştu.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isActive = false;
    };
  }, []);

  async function refreshUsers() {
    setError(null);

    try {
      const data = await apiRequest<User[]>("/users/");
      setUsers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kullanıcılar yenilenirken beklenmeyen bir hata oluştu.",
      );
    }
  }

  function openCreateForm() {
    setEditingUser(null);
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEditForm(user: User) {
    setEditingUser(user);
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingUser(null);
  }

  async function handleUserSaved() {
    const wasEditing = editingUser !== null;

    await refreshUsers();

    setNotice(
      wasEditing
        ? "Kullanıcı bilgileri başarıyla güncellendi."
        : "Yeni kullanıcı başarıyla oluşturuldu.",
    );
  }

  async function handleDeactivate(user: User) {
    const confirmed = window.confirm(
      `"${user.UserName}" kullanıcısını pasifleştirmek istediğinizden emin misiniz?\n\nBu kullanıcı sisteme giriş yapamayacaktır.`,
    );

    if (!confirmed) {
      return;
    }

    setDeactivatingUserId(user.UserId);
    setError(null);
    setNotice(null);

    try {
      await apiRequest<{ message: string }>(
        `/users/${user.UserId}`,
        {
          method: "DELETE",
        },
      );

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.UserId === user.UserId
            ? {
                ...item,
                IsActive: false,
              }
            : item,
        ),
      );

      setNotice("Kullanıcı hesabı başarıyla pasifleştirildi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kullanıcı pasifleştirilirken beklenmeyen bir hata oluştu.";

      setError(
        message ===
          "You cannot deactivate your own account"
          ? "Kendi kullanıcı hesabınızı pasifleştiremezsiniz."
          : message,
      );
    } finally {
      setDeactivatingUserId(null);
    }
  }

  function getCompanyName(companyId: number | null) {
    if (companyId === null) {
      return "Sistem geneli";
    }

    return (
      companies.find(
        (company) => company.CompanyId === companyId,
      )?.CompanyName ?? `Firma #${companyId}`
    );
  }

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase("tr-TR");

  const filteredUsers = users.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      user.UserName.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      getCompanyName(user.CompanyId)
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery)
    );
  });

  const activeUserCount = users.filter(
    (user) => user.IsActive,
  ).length;
  const inactiveUserCount =
    users.length - activeUserCount;
  const superAdminCount = users.filter(
    (user) => user.IsSuperAdmin,
  ).length;

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1440px] rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
          Kullanıcılar yükleniyor...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
        <div
          role="alert"
          className="mx-auto max-w-[1440px] rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
        >
          {error ?? "Kullanıcı bilgileri alınamadı."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {currentUser.IsSuperAdmin
                ? "Sistem yönetimi"
                : "Firma yönetimi"}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              {currentUser.IsSuperAdmin
                ? "Kullanıcılar"
                : "Firma Kullanıcıları"}
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              {currentUser.IsSuperAdmin
                ? "Sistem kullanıcılarını, firma bağlantılarını ve hesap durumlarını yönetin."
                : "Firmanıza bağlı kullanıcıları görüntüleyin ve kendi hesabınızı yönetin."}
            </p>
          </div>

        {currentUser.IsSuperAdmin && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:self-auto"
            >
              <span className="text-xl leading-none">+</span>
              Yeni Kullanıcı Ekle
            </button>
          )}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-app-border bg-surface px-5 py-4">
            <p className="text-sm text-text-muted">
              Toplam kullanıcı
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {users.length}
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm text-success">
              Aktif kullanıcı
            </p>
            <p className="mt-2 text-2xl font-semibold text-success">
              {activeUserCount}
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-danger">
              Pasif kullanıcı
            </p>
            <p className="mt-2 text-2xl font-semibold text-danger">
              {inactiveUserCount}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-primary-soft px-5 py-4">
            <p className="text-sm text-primary">
              Süper yönetici
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary-dark">
              {superAdminCount}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <label
            htmlFor="user-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Kullanıcı ara
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </span>

            <input
              id="user-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Kullanıcı adı veya firma ile ara..."
              className="w-full rounded-md border border-app-border bg-surface px-4 py-3 pl-11 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </div>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-success">
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-6 py-4">
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-foreground">
                {filteredUsers.length}
              </span>{" "}
              kullanıcı gösteriliyor
            </p>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-sm font-semibold text-primary transition hover:text-primary-dark"
              >
                Aramayı temizle
              </button>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-foreground">
                {searchQuery
                  ? "Arama kriterine uygun kullanıcı bulunamadı."
                  : "Henüz kullanıcı kaydı bulunmuyor."}
              </p>

              <p className="mt-2 text-sm text-text-muted">
                {searchQuery
                  ? "Farklı bir kullanıcı adı veya firma deneyin."
                  : "Yeni bir kullanıcı ekleyerek başlayabilirsiniz."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Firma
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Hesap türü
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Durum
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Kayıt tarihi
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      İşlemler
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-app-border">
                  {filteredUsers.map((user) => {
                    const canEdit =
                      currentUser.IsSuperAdmin &&
                      currentUser.UserId !== user.UserId;
                    const canDeactivate =
                      currentUser.IsSuperAdmin &&
                      currentUser.UserId !== user.UserId &&
                      user.IsActive;

                    return (
                      <tr
                        key={user.UserId}
                        className="transition hover:bg-surface-muted/60"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {user.UserName}
                            {currentUser.UserId ===
                              user.UserId && (
                              <span className="ml-2 text-xs font-medium text-primary">
                                Siz
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-xs text-text-muted">
                            Kullanıcı ID: {user.UserId}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-text-muted">
                          {getCompanyName(user.CompanyId)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.IsSuperAdmin
                                ? "bg-primary-soft text-primary-dark"
                                : "bg-surface-muted text-text-muted"
                            }`}
                          >
                            {user.IsSuperAdmin
                              ? "Süper Yönetici"
                              : "Firma Kullanıcısı"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.IsActive
                                ? "bg-green-100 text-success"
                                : "bg-red-100 text-danger"
                            }`}
                          >
                            {user.IsActive
                              ? "Aktif"
                              : "Pasif"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-text-muted">
                          {formatDate(user.RecordDate)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(user)
                                }
                                className="inline-flex h-10 min-w-24 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
                              >
                                Düzenle
                              </button>
                            ) : (
                                <span className="inline-flex h-10 min-w-28 items-center justify-center text-sm text-text-muted">
                                {currentUser.UserId === user.UserId
                                  ? "Hesap ayarları"
                                  : "Görüntüleme"}
                              </span>
                            )}

                            {currentUser.IsSuperAdmin && (
                              <button
                                type="button"
                                disabled={
                                  !canDeactivate ||
                                  deactivatingUserId ===
                                    user.UserId
                                }
                                onClick={() =>
                                  handleDeactivate(user)
                                }
                                className="inline-flex h-10 min-w-28 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                {deactivatingUserId ===
                                user.UserId
                                  ? "İşleniyor..."
                                  : user.UserId ===
                                      currentUser.UserId
                                    ? "Mevcut hesap"
                                    : user.IsActive
                                      ? "Pasifleştir"
                                      : "Pasif"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isFormOpen && (
        <UserFormModal
          key={editingUser?.UserId ?? "new-user"}
          user={editingUser}
          companies={companies}
          currentUser={currentUser}
          onClose={closeForm}
          onSaved={handleUserSaved}
        />
      )}
    </main>
  );
}