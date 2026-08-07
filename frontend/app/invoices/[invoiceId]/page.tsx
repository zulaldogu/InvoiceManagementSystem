"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice } from "@/types/invoice";

function formatCurrency(value: number | string | null) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Tarih belirtilmemiş";
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-");

  if (year && month && day) {
    return `${day}.${month}.${year}`;
  }

  return value;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadInvoiceDetails() {
      try {
        setError(null);

        const invoiceData = await apiRequest<Invoice>(
          `/invoices/${invoiceId}`,
        );

        if (!isActive) {
          return;
        }

        setInvoice(invoiceData);

        try {
          const customerData = await apiRequest<Customer>(
            `/customers/${invoiceData.CustomerId}`,
          );

          if (isActive) {
            setCustomer(customerData);
          }
        } catch {
          if (isActive) {
            setCustomer(null);
          }
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Fatura detayları alınamadı.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoiceDetails();

    return () => {
      isActive = false;
    };
  }, [invoiceId]);

  return (
    <main className="min-h-full bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1490px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
          href="/invoices"
        >
          <span aria-hidden="true">←</span>
          Faturalara dön
        </Link>

        {isLoading ? (
          <section className="mt-6 rounded-lg border border-app-border bg-surface p-8 text-text-muted shadow-sm">
            Fatura detayları yükleniyor...
          </section>
        ) : null}

        {error ? (
          <section
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
            role="alert"
          >
            {error}
          </section>
        ) : null}

        {!isLoading && !error && invoice ? (
          <>
            <header className="mt-5 flex flex-col gap-5 border-b border-app-border pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Fatura detayı
                  </p>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-success">
                    Kayıtlı fatura
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {invoice.InvoiceNumber}
                </h1>

                <p className="mt-2 text-base text-text-muted">
                  Fatura üst bilgilerini ve ilgili ürün veya hizmet kalemlerini
                  inceleyin.
                </p>
              </div>

              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white shadow-sm transition hover:bg-primary-dark"
                href="/invoices/new"
              >
                + Yeni Fatura Oluştur
              </Link>
            </header>

            <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Müşteri
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {customer?.Title ?? `Müşteri #${invoice.CustomerId}`}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Müşteri ID: {invoice.CustomerId}
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Fatura tarihi
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {formatDate(invoice.InvoiceDate)}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Fatura düzenlenme tarihi
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Fatura kalemi
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {invoice.Lines.length}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Ürün veya hizmet kaydı
                </p>
              </article>

              <article className="rounded-lg border border-primary bg-primary p-5 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">
                  Vergi hariç toplam
                </p>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(invoice.TotalAmount)}
                </p>
                <p className="mt-1 text-sm text-blue-100">
                  Fatura satırları toplamı
                </p>
              </article>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className="rounded-lg border border-app-border bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Müşteri bilgileri
                </p>

                <h2 className="mt-2 text-xl font-bold text-foreground">
                  {customer?.Title ?? "Müşteri bilgisi"}
                </h2>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Vergi numarası
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {customer?.TaxNumber ?? "Belirtilmemiş"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      E-posta
                    </dt>
                    <dd className="mt-1 break-all font-medium text-foreground">
                      {customer?.EMail ?? "Belirtilmemiş"}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-sm font-semibold text-text-muted">
                      Adres
                    </dt>
                    <dd className="mt-1 font-medium leading-6 text-foreground">
                      {customer?.Address ?? "Belirtilmemiş"}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Kayıt bilgileri
                </p>

                <h2 className="mt-2 text-xl font-bold text-foreground">
                  Fatura Kaydı
                </h2>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Fatura ID
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {invoice.InvoiceId}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Fatura numarası
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {invoice.InvoiceNumber}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Oluşturan kullanıcı
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {invoice.UserId
                        ? `Kullanıcı #${invoice.UserId}`
                        : "Belirtilmemiş"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Kayıt tarihi
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatDate(invoice.RecordDate)}
                    </dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="mt-6 overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
              <div className="border-b border-app-border px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Fatura içeriği
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Ürün ve Hizmetler
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Faturaya eklenmiş ürün ve hizmet kalemleri.
                </p>
              </div>

              {invoice.Lines.length === 0 ? (
                <div className="p-8 text-sm text-text-muted">
                  Bu faturaya ait ürün veya hizmet kalemi bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[850px] w-full border-collapse text-left">
                    <thead className="bg-primary-soft">
                      <tr className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
                        <th className="px-6 py-4">No</th>
                        <th className="px-4 py-4">Ürün / Hizmet</th>
                        <th className="px-4 py-4">Ürün ID</th>
                        <th className="px-4 py-4 text-center">Miktar</th>
                        <th className="px-4 py-4 text-right">Birim Fiyat</th>
                        <th className="px-6 py-4 text-right">Tutar</th>
                      </tr>
                    </thead>

                    <tbody>
                      {invoice.Lines.map((line, index) => {
                        const lineTotal =
                          Number(line.Price) * Number(line.Quantity);

                        return (
                          <tr
                            className="border-t border-app-border"
                            key={line.InvoiceLineId}
                          >
                            <td className="px-6 py-5 text-sm font-bold text-text-muted">
                              {index + 1}
                            </td>

                            <td className="px-4 py-5">
                              <p className="font-bold text-foreground">
                                {line.ItemName ??
                                  `Ürün #${line.ProductId}`}
                              </p>
                              <p className="mt-1 text-sm text-text-muted">
                                Satır ID: {line.InvoiceLineId}
                              </p>
                            </td>

                            <td className="px-4 py-5 text-text-muted">
                              {line.ProductId}
                            </td>

                            <td className="px-4 py-5 text-center font-semibold text-foreground">
                              {line.Quantity}
                            </td>

                            <td className="px-4 py-5 text-right text-foreground">
                              {formatCurrency(line.Price)}
                            </td>

                            <td className="px-6 py-5 text-right font-bold text-foreground">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end border-t border-app-border bg-surface-muted px-6 py-5">
                <div className="w-full max-w-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-muted">
                      Vergi hariç toplam
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(invoice.TotalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 flex justify-end border-t border-app-border pt-6">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg border border-app-border bg-surface px-6 font-semibold text-text-muted transition hover:border-primary hover:text-primary"
                href="/invoices"
              >
                Fatura Listesine Dön
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}