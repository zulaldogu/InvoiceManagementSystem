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
        const data = await apiRequest<Invoice[]>("/invoices/");
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
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 className="text-3xl font-semibold tracking-tight">
      Faturalar
    </h1>

    <p className="mt-2 text-sm text-slate-400">
      Firmanıza ait faturaları görüntüleyin ve yönetin.
    </p>
  </div>

  <Link
    href="/invoices/new"
    className="inline-flex items-center rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
  >
    + Yeni Fatura Oluştur
  </Link>
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