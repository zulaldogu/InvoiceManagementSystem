"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type {
  Invoice,
  InvoiceCreate,
} from "@/types/invoice";
import type { Product } from "@/types/product";

type DraftLine = {
  ClientId: string;
  ProductId: string;
  Quantity: number;
  Price: string;
};

function getLocalDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

function createDraftLine(clientId: string): DraftLine {
  return {
    ClientId: clientId,
    ProductId: "",
    Quantity: 1,
    Price: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getLocalDate);
  const [lines, setLines] = useState<DraftLine[]>([
    createDraftLine("initial-line"),
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      apiRequest<Customer[]>("/customers/"),
      apiRequest<Product[]>("/products/"),
    ])
      .then(([customerData, productData]) => {
        if (!isActive) {
          return;
        }

        setCustomers(customerData);
        setProducts(productData);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Müşteri ve ürün bilgileri alınamadı.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function updateLine(
    clientId: string,
    changes: Partial<DraftLine>,
  ) {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.ClientId === clientId
          ? { ...line, ...changes }
          : line,
      ),
    );
  }

  function handleProductChange(
    clientId: string,
    productId: string,
  ) {
    const selectedProduct = products.find(
      (product) => product.ProductId === Number(productId),
    );

    updateLine(clientId, {
      ProductId: productId,
      Price: selectedProduct?.UnitPrice ?? "",
    });
  }

  function addLine() {
    setLines((currentLines) => [
      ...currentLines,
      createDraftLine(`line-${Date.now()}`),
    ]);
  }

  function removeLine(clientId: string) {
    setLines((currentLines) =>
      currentLines.filter(
        (line) => line.ClientId !== clientId,
      ),
    );
  }

  const subtotal = lines.reduce((total, line) => {
    const price = Number(line.Price);
    const quantity = Number(line.Quantity);

    if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
      return total;
    }

    return total + price * quantity;
  }, 0);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Lütfen bir müşteri seçin.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Fatura numarası zorunludur.");
      return;
    }

    if (lines.length === 0) {
      setError("Faturaya en az bir kalem ekleyin.");
      return;
    }

    const hasInvalidLine = lines.some(
      (line) =>
        !line.ProductId ||
        line.Quantity <= 0 ||
        line.Price === "" ||
        Number(line.Price) < 0,
    );

    if (hasInvalidLine) {
      setError("Lütfen bütün fatura kalemlerini kontrol edin.");
      return;
    }

    const request: InvoiceCreate = {
      CustomerId: Number(customerId),
      InvoiceNumber: invoiceNumber.trim(),
      InvoiceDate: `${invoiceDate}T00:00:00`,
      Lines: lines.map((line) => ({
        ProductId: Number(line.ProductId),
        Quantity: Number(line.Quantity),
        Price: Number(line.Price),
      })),
    };

    setIsSubmitting(true);

    try {
      const createdInvoice = await apiRequest<Invoice>(
        "/invoices/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      router.push(`/invoices/${createdInvoice.InvoiceId}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Fatura kaydedilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/invoices"
              className="mb-4 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              ← Faturalara dön
            </Link>

            <h2 className="text-3xl font-semibold">
              Yeni Fatura Oluştur
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Müşteri ve fatura kalemlerini seçerek yeni bir
              fatura kaydı oluşturun.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-3 text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Vergi hariç toplam
            </p>
            <p className="mt-1 text-2xl font-semibold text-cyan-300">
              {formatCurrency(subtotal)}
            </p>
          </div>
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
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            Müşteri ve ürün bilgileri yükleniyor...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">
                  Fatura Bilgileri
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Faturanın müşteri, numara ve tarih bilgileri.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label
                    htmlFor="customer"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Müşteri
                  </label>

                  <select
                    id="customer"
                    required
                    value={customerId}
                    onChange={(event) =>
                      setCustomerId(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  >
                    <option value="">Müşteri seçin</option>

                    {customers.map((customer) => (
                      <option
                        key={customer.CustomerId}
                        value={customer.CustomerId}
                      >
                        {customer.Title} –{" "}
                        {customer.TaxNumber ?? "Vergi no yok"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="invoice-number"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Fatura numarası
                  </label>

                  <input
                    id="invoice-number"
                    type="text"
                    required
                    maxLength={20}
                    value={invoiceNumber}
                    onChange={(event) =>
                      setInvoiceNumber(event.target.value)
                    }
                    placeholder="Örn. INV-2026-003"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoice-date"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Fatura tarihi
                  </label>

                  <input
                    id="invoice-date"
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(event) =>
                      setInvoiceDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Fatura Kalemleri
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Faturada yer alacak ürün veya hizmetler.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addLine}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  + Yeni satır ekle
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Ürün / Hizmet</th>
                      <th className="px-6 py-4">Miktar</th>
                      <th className="px-6 py-4">Birim fiyat</th>
                      <th className="px-6 py-4">Tutar</th>
                      <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {lines.map((line) => (
                      <tr key={line.ClientId}>
                        <td className="px-6 py-4">
                          <select
                            required
                            value={line.ProductId}
                            onChange={(event) =>
                              handleProductChange(
                                line.ClientId,
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-cyan-400"
                          >
                            <option value="">Ürün seçin</option>

                            {products.map((product) => (
                              <option
                                key={product.ProductId}
                                value={product.ProductId}
                              >
                                {product.ProductCode} –{" "}
                                {product.ProductName}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            required
                            min={1}
                            value={line.Quantity}
                            onChange={(event) =>
                              updateLine(line.ClientId, {
                                Quantity: Number(event.target.value),
                              })
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-cyan-400"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            required
                            min={0}
                            step="0.01"
                            value={line.Price}
                            onChange={(event) =>
                              updateLine(line.ClientId, {
                                Price: event.target.value,
                              })
                            }
                            className="w-36 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-cyan-400"
                          />
                        </td>

                        <td className="px-6 py-4 font-semibold text-cyan-300">
                          {formatCurrency(
                            Number(line.Price || 0) *
                              Number(line.Quantity || 0),
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={lines.length === 1}
                            onClick={() =>
                              removeLine(line.ClientId)
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href="/invoices"
                className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
              >
                İptal
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Fatura kaydediliyor..."
                  : "Faturayı kaydet"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}