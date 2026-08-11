"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerFormModal from "@/components/customer-form-modal";
import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import { useAuthorization } from "@/components/authorization-context";

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

export default function CustomersPage() {
  const { hasRole } = useAuthorization();
  const canManageCustomers = hasRole(
    "MANAGE_CUSTOMERS",
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] =
    useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshCustomers() {
    setError(null);

    try {
      const data = await apiRequest<Customer[]>("/customers/");
      setCustomers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Müşteriler alınırken beklenmeyen bir hata oluştu.",
      );
    }
  }

  useEffect(() => {
    let isActive = true;

    apiRequest<Customer[]>("/customers/")
      .then((data) => {
        if (isActive) {
          setCustomers(data);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Müşteriler alınırken beklenmeyen bir hata oluştu.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function openCreateForm() {
    setEditingCustomer(null);
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer);
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCustomer(null);
  }

  async function handleCustomerSaved() {
    await refreshCustomers();

    setNotice(
      editingCustomer
        ? "Müşteri bilgileri başarıyla güncellendi."
        : "Yeni müşteri başarıyla eklendi.",
    );
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `"${customer.Title}" kaydını silmek istediğinizden emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingCustomerId(customer.CustomerId);
    setError(null);
    setNotice(null);

    try {
      await apiRequest<{ message: string }>(
        `/customers/${customer.CustomerId}`,
        {
          method: "DELETE",
        },
      );

      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (item) => item.CustomerId !== customer.CustomerId,
        ),
      );

      setNotice("Müşteri başarıyla silindi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Müşteri silinirken beklenmeyen bir hata oluştu.";

      setError(
        message ===
          "Customer is used by an invoice and cannot be deleted"
          ? "Bu müşteri bir faturada kullanıldığı için silinemez."
          : message,
      );
    } finally {
      setDeletingCustomerId(null);
    }
  }

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase("tr-TR");

  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedQuery) {
      return true;
    }

    const taxNumber = customer.TaxNumber ?? "";
    const email = customer.EMail ?? "";

    return (
      customer.Title.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      taxNumber.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      email.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      )
    );
  });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 lg:px-6 lg:py-7">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Müşteriler
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              Müşteri firma ve iletişim kayıtlarını yönetin.
            </p>
          </div>

          {canManageCustomers && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:self-auto"
            >
              <span className="text-xl leading-none">
                +
              </span>
              Yeni Müşteri Ekle
            </button>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <label
            htmlFor="customer-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Müşteri ara
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </span>

            <input
              id="customer-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Unvan, vergi numarası veya e-posta ile ara..."
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

        {isLoading ? (
          <div className="rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
            Müşteriler yükleniyor...
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-6 py-4">
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-foreground">
                  {filteredCustomers.length}
                </span>{" "}
                müşteri gösteriliyor
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

            {filteredCustomers.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold text-foreground">
                  {searchQuery
                    ? "Arama kriterine uygun müşteri bulunamadı."
                    : "Henüz müşteri kaydı bulunmuyor."}
                </p>

                <p className="mt-2 text-sm text-text-muted">
                  {searchQuery
                    ? "Farklı bir unvan, vergi numarası veya e-posta deneyin."
                    : "Yeni bir müşteri ekleyerek başlayabilirsiniz."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Müşteri unvanı
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Vergi numarası
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        E-posta
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Adres
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-app-border">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.CustomerId}
                        className="transition hover:bg-surface-muted/60"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {customer.Title}
                          </p>

                          <p className="mt-0.5 text-xs text-text-muted">
                            ID: {customer.CustomerId}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-text-muted">
                          {customer.TaxNumber ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          {customer.EMail ? (
                            <a
                              href={`mailto:${customer.EMail}`}
                              className="text-sm font-medium text-primary transition hover:text-primary-dark"
                            >
                              {customer.EMail}
                            </a>
                          ) : (
                            <span className="text-sm text-text-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td className="max-w-sm px-6 py-4 text-sm leading-6 text-text-muted">
                          <span className="line-clamp-2">
                            {customer.Address ?? "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
  href={`/customers/${customer.CustomerId}`}
className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft">
  Detay
</Link>
                                                        {canManageCustomers && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditForm(customer)
                                  }
                                  className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
                                >
                                  Düzenle
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    deletingCustomerId ===
                                    customer.CustomerId
                                  }
                                  onClick={() =>
                                    handleDelete(customer)
                                  }
                                  className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingCustomerId ===
                                  customer.CustomerId
                                    ? "Siliniyor..."
                                    : "Sil"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {isFormOpen && canManageCustomers && (
        <CustomerFormModal
          key={editingCustomer?.CustomerId ?? "new-customer"}
          customer={editingCustomer}
          onClose={closeForm}
          onSaved={handleCustomerSaved}
        />
      )}
    </main>
  );
}