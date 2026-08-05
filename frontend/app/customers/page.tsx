"use client";

import { useEffect, useState } from "react";

import CustomerFormModal from "@/components/customer-form-modal";
import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
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
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Müşteriler</h2>

            <p className="mt-2 text-sm text-slate-400">
              Müşteri firma ve iletişim kayıtlarını yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            + Yeni Müşteri Ekle
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <label htmlFor="customer-search" className="sr-only">
            Müşteri ara
          </label>

          <input
            id="customer-search"
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Unvan, vergi numarası veya e-posta ile ara..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            Müşteriler yükleniyor...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">
                {filteredCustomers.length} müşteri gösteriliyor
              </p>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="bg-slate-900/40 p-10 text-center text-slate-400">
                {searchQuery
                  ? "Arama kriterine uygun müşteri bulunamadı."
                  : "Henüz müşteri kaydı bulunmuyor."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Müşteri unvanı</th>
                      <th className="px-6 py-4">Vergi numarası</th>
                      <th className="px-6 py-4">E-posta</th>
                      <th className="px-6 py-4">Adres</th>
                      <th className="px-6 py-4 text-right">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.CustomerId}
                        className="bg-slate-950 transition hover:bg-slate-900/70"
                      >
                        <td className="px-6 py-4 font-medium text-cyan-300">
                          {customer.Title}
                        </td>

                        <td className="px-6 py-4">
                          {customer.TaxNumber ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          {customer.EMail ? (
                            <a
                              href={`mailto:${customer.EMail}`}
                              className="text-slate-300 transition hover:text-cyan-300"
                            >
                              {customer.EMail}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="max-w-xs px-6 py-4 text-sm text-slate-400">
                          <span className="line-clamp-2">
                            {customer.Address ?? "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(customer)
                              }
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
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
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingCustomerId ===
                              customer.CustomerId
                                ? "Siliniyor..."
                                : "Sil"}
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
        )}
      </section>

      {isFormOpen && (
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