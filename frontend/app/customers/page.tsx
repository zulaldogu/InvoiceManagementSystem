"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await apiRequest<Customer[]>(
          "/customers/?user_id=1",
        );
        setCustomers(data);
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

    loadCustomers();
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
            Müşteriler
          </h1>

          <p className="mt-4 text-slate-300">
            FastAPI backend üzerinden alınan müşteri kayıtları.
          </p>
        </div>

        {isLoading && (
          <p className="text-slate-300">Müşteriler yükleniyor...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && customers.length === 0 && (
          <p className="text-slate-300">Müşteri bulunamadı.</p>
        )}

        {!isLoading && !error && customers.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4">Unvan</th>
                  <th className="px-5 py-4">Vergi numarası</th>
                  <th className="px-5 py-4">E-posta</th>
                  <th className="px-5 py-4">Adres</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.CustomerId}
                    className="bg-slate-950"
                  >
                    <td className="px-5 py-4 font-medium text-cyan-300">
                      {customer.Title}
                    </td>

                    <td className="px-5 py-4">
                      {customer.TaxNumber ?? "Belirtilmemiş"}
                    </td>

                    <td className="px-5 py-4">
                      {customer.EMail ?? "Belirtilmemiş"}
                    </td>

                    <td className="px-5 py-4">
                      {customer.Address ?? "Belirtilmemiş"}
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