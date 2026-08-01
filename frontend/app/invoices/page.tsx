"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Invoice } from "@/types/invoice";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await apiRequest<Invoice[]>(
          "/invoices/?user_id=1",
        );
        setInvoices(data);
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

    loadInvoices();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
        >
         ← Ana panele dön
        </Link>

        <div className="mb-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            Fatura Yönetim Sistemi
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Faturalar
          </h1>

          <p className="mt-4 text-slate-300">
            FastAPI backend üzerinden alınan fatura kayıtları.
          </p>
        </div>

        {isLoading && (
          <p className="text-slate-300">Faturalar yükleniyor...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && invoices.length === 0 && (
          <p className="text-slate-300">Fatura bulunamadı.</p>
        )}

        {!isLoading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4">Fatura numarası</th>
                  <th className="px-5 py-4">Müşteri ID</th>
                  <th className="px-5 py-4">Fatura tarihi</th>
                  <th className="px-5 py-4">Toplam tutar</th>
                  <th className="px-5 py-4">İşlemler</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.InvoiceId}
                    className="bg-slate-950"
                  >
                    <td className="px-5 py-4 font-medium text-cyan-300">
                      {invoice.InvoiceNumber}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.CustomerId ?? "Belirtilmemiş"}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.InvoiceDate
                        ? new Date(
                            invoice.InvoiceDate,
                          ).toLocaleDateString("tr-TR")
                        : "Not specified"}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.TotalAmount ?? "0.00"}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/invoices/${invoice.InvoiceId}`}
                        className="font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        Detayları görüntüle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}