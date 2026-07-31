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
            : "An unexpected error occurred.",
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
          ← Back to invoices
        </Link>

        {isLoading && (
          <p className="text-slate-300">Loading invoice details...</p>
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
                Invoice Management System
              </p>

              <h1 className="text-4xl font-semibold tracking-tight">
                {invoice.InvoiceNumber}
              </h1>

              <p className="mt-4 text-slate-300">
                Invoice header and related line items.
              </p>
            </div>

            <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Customer ID</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.CustomerId ?? "Not specified"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Invoice date</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.InvoiceDate
                    ? new Date(
                        invoice.InvoiceDate,
                      ).toLocaleDateString("en-GB")
                    : "Not specified"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Total amount</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.TotalAmount ?? "0.00"}
                </p>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Created by user</p>
                <p className="mt-2 text-lg font-medium">
                  {invoice.UserId ?? "Not specified"}
                </p>
              </article>
            </div>

            <div>
              <h2 className="mb-5 text-2xl font-semibold">
                Invoice lines
              </h2>

              {invoice.Lines.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 text-slate-300">
                  No invoice lines were found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-sm text-slate-300">
                      <tr>
                        <th className="px-5 py-4">Item</th>
                        <th className="px-5 py-4">Product ID</th>
                        <th className="px-5 py-4">Quantity</th>
                        <th className="px-5 py-4">Unit price</th>
                        <th className="px-5 py-4">Line total</th>
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