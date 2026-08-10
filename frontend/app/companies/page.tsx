"use client";

import { useEffect, useState } from "react";

import CompanyFormModal from "@/components/company-form-modal";
import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/types/auth";
import type { Company } from "@/types/company";

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

export default function CompaniesPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] =
    useState<Company | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingCompany, setEditingCompany] =
    useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [deactivatingCompanyId, setDeactivatingCompanyId] =
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

        if (user.IsSuperAdmin) {
          const data =
            await apiRequest<Company[]>("/companies/");

          if (isActive) {
            setCompanies(data);
          }
        } else {
          const data = await apiRequest<Company>(
            "/companies/current",
          );

          if (isActive) {
            setCurrentCompany(data);
          }
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Firma bilgileri alınırken beklenmeyen bir hata oluştu.",
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

  async function refreshCompanies() {
    if (!currentUser) {
      return;
    }

    setError(null);

    try {
      if (currentUser.IsSuperAdmin) {
        const data =
          await apiRequest<Company[]>("/companies/");
        setCompanies(data);
      } else {
        const data = await apiRequest<Company>(
          "/companies/current",
        );
        setCurrentCompany(data);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Firma bilgileri yenilenirken beklenmeyen bir hata oluştu.",
      );
    }
  }

  function openCreateForm() {
    setEditingCompany(null);
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEditForm(company: Company) {
    setEditingCompany(company);
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCompany(null);
  }

  async function handleCompanySaved() {
    const wasEditing = editingCompany !== null;

    await refreshCompanies();

    setNotice(
      wasEditing
        ? "Firma bilgileri başarıyla güncellendi."
        : "Yeni firma başarıyla eklendi.",
    );
  }

  async function handleDeactivate(company: Company) {
    const confirmed = window.confirm(
      `"${company.CompanyName}" firmasını pasifleştirmek istediğinizden emin misiniz?\n\nBu firmaya bağlı kullanıcılar sisteme giriş yapamayacaktır.`,
    );

    if (!confirmed) {
      return;
    }

    setDeactivatingCompanyId(company.CompanyId);
    setError(null);
    setNotice(null);

    try {
      await apiRequest<{ message: string }>(
        `/companies/${company.CompanyId}`,
        {
          method: "DELETE",
        },
      );

      setCompanies((currentCompanies) =>
        currentCompanies.map((item) =>
          item.CompanyId === company.CompanyId
            ? {
                ...item,
                IsActive: false,
              }
            : item,
        ),
      );

      setNotice("Firma başarıyla pasifleştirildi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Firma pasifleştirilirken beklenmeyen bir hata oluştu.";

      setError(
        message === "Company is already inactive"
          ? "Bu firma zaten pasif durumda."
          : message,
      );
    } finally {
      setDeactivatingCompanyId(null);
    }
  }

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase("tr-TR");

  const filteredCompanies = companies.filter((company) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      company.CompanyCode.toLocaleLowerCase(
        "tr-TR",
      ).includes(normalizedQuery) ||
      company.CompanyName.toLocaleLowerCase(
        "tr-TR",
      ).includes(normalizedQuery) ||
      (company.TaxNumber ?? "")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery) ||
      (company.EMail ?? "")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery)
    );
  });

  const activeCompanyCount = companies.filter(
    (company) => company.IsActive,
  ).length;
  const inactiveCompanyCount =
    companies.length - activeCompanyCount;

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1440px] rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
          Firma bilgileri yükleniyor...
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

  if (!currentUser.IsSuperAdmin) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
        <section className="mx-auto max-w-[1440px]">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Kurumsal bilgiler
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Firma Bilgilerim
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              Hesabınızın bağlı olduğu firmanın bilgilerini
              görüntüleyin.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
            >
              {error}
            </div>
          )}

          {currentCompany ? (
            <div className="overflow-hidden rounded-xl border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col justify-between gap-4 border-b border-app-border px-6 py-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {currentCompany.CompanyName}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        currentCompany.IsActive
                          ? "bg-green-100 text-success"
                          : "bg-red-100 text-danger"
                      }`}
                    >
                      {currentCompany.IsActive
                        ? "Aktif firma"
                        : "Pasif firma"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-text-muted">
                    Firma kodu:{" "}
                    <span className="font-semibold text-primary">
                      {currentCompany.CompanyCode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-app-border sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Firma ID",
                    value: currentCompany.CompanyId,
                  },
                  {
                    label: "Vergi numarası",
                    value:
                      currentCompany.TaxNumber ?? "Belirtilmemiş",
                  },
                  {
                    label: "E-posta",
                    value:
                      currentCompany.EMail ?? "Belirtilmemiş",
                  },
                  {
                    label: "Kayıt tarihi",
                    value: formatDate(
                      currentCompany.RecordDate,
                    ),
                  },
                  {
                    label: "Durum",
                    value: currentCompany.IsActive
                      ? "Aktif"
                      : "Pasif",
                  },
                  {
                    label: "Adres",
                    value:
                      currentCompany.Address ?? "Belirtilmemiş",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface px-6 py-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">
                      {item.label}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-app-border bg-primary-soft/40 px-6 py-4">
                <p className="text-sm text-text-muted">
                  Firma bilgilerindeki değişiklikler süper
                  yönetici tarafından gerçekleştirilir.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
              Bağlı firma bilgisi bulunamadı.
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Sistem yönetimi
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Firmalar
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              Sisteme bağlı firmaları ve erişim durumlarını
              yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:self-auto"
          >
            <span className="text-xl leading-none">+</span>
            Yeni Firma Ekle
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-app-border bg-surface px-5 py-4">
            <p className="text-sm text-text-muted">
              Toplam firma
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {companies.length}
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm text-success">
              Aktif firma
            </p>
            <p className="mt-2 text-2xl font-semibold text-success">
              {activeCompanyCount}
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-danger">
              Pasif firma
            </p>
            <p className="mt-2 text-2xl font-semibold text-danger">
              {inactiveCompanyCount}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <label
            htmlFor="company-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Firma ara
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </span>

            <input
              id="company-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Firma kodu, unvan, vergi numarası veya e-posta ile ara..."
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
                {filteredCompanies.length}
              </span>{" "}
              firma gösteriliyor
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

          {filteredCompanies.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-foreground">
                {searchQuery
                  ? "Arama kriterine uygun firma bulunamadı."
                  : "Henüz firma kaydı bulunmuyor."}
              </p>

              <p className="mt-2 text-sm text-text-muted">
                {searchQuery
                  ? "Farklı bir firma kodu, unvan veya vergi numarası deneyin."
                  : "Yeni bir firma ekleyerek başlayabilirsiniz."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Firma
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Vergi numarası
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      E-posta
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
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.CompanyId}
                      className="transition hover:bg-surface-muted/60"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">
                          {company.CompanyName}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {company.CompanyCode} · ID:{" "}
                          {company.CompanyId}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-text-muted">
                        {company.TaxNumber ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {company.EMail ? (
                          <a
                            href={`mailto:${company.EMail}`}
                            className="text-sm font-medium text-primary transition hover:text-primary-dark"
                          >
                            {company.EMail}
                          </a>
                        ) : (
                          <span className="text-sm text-text-muted">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            company.IsActive
                              ? "bg-green-100 text-success"
                              : "bg-red-100 text-danger"
                          }`}
                        >
                          {company.IsActive
                            ? "Aktif"
                            : "Pasif"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-text-muted">
                        {formatDate(company.RecordDate)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(company)
                            }
                            className="inline-flex h-10 min-w-24 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={
                              !company.IsActive ||
                              deactivatingCompanyId ===
                                company.CompanyId
                            }
                            onClick={() =>
                              handleDeactivate(company)
                            }
                            className="inline-flex h-10 min-w-28 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {deactivatingCompanyId ===
                            company.CompanyId
                              ? "İşleniyor..."
                              : company.IsActive
                                ? "Pasifleştir"
                                : "Pasif"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isFormOpen && (
        <CompanyFormModal
          key={editingCompany?.CompanyId ?? "new-company"}
          company={editingCompany}
          onClose={closeForm}
          onSaved={handleCompanySaved}
        />
      )}
    </main>
  );
}