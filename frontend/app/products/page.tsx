"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiRequest<Product[]>("/products/");
        setProducts(data);
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

    loadProducts();
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

          <h1 className="text-4xl font-semibold tracking-tight">Products</h1>

          <p className="mt-4 text-slate-300">
            Products and services retrieved from the FastAPI backend.
          </p>
        </div>

        {isLoading && (
          <p className="text-slate-300">Loading products...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p className="text-slate-300">No products were found.</p>
        )}

        {!isLoading && !error && products.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Product name</th>
                  <th className="px-5 py-4">Unit price</th>
                  <th className="px-5 py-4">VAT rate</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {products.map((product) => (
                  <tr key={product.ProductId} className="bg-slate-950">
                    <td className="px-5 py-4 text-cyan-300">
                      {product.ProductCode}
                    </td>
                    <td className="px-5 py-4">{product.ProductName}</td>
                    <td className="px-5 py-4">{product.UnitPrice}</td>
                    <td className="px-5 py-4">
                      {product.VatRate === null
                        ? "Not specified"
                        : `${product.VatRate}%`}
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