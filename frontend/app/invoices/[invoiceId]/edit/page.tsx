"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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

export default function EditInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadEditPage() {
      try {
        const [invoiceData, customerData] = await Promise.all([
          apiRequest<Invoice>(`/invoices/${invoiceId}`),
          apiRequest<Customer[]>("/customers/"),
        ]);

        if (!isActive) {
          return;
        }

        setInvoice(invoiceData);
        setCustomers(customerData);
        setCustomerId(String(invoiceData.CustomerId));
        setInvoiceNumber(invoiceData.InvoiceNumber);
        setInvoiceDate(
          invoiceData.InvoiceDate
            ? invoiceData.InvoiceDate.slice(0, 10)
            : "",
        );
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Fatura bilgileri alınamadı.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadEditPage();

    return () => {
      isActive = false;
    };
  }, [invoiceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedCustomerId = Number(customerId);

    if (!Number.isInteger(parsedCustomerId) || parsedCustomerId <= 0) {
      setError("Lütfen geçerli bir müşteri seçin.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Fatura numarası zorunludur.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest<Invoice>(`/invoices/${invoiceId}`, {
        method: "PUT",
        body: JSON.stringify({
          CustomerId: parsedCustomerId,
          InvoiceNumber: invoiceNumber.trim(),
          InvoiceDate: invoiceDate || null,
        }),
      });

      router.push(`/invoices/${invoiceId}`);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Fatura güncellenirken beklenmeyen bir hata oluştu.";

      setError(
        message ===
          "Invoice number already exists in this company"
          ? "Bu fatura numarası aynı firma içinde zaten kullanılıyor."
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-full bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
          href={`/invoices/${invoiceId}`}
        >
          <span aria-hidden="true">←</span>
          Fatura detayına dön
        </Link>

        {isLoading ? (
          <section className="mt-6 rounded-lg border border-app-border bg-surface p-8 text-text-muted shadow-sm">
            Fatura bilgileri yükleniyor...
          </section>
        ) : null}

        {!isLoading && error && !invoice ? (
          <section
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
            role="alert"
          >
            {error}
          </section>
        ) : null}

        {!isLoading && invoice ? (
          <>
            <header className="mt-5 border-b border-app-border pb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Fatura yönetimi
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Faturayı Düzenle
              </h1>

              <p className="mt-2 text-base text-text-muted">
                {invoice.InvoiceNumber} numaralı faturanın müşteri,
                numara ve tarih bilgilerini güncelleyin.
              </p>
            </header>

            <form
              className="mt-7 space-y-6"
              onSubmit={handleSubmit}
            >
              {error ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <section className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
                <div className="border-b border-app-border px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Temel bilgiler
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Fatura Bilgileri
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    Faturanın müşterisini, numarasını ve düzenlenme
                    tarihini değiştirin.
                  </p>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Müşteri
                    <select
                      className="h-12 rounded-lg border border-app-border bg-surface px-4 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      onChange={(event) =>
                        setCustomerId(event.target.value)
                      }
                      required
                      value={customerId}
                    >
                      <option value="">Müşteri seçin</option>

                      {customers.map((customer) => (
                        <option
                          key={customer.CustomerId}
                          value={customer.CustomerId}
                        >
                          {customer.Title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Fatura numarası
                    <input
                      className="h-12 rounded-lg border border-app-border bg-surface px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      maxLength={20}
                      onChange={(event) =>
                        setInvoiceNumber(event.target.value)
                      }
                      required
                      type="text"
                      value={invoiceNumber}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Fatura tarihi
                    <input
                      className="h-12 rounded-lg border border-app-border bg-surface px-4 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      onChange={(event) =>
                        setInvoiceDate(event.target.value)
                      }
                      type="date"
                      value={invoiceDate}
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
                <div className="border-b border-app-border px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Fatura içeriği
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Mevcut Ürün ve Hizmetler
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    Bu aşamada fatura kalemleri korunur. Kalem
                    düzenleme işlemini sonraki adımda ekleyeceğiz.
                  </p>
                </div>

                {invoice.Lines.length === 0 ? (
                  <div className="p-6 text-sm text-text-muted">
                    Bu faturaya ait ürün veya hizmet bulunmuyor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                      <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Ürün / Hizmet
                          </th>

                          <th className="px-6 py-4 text-center font-semibold">
                            Miktar
                          </th>

                          <th className="px-6 py-4 text-right font-semibold">
                            Birim fiyat
                          </th>

                          <th className="px-6 py-4 text-right font-semibold">
                            Tutar
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-app-border">
                        {invoice.Lines.map((line) => (
                          <tr key={line.InvoiceLineId}>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">
                                {line.ItemName ??
                                  `Ürün #${line.ProductId}`}
                              </p>

                              <p className="mt-1 text-xs text-text-muted">
                                Ürün ID: {line.ProductId}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-center font-semibold text-foreground">
                              {line.Quantity}
                            </td>

                            <td className="px-6 py-4 text-right text-foreground">
                              {formatCurrency(line.Price)}
                            </td>

                            <td className="px-6 py-4 text-right font-bold text-foreground">
                              {formatCurrency(
                                Number(line.Price) *
                                  Number(line.Quantity),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end border-t border-app-border bg-surface-muted px-6 py-5">
                  <div className="flex w-full max-w-sm items-center justify-between">
                    <span className="font-semibold text-text-muted">
                      Vergi hariç toplam
                    </span>

                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(invoice.TotalAmount)}
                    </span>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:justify-end">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-app-border bg-surface px-6 font-semibold text-text-muted transition hover:border-primary hover:text-primary"
                  href={`/invoices/${invoiceId}`}
                >
                  İptal
                </Link>

                <button
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-7 font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Fatura güncelleniyor..."
                    : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </main>
  );
}