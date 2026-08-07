"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice } from "@/types/invoice";

function formatCurrency(value: string | null) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Tarih belirtilmemiş";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Geçersiz tarih";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [deletingInvoiceId, setDeletingInvoiceId] =
    useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadInvoicePage() {
      try {
        const [invoiceData, customerData] = await Promise.all([
          apiRequest<Invoice[]>("/invoices/"),
          apiRequest<Customer[]>("/customers/"),
        ]);

        if (!isActive) {
          return;
        }

        setInvoices(invoiceData);
        setCustomers(customerData);
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Faturalar alınırken beklenmeyen bir hata oluştu.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoicePage();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleDelete(invoice: Invoice) {
    const confirmed = window.confirm(
      `"${invoice.InvoiceNumber}" numaralı faturayı silmek istediğinizden emin misiniz?\n\nFaturaya bağlı bütün ürün ve hizmet satırları da silinecektir.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingInvoiceId(invoice.InvoiceId);
    setActionError(null);
    setNotice(null);

    try {
      await apiRequest<{ message: string }>(
        `/invoices/${invoice.InvoiceId}`,
        {
          method: "DELETE",
        },
      );

      setInvoices((currentInvoices) =>
        currentInvoices.filter(
          (currentInvoice) =>
            currentInvoice.InvoiceId !== invoice.InvoiceId,
        ),
      );

      setNotice(
        `"${invoice.InvoiceNumber}" numaralı fatura başarıyla silindi.`,
      );
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Fatura silinirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setDeletingInvoiceId(null);
    }
  }

  const customerNames = new Map(
    customers.map((customer) => [
      customer.CustomerId,
      customer.Title,
    ]),
  );

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase("tr-TR");

  const filteredInvoices = invoices.filter((invoice) => {
    if (!normalizedQuery) {
      return true;
    }

    const customerName =
      customerNames.get(invoice.CustomerId) ?? "";

    const formattedDate = formatDate(invoice.InvoiceDate);

    return (
      invoice.InvoiceNumber.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      customerName.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      String(invoice.CustomerId).includes(normalizedQuery) ||
      formattedDate
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery)
    );
  });

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Faturalar
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              Firmanıza ait faturaları görüntüleyin ve yönetin.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:self-auto"
          >
            <span className="text-xl leading-none">+</span>
            Yeni Fatura Oluştur
          </Link>
        </div>

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <label
            htmlFor="invoice-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Fatura ara
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </span>

            <input
              id="invoice-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Fatura numarası, müşteri veya tarih ile ara..."
              className="w-full rounded-md border border-app-border bg-surface px-4 py-3 pl-11 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </div>
        </div>

        {notice ? (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-success">
            {notice}
          </div>
        ) : null}

        {actionError ? (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
          >
            <p className="font-semibold">
              Faturalar yüklenemedi
            </p>

            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
            Faturalar yükleniyor...
          </div>
        ) : error ? null : (
          <div className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-6 py-4">
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-foreground">
                  {filteredInvoices.length}
                </span>{" "}
                fatura gösteriliyor
              </p>

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-sm font-semibold text-primary transition hover:text-primary-dark"
                >
                  Aramayı temizle
                </button>
              ) : null}
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold text-foreground">
                  {searchQuery
                    ? "Arama kriterine uygun fatura bulunamadı."
                    : "Henüz fatura kaydı bulunmuyor."}
                </p>

                <p className="mt-2 text-sm text-text-muted">
                  {searchQuery
                    ? "Farklı bir fatura numarası, müşteri veya tarih deneyin."
                    : "İlk faturanızı oluşturarak başlayabilirsiniz."}
                </p>

                {!searchQuery ? (
                  <Link
                    href="/invoices/new"
                    className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    İlk faturayı oluştur
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Fatura numarası
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Müşteri
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Fatura tarihi
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Vergi hariç toplam
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-app-border">
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.InvoiceId}
                        className="transition hover:bg-surface-muted/60"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/invoices/${invoice.InvoiceId}`}
                            className="font-semibold text-primary transition hover:text-primary-dark"
                          >
                            {invoice.InvoiceNumber}
                          </Link>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-foreground">
                            {customerNames.get(
                              invoice.CustomerId,
                            ) ??
                              `Müşteri #${invoice.CustomerId}`}
                          </p>

                          <p className="mt-0.5 text-xs text-text-muted">
                            ID: {invoice.CustomerId}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-text-muted">
                          {formatDate(invoice.InvoiceDate)}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                          {formatCurrency(invoice.TotalAmount)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/invoices/${invoice.InvoiceId}`}
                              className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
                            >
                              Detay
                            </Link>
                            <Link
  href={`/invoices/${invoice.InvoiceId}/edit`}
  className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
>
  Düzenle
</Link>

                            <button
                              type="button"
                              disabled={
                                deletingInvoiceId ===
                                invoice.InvoiceId
                              }
                              onClick={() =>
                                handleDelete(invoice)
                              }
                              className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingInvoiceId ===
                              invoice.InvoiceId
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
    </main>
  );
}