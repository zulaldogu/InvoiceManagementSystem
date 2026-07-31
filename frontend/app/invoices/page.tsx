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
            : "An unexpected error occurred.",
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
          ← Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            Invoice Management System
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Invoices
          </h1>

          <p className="mt-4 text-slate-300">
            Invoice records retrieved from the FastAPI backend.
          </p>
        </div>

        {isLoading && (
          <p className="text-slate-300">Loading invoices...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && invoices.length === 0 && (
          <p className="text-slate-300">No invoices were found.</p>
        )}

        {!isLoading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4">Invoice number</th>
                  <th className="px-5 py-4">Customer ID</th>
                  <th className="px-5 py-4">Invoice date</th>
                  <th className="px-5 py-4">Total amount</th>
                  <th className="px-5 py-4">Actions</th>
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
                      {invoice.CustomerId ?? "Not specified"}
                    </td>

                    <td className="px-5 py-4">
                      {invoice.InvoiceDate
                        ? new Date(
                            invoice.InvoiceDate,
                          ).toLocaleDateString("en-GB")
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
                        View details
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