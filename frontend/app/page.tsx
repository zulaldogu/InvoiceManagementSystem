"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { Product } from "@/types/product";

type StatisticIconName =
  | "customers"
  | "products"
  | "invoices"
  | "revenue";

type Statistic = {
  title: string;
  value: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: StatisticIconName;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
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
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatisticIcon({ name }: { name: StatisticIconName }) {
  const paths = {
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
    revenue: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
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

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [customerData, productData, invoiceData] =
          await Promise.all([
            apiRequest<Customer[]>("/customers/"),
            apiRequest<Product[]>("/products/"),
            apiRequest<Invoice[]>("/invoices/"),
          ]);

        if (!isActive) {
          return;
        }

        setCustomers(customerData);
        setProducts(productData);
        setInvoices(invoiceData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Dashboard verileri alınırken beklenmeyen bir hata oluştu.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const totalInvoiceAmount = invoices.reduce(
    (total, invoice) => total + Number(invoice.TotalAmount ?? 0),
    0,
  );

  const statistics: Statistic[] = [
    {
      title: "Toplam Müşteri",
      value: customers.length.toLocaleString("tr-TR"),
      description: "Firmanıza kayıtlı müşteriler",
      href: "/customers",
      linkLabel: "Müşterileri görüntüle",
      icon: "customers",
    },
    {
      title: "Ürün ve Hizmetler",
      value: products.length.toLocaleString("tr-TR"),
      description: "Faturalarda kullanılabilen kayıtlar",
      href: "/products",
      linkLabel: "Ürünleri görüntüle",
      icon: "products",
    },
    {
      title: "Toplam Fatura",
      value: invoices.length.toLocaleString("tr-TR"),
      description: "Firmanıza ait fatura kayıtları",
      href: "/invoices",
      linkLabel: "Faturaları görüntüle",
      icon: "invoices",
    },
    {
      title: "Toplam Fatura Tutarı",
      value: formatCurrency(totalInvoiceAmount),
      description: "Vergi hariç toplam tutar",
      href: "/invoices",
      linkLabel: "Fatura detaylarını incele",
      icon: "revenue",
    },
  ];

  const recentInvoices = [...invoices]
    .sort((firstInvoice, secondInvoice) => {
      const firstDate = firstInvoice.InvoiceDate
        ? new Date(firstInvoice.InvoiceDate).getTime()
        : 0;

      const secondDate = secondInvoice.InvoiceDate
        ? new Date(secondInvoice.InvoiceDate).getTime()
        : 0;

      return (
        secondDate - firstDate ||
        secondInvoice.InvoiceId - firstInvoice.InvoiceId
      );
    })
    .slice(0, 5);

  const customerNames = new Map(
    customers.map((customer) => [
      customer.CustomerId,
      customer.Title,
    ]),
  );

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Genel Bakış
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              İşletmenizin güncel müşteri, ürün ve fatura
              verilerini inceleyin.
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

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
          >
            <p className="font-semibold">
              Dashboard verileri yüklenemedi
            </p>

            <p className="mt-1">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-lg border border-app-border bg-surface"
              >
                <div className="m-6 h-10 w-10 rounded-md bg-surface-subtle" />
                <div className="mx-6 mt-6 h-8 w-28 rounded bg-surface-subtle" />
                <div className="mx-6 mt-4 h-4 w-40 rounded bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : error ? null : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              {statistics.map((statistic) => (
                <article
                  key={statistic.title}
                  className="group rounded-lg border border-app-border bg-surface p-6 shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-muted">
                        {statistic.title}
                      </p>

                      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                        {statistic.value}
                      </p>
                    </div>

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-dark">
                      <StatisticIcon name={statistic.icon} />
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-text-muted">
                    {statistic.description}
                  </p>

                  <Link
                    href={statistic.href}
                    className="mt-5 inline-flex text-sm font-semibold text-primary transition group-hover:text-primary-dark"
                  >
                    {statistic.linkLabel} →
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <section className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-app-border px-6 py-5">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Son Faturalar
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                      En güncel beş fatura kaydı
                    </p>
                  </div>

                  <Link
                    href="/invoices"
                    className="text-sm font-semibold text-primary transition hover:text-primary-dark"
                  >
                    Tümünü görüntüle
                  </Link>
                </div>

                {recentInvoices.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                      <StatisticIcon name="invoices" />
                    </span>

                    <p className="mt-4 font-semibold text-foreground">
                      Henüz fatura kaydı bulunmuyor
                    </p>

                    <p className="mt-1 text-sm text-text-muted">
                      İlk faturanızı oluşturarak başlayabilirsiniz.
                    </p>

                    <Link
                      href="/invoices/new"
                      className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      İlk faturayı oluştur
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Fatura numarası
                          </th>
                          <th className="px-6 py-4 font-semibold">
                            Müşteri
                          </th>
                          <th className="px-6 py-4 font-semibold">
                            Tarih
                          </th>
                          <th className="px-6 py-4 text-right font-semibold">
                            Vergi hariç toplam
                          </th>
                          <th className="px-6 py-4 text-right font-semibold">
                            İşlem
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-app-border">
                        {recentInvoices.map((invoice) => (
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

                            <td className="px-6 py-4 text-sm text-foreground">
                              {customerNames.get(invoice.CustomerId) ??
                                `Müşteri #${invoice.CustomerId}`}
                            </td>

                            <td className="px-6 py-4 text-sm text-text-muted">
                              {formatDate(invoice.InvoiceDate)}
                            </td>

                            <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                              {formatCurrency(
                                Number(invoice.TotalAmount ?? 0),
                              )}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/invoices/${invoice.InvoiceId}`}
                                className="text-sm font-semibold text-primary transition hover:text-primary-dark"
                              >
                                Detay
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <aside className="rounded-lg border border-app-border bg-surface p-6 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                <h2 className="text-xl font-semibold text-foreground">
                  Hızlı İşlemler
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                  Sık kullanılan işlemlere hızlıca ulaşın.
                </p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/invoices/new"
                    className="flex items-center justify-between rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    <span>+ Yeni Fatura Oluştur</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    href="/customers"
                    className="flex items-center justify-between rounded-md border border-app-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-surface-muted hover:text-primary-dark"
                  >
                    <span>Müşteri Yönetimi</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    href="/products"
                    className="flex items-center justify-between rounded-md border border-app-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-surface-muted hover:text-primary-dark"
                  >
                    <span>Ürün ve Hizmet Yönetimi</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    href="/invoices"
                    className="flex items-center justify-between rounded-md border border-app-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-surface-muted hover:text-primary-dark"
                  >
                    <span>Tüm Faturaları Görüntüle</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="mt-6 rounded-md bg-surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    Bilgilendirme
                  </p>

                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    Fatura tutarları mevcut vergi altyapısı
                    tamamlanana kadar vergi hariç gösterilmektedir.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}