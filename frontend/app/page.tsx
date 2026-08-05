"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { Product } from "@/types/product";

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
    month: "2-digit",
    year: "numeric",
  }).format(date);
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

  const statistics = [
    {
      title: "Toplam Müşteri",
      value: customers.length.toLocaleString("tr-TR"),
      description: "Firmanıza kayıtlı müşteriler",
      href: "/customers",
      linkLabel: "Müşterileri görüntüle",
    },
    {
      title: "Toplam Ürün",
      value: products.length.toLocaleString("tr-TR"),
      description: "Kayıtlı ürün ve hizmetler",
      href: "/products",
      linkLabel: "Ürünleri görüntüle",
    },
    {
      title: "Toplam Fatura",
      value: invoices.length.toLocaleString("tr-TR"),
      description: "Firmanıza ait faturalar",
      href: "/invoices",
      linkLabel: "Faturaları görüntüle",
    },
    {
      title: "Toplam Fatura Tutarı",
      value: formatCurrency(totalInvoiceAmount),
      description: "Vergi hariç fatura toplamı",
      href: "/invoices",
      linkLabel: "Fatura detaylarını incele",
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

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            Fatura Yönetim Sistemi
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Genel Bakış
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Firmanıza ait güncel müşteri, ürün ve fatura verilerini
            görüntüleyin.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

                {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
              />
            ))}
          </div>
        ) : error ? null : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((statistic) => (
                <article
                  key={statistic.title}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                >
                  <p className="text-sm font-medium text-slate-400">
                    {statistic.title}
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {statistic.value}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {statistic.description}
                  </p>

                  <Link
                    href={statistic.href}
                    className="mt-5 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    {statistic.linkLabel} →
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Son Faturalar
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      En güncel beş fatura kaydı
                    </p>
                  </div>

                  <Link
                    href="/invoices"
                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    Tümünü görüntüle
                  </Link>
                </div>

                {recentInvoices.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-400">
                      Henüz fatura kaydı bulunmuyor.
                    </p>

                    <Link
                      href="/invoices/new"
                      className="mt-4 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      İlk faturayı oluştur
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                      <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            Fatura numarası
                          </th>
                          <th className="px-6 py-4">Tarih</th>
                          <th className="px-6 py-4 text-right">
                            Vergi hariç toplam
                          </th>
                          <th className="px-6 py-4 text-right">
                            İşlem
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-800">
                        {recentInvoices.map((invoice) => (
                          <tr
                            key={invoice.InvoiceId}
                            className="transition hover:bg-slate-800/50"
                          >
                            <td className="px-6 py-4 font-medium text-white">
                              {invoice.InvoiceNumber}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-300">
                              {formatDate(invoice.InvoiceDate)}
                            </td>

                            <td className="px-6 py-4 text-right text-sm font-medium text-slate-200">
                              {formatCurrency(
                                Number(invoice.TotalAmount ?? 0),
                              )}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/invoices/${invoice.InvoiceId}`}
                                className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
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

              <aside className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">
                  Hızlı İşlemler
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Sık kullanılan işlemlere hızlıca ulaşın.
                </p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/invoices/new"
                    className="flex items-center justify-between rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <span>+ Yeni Fatura Oluştur</span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/customers"
                    className="flex items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    <span>Müşteri Yönetimi</span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/products"
                    className="flex items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    <span>Ürün Yönetimi</span>
                    <span>→</span>
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}