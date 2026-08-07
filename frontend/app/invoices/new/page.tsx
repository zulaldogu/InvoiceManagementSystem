"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice, InvoiceCreate } from "@/types/invoice";
import type { Product } from "@/types/product";

type DraftLine = {
  ClientId: number;
  ProductId: string;
  Quantity: number;
  Price: string;
};

function getLocalDate() {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

function createDraftLine(clientId: number): DraftLine {
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
  const [invoiceDate, setInvoiceDate] = useState(getLocalDate());
  const [lines, setLines] = useState<DraftLine[]>([createDraftLine(1)]);
  const [nextClientId, setNextClientId] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFormData() {
      try {
        const [customerData, productData] = await Promise.all([
          apiRequest<Customer[]>("/customers/"),
          apiRequest<Product[]>("/products/"),
        ]);

        setCustomers(customerData);
        setProducts(productData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Fatura formu için gerekli veriler alınamadı.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadFormData();
  }, []);

  const subtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const price = Number(line.Price);
        const quantity = Number(line.Quantity);

        if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
          return total;
        }

        return total + price * quantity;
      }, 0),
    [lines],
  );

  function updateLine(
    clientId: number,
    field: keyof Omit<DraftLine, "ClientId">,
    value: string | number,
  ) {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.ClientId === clientId
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    );
  }

  function handleProductChange(clientId: number, productId: string) {
    const selectedProduct = products.find(
      (product) => String(product.ProductId) === productId,
    );

    setLines((currentLines) =>
      currentLines.map((line) =>
        line.ClientId === clientId
          ? {
              ...line,
              ProductId: productId,
              Price: selectedProduct?.UnitPrice ?? "",
            }
          : line,
      ),
    );
  }

  function addLine() {
    setLines((currentLines) => [
      ...currentLines,
      createDraftLine(nextClientId),
    ]);
    setNextClientId((currentId) => currentId + 1);
  }

  function removeLine(clientId: number) {
    setLines((currentLines) => {
      if (currentLines.length === 1) {
        return currentLines;
      }

      return currentLines.filter((line) => line.ClientId !== clientId);
    });
  }

  function getVatRate(productId: string) {
    const product = products.find(
      (currentProduct) => String(currentProduct.ProductId) === productId,
    );

    if (!product || product.VatRate === null) {
      return "—";
    }

    return `%${Number(product.VatRate).toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    })}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedCustomerId = Number(customerId);

    if (!Number.isInteger(parsedCustomerId) || parsedCustomerId <= 0) {
      setError("Lütfen bir müşteri seçin.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Fatura numarası zorunludur.");
      return;
    }

    if (lines.length === 0) {
      setError("Faturada en az bir ürün veya hizmet bulunmalıdır.");
      return;
    }

    const invalidLine = lines.some((line) => {
      const productId = Number(line.ProductId);
      const quantity = Number(line.Quantity);
      const price = Number(line.Price);

      return (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      );
    });

    if (invalidLine) {
      setError(
        "Her satır için geçerli bir ürün, miktar ve birim fiyat girin.",
      );
      return;
    }

    const payload: InvoiceCreate = {
      CustomerId: parsedCustomerId,
      InvoiceNumber: invoiceNumber.trim(),
      InvoiceDate: invoiceDate,
      Lines: lines.map((line) => ({
        ProductId: Number(line.ProductId),
        Quantity: Number(line.Quantity),
        Price: Number(line.Price),
      })),
    };

    try {
      setIsSubmitting(true);

      const createdInvoice = await apiRequest<Invoice>("/invoices/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(`/invoices/${createdInvoice.InvoiceId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Fatura oluşturulamadı.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <main className="min-h-full bg-background px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1490px]">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/75"
            href="/invoices"
          >
            <span aria-hidden="true">←</span>
            Faturalara dön
          </Link>

          <div className="mt-5 flex flex-col gap-4 border-b border-app-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Fatura yönetimi
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Yeni Fatura Oluştur
              </h1>

              <p className="mt-2 text-base text-text-muted">
                Müşteri ve fatura bilgilerini girerek ürün veya hizmetleri
                faturaya ekleyin.
              </p>
            </div>

            <div className="rounded-xl border border-app-border bg-surface px-5 py-3 text-right shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                Vergi hariç toplam
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>

          {isLoading ? (
            <section className="mt-8 rounded-xl border border-app-border bg-surface p-8 text-text-muted shadow-sm">
              Fatura formu hazırlanıyor...
            </section>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <section className="overflow-hidden rounded-xl border border-app-border bg-surface shadow-sm">
                <div className="border-b border-app-border px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Temel bilgiler
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Fatura Bilgileri
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Faturanın müşterisini, numarasını ve düzenlenme tarihini
                    belirleyin.
                  </p>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Müşteri
                    <select
                      className="h-12 rounded-lg border border-app-border bg-white px-4 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      onChange={(event) => setCustomerId(event.target.value)}
                      required
                      value={customerId}
                    >
                      <option value="">Müşteri seçin</option>
                      {customers.map((customer) => (
                        <option key={customer.CustomerId} value={customer.CustomerId}>
                          {customer.Title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Fatura numarası
                    <input
                      className="h-12 rounded-lg border border-app-border bg-white px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      maxLength={20}
                      onChange={(event) =>
                        setInvoiceNumber(event.target.value)
                      }
                      placeholder="Örn. INV-2026-001"
                      required
                      type="text"
                      value={invoiceNumber}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Fatura tarihi
                    <input
                      className="h-12 rounded-lg border border-app-border bg-white px-4 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      onChange={(event) => setInvoiceDate(event.target.value)}
                      type="date"
                      value={invoiceDate}
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-app-border bg-surface shadow-sm">
                <div className="flex flex-col gap-4 border-b border-app-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      Fatura kalemleri
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      Ürün ve Hizmetler
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Faturaya dahil edilecek kayıtları ve miktarlarını
                      belirleyin.
                    </p>
                  </div>

                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-primary px-5 text-sm font-bold text-primary transition hover:bg-primary/5"
                    onClick={addLine}
                    type="button"
                  >
                    + Yeni Satır Ekle
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="m-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                    Faturaya eklenebilecek ürün veya hizmet bulunamadı. Önce
                    ürün yönetimi sayfasından bir kayıt oluşturun.
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-[1050px] w-full border-collapse text-left">
                    <thead className="bg-primary-soft">
                      <tr className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
                        <th className="px-6 py-4">No</th>
                        <th className="px-4 py-4">Ürün / Hizmet</th>
                        <th className="px-4 py-4">Miktar</th>
                        <th className="px-4 py-4">Birim Fiyat</th>
                        <th className="px-4 py-4 text-center">KDV</th>
                        <th className="px-4 py-4 text-right">Tutar</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                      </tr>
                    </thead>

                    <tbody>
                      {lines.map((line, index) => {
                        const lineTotal =
                          Number(line.Price || 0) *
                          Number(line.Quantity || 0);

                        return (
                          <tr
                            className="border-t border-app-border align-middle"
                            key={line.ClientId}
                          >
                            <td className="px-6 py-5 text-sm font-bold text-text-muted">
                              {index + 1}
                            </td>

                            <td className="min-w-[310px] px-4 py-5">
                              <select
                                className="h-11 w-full rounded-lg border border-app-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                onChange={(event) =>
                                  handleProductChange(
                                    line.ClientId,
                                    event.target.value,
                                  )
                                }
                                required
                                value={line.ProductId}
                              >
                                <option value="">Ürün veya hizmet seçin</option>
                                {products.map((product) => (
                                  <option key={product.ProductId} value={product.ProductId}>
                                    {product.ProductCode
                                      ? `${product.ProductCode} — `
                                      : ""}
                                    {product.ProductName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="w-32 px-4 py-5">
                              <input
                                className="h-11 w-full rounded-lg border border-app-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                min={1}
                                onChange={(event) =>
                                  updateLine(
                                    line.ClientId,
                                    "Quantity",
                                    Number(event.target.value),
                                  )
                                }
                                required
                                step={1}
                                type="number"
                                value={line.Quantity}
                              />
                            </td>

                            <td className="w-44 px-4 py-5">
                              <input
                                className="h-11 w-full rounded-lg border border-app-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                min={0}
                                onChange={(event) =>
                                  updateLine(
                                    line.ClientId,
                                    "Price",
                                    event.target.value,
                                  )
                                }
                                required
                                step="0.01"
                                type="number"
                                value={line.Price}
                              />
                            </td>

                            <td className="px-4 py-5 text-center">
                              <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
                                {getVatRate(line.ProductId)}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-right font-bold text-foreground">
                              {formatCurrency(
                                Number.isFinite(lineTotal) ? lineTotal : 0,
                              )}
                            </td>

                            <td className="px-6 py-5 text-right">
                              <button
                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={lines.length === 1}
                                onClick={() => removeLine(line.ClientId)}
                                type="button"
                              >
                                Kaldır
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1fr_390px]">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-5">
                  <h2 className="font-bold text-blue-950">
                    Fatura toplamı hakkında
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    Ürünlerin KDV oranları bilgi amacıyla gösterilmektedir.
                    Mevcut sistemde fatura toplamı, satırların vergi hariç
                    tutarları üzerinden hesaplanır.
                  </p>
                </div>

                <div className="rounded-xl border border-app-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-app-border pb-4">
                    <span className="text-sm font-semibold text-text-muted">
                      Fatura satırı
                    </span>
                    <span className="font-bold text-foreground">
                      {lines.length}
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-5">
                    <div>
                      <p className="text-sm font-semibold text-text-muted">
                        Vergi hariç toplam
                      </p>
                      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:justify-end">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-app-border bg-white px-6 font-semibold text-text-muted transition hover:bg-slate-50"
                  href="/invoices"
                >
                  İptal
                </Link>

                <button
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-7 font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isSubmitting ||
                    customers.length === 0 ||
                    products.length === 0
                  }
                  type="submit"
                >
                  {isSubmitting ? "Fatura kaydediliyor..." : "Faturayı Kaydet"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
  );
}