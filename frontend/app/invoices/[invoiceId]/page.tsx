"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Invoice } from "@/types/invoice";

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const data = await apiRequest<Invoice>(
          `/invoices/${invoiceId}?user_id=1`,
        );
        setInvoice(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Beklenmeyen bir hata oluştu.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/invoices"
          className="mb-8 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
        >
          ← Faturalara dön
        </Link>

        {isLoading && (
          <p className="text-slate-300">Fatura detayları yükleniyor...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && invoice && (
          <>
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Fatura Yönetim Sistemi
              </p>

              <h1 className="text-4xl font-semibold tracking-tight">
                {invoice.InvoiceNumber}
              </h1>

              <p className="mt-4 text-slate-300">
                Fatura üst bilgileri ve ilgili fatura kalemleri.
              </p>
            </div>

            <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Müşteri ID</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.CustomerId ?? "Belirtilmemiş"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Fatura tarihi</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.InvoiceDate
                    ? new Date(
                        invoice.InvoiceDate,
                      ).toLocaleDateString("tr-TR")
                    : "Belirtilmemiş"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Toplam tutar</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.TotalAmount ?? "0.00"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Kaydı oluşturan kullanıcı</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.UserId ?? "Belirtilmemiş"}
                </p>
              </article>
            </div>

            <div>
              <h2 className="mb-5 text-2xl font-semibold">
                Fatura kalemleri
              </h2>

              {invoice.Lines.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 text-slate-300">
                Fatura kalemi bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-sm text-slate-300">
                      <tr>
                        <th className="px-5 py-4">Kalem</th>
                        <th className="px-5 py-4">Ürün ID</th>
                        <th className="px-5 py-4">Miktar</th>
                        <th className="px-5 py-4">Birim fiyat</th>
                        <th className="px-5 py-4">Kalem toplamı</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {invoice.Lines.map((line) => (
                        <tr
                          key={line.InvoiceLineId}
                          className="bg-slate-950"
                        >
                          <td className="px-5 py-4 font-medium text-cyan-300">
                            {line.ItemName}
                          </td>

                          <td className="px-5 py-4">
                            {line.ProductId ?? "Not specified"}
                          </td>

                          <td className="px-5 py-4">
                            {line.Quantity}
                          </td>

                          <td className="px-5 py-4">
                            {line.Price}
                          </td>

                          <td className="px-5 py-4">
                            {(
                              Number(line.Price) * line.Quantity
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}