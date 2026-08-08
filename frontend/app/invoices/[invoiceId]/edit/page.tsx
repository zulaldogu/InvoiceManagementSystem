"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice, InvoiceLine } from "@/types/invoice";
import type { Product } from "@/types/product";

type EditableInvoiceLine = {
  InvoiceLineId: number;
  ProductId: string;
  Quantity: number;
  Price: string;
};

type NewInvoiceLine = {
  ProductId: string;
  Quantity: number;
  Price: string;
};

function formatCurrency(value: number | string | null) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function createEditableLines(
  lines: InvoiceLine[],
): EditableInvoiceLine[] {
  return lines.map((line) => ({
    InvoiceLineId: line.InvoiceLineId,
    ProductId: String(line.ProductId),
    Quantity: line.Quantity,
    Price: line.Price,
  }));
}

function createNewLine(): NewInvoiceLine {
  return {
    ProductId: "",
    Quantity: 1,
    Price: "",
  };
}

export default function EditInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [editableLines, setEditableLines] = useState<
    EditableInvoiceLine[]
  >([]);
  const [newLine, setNewLine] =
    useState<NewInvoiceLine>(createNewLine());

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingHeader, setIsSubmittingHeader] =
    useState(false);
  const [busyLineId, setBusyLineId] =
    useState<number | null>(null);
  const [isAddingLine, setIsAddingLine] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadEditPage() {
      try {
        const [invoiceData, customerData, productData] =
          await Promise.all([
            apiRequest<Invoice>(`/invoices/${invoiceId}`),
            apiRequest<Customer[]>("/customers/"),
            apiRequest<Product[]>("/products/"),
          ]);

        if (!isActive) {
          return;
        }

        setInvoice(invoiceData);
        setCustomers(customerData);
        setProducts(productData);

        setCustomerId(String(invoiceData.CustomerId));
        setInvoiceNumber(invoiceData.InvoiceNumber);
        setInvoiceDate(
          invoiceData.InvoiceDate
            ? invoiceData.InvoiceDate.slice(0, 10)
            : "",
        );

        setEditableLines(
          createEditableLines(invoiceData.Lines),
        );
      } catch (requestError) {
        if (isActive) {
          setLoadError(
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

  const editableSubtotal = useMemo(
    () =>
      editableLines.reduce((total, line) => {
        const quantity = Number(line.Quantity);
        const price = Number(line.Price);

        if (
          !Number.isFinite(quantity) ||
          !Number.isFinite(price)
        ) {
          return total;
        }

        return total + quantity * price;
      }, 0),
    [editableLines],
  );

  async function refreshInvoice() {
    const refreshedInvoice = await apiRequest<Invoice>(
      `/invoices/${invoiceId}`,
    );

    setInvoice(refreshedInvoice);
    setEditableLines(
      createEditableLines(refreshedInvoice.Lines),
    );

    return refreshedInvoice;
  }

  function clearMessages() {
    setActionError(null);
    setNotice(null);
  }

  function updateEditableLine(
    invoiceLineId: number,
    field: "Quantity" | "Price",
    value: number | string,
  ) {
    setEditableLines((currentLines) =>
      currentLines.map((line) =>
        line.InvoiceLineId === invoiceLineId
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    );
  }

  function handleExistingProductChange(
    invoiceLineId: number,
    productId: string,
  ) {
    const selectedProduct = products.find(
      (product) =>
        String(product.ProductId) === productId,
    );

    setEditableLines((currentLines) =>
      currentLines.map((line) =>
        line.InvoiceLineId === invoiceLineId
          ? {
              ...line,
              ProductId: productId,
              Price: selectedProduct?.UnitPrice ?? "",
            }
          : line,
      ),
    );
  }

  function handleNewProductChange(productId: string) {
    const selectedProduct = products.find(
      (product) =>
        String(product.ProductId) === productId,
    );

    setNewLine((currentLine) => ({
      ...currentLine,
      ProductId: productId,
      Price: selectedProduct?.UnitPrice ?? "",
    }));
  }

  function getVatRate(productId: string) {
    const product = products.find(
      (currentProduct) =>
        String(currentProduct.ProductId) === productId,
    );

    if (!product || product.VatRate === null) {
      return "—";
    }

    return `%${Number(product.VatRate).toLocaleString(
      "tr-TR",
      {
        maximumFractionDigits: 2,
      },
    )}`;
  }

  async function handleHeaderSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    clearMessages();

    const parsedCustomerId = Number(customerId);

    if (
      !Number.isInteger(parsedCustomerId) ||
      parsedCustomerId <= 0
    ) {
      setActionError("Lütfen geçerli bir müşteri seçin.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setActionError("Fatura numarası zorunludur.");
      return;
    }

    try {
      setIsSubmittingHeader(true);

      const updatedInvoice = await apiRequest<Invoice>(
        `/invoices/${invoiceId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            CustomerId: parsedCustomerId,
            InvoiceNumber: invoiceNumber.trim(),
            InvoiceDate: invoiceDate || null,
          }),
        },
      );

      setInvoice(updatedInvoice);
      setEditableLines(
        createEditableLines(updatedInvoice.Lines),
      );
      setInvoiceNumber(updatedInvoice.InvoiceNumber);
      setCustomerId(String(updatedInvoice.CustomerId));
      setInvoiceDate(
        updatedInvoice.InvoiceDate
          ? updatedInvoice.InvoiceDate.slice(0, 10)
          : "",
      );

      setNotice("Fatura üst bilgileri başarıyla güncellendi.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Fatura güncellenirken beklenmeyen bir hata oluştu.";

      setActionError(
        message ===
          "Invoice number already exists in this company"
          ? "Bu fatura numarası aynı firma içinde zaten kullanılıyor."
          : message,
      );
    } finally {
      setIsSubmittingHeader(false);
    }
  }

  async function handleUpdateLine(
    line: EditableInvoiceLine,
  ) {
    clearMessages();

    const parsedProductId = Number(line.ProductId);
    const parsedQuantity = Number(line.Quantity);
    const parsedPrice = Number(line.Price);

    if (
      !Number.isInteger(parsedProductId) ||
      parsedProductId <= 0
    ) {
      setActionError(
        "Güncellenecek satır için geçerli bir ürün seçin.",
      );
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setActionError("Miktar sıfırdan büyük olmalıdır.");
      return;
    }

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      setActionError(
        "Birim fiyat sıfır veya sıfırdan büyük olmalıdır.",
      );
      return;
    }

    try {
      setBusyLineId(line.InvoiceLineId);

      await apiRequest<InvoiceLine>(
        `/invoice-lines/${line.InvoiceLineId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ProductId: parsedProductId,
            Quantity: parsedQuantity,
            Price: parsedPrice,
          }),
        },
      );

      await refreshInvoice();

      setNotice("Fatura kalemi başarıyla güncellendi.");
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Fatura kalemi güncellenemedi.",
      );
    } finally {
      setBusyLineId(null);
    }
  }

  async function handleDeleteLine(
    line: EditableInvoiceLine,
  ) {
    clearMessages();

    if (editableLines.length <= 1) {
      setActionError(
        "Faturada en az bir ürün veya hizmet kalemi bulunmalıdır.",
      );
      return;
    }

    const currentProduct = products.find(
      (product) =>
        String(product.ProductId) === line.ProductId,
    );

    const confirmed = window.confirm(
      `"${currentProduct?.ProductName ?? "Seçili ürün"}" kalemini faturadan kaldırmak istediğinizden emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyLineId(line.InvoiceLineId);

      await apiRequest<{ message: string }>(
        `/invoice-lines/${line.InvoiceLineId}`,
        {
          method: "DELETE",
        },
      );

      await refreshInvoice();

      setNotice("Fatura kalemi başarıyla kaldırıldı.");
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Fatura kalemi kaldırılamadı.",
      );
    } finally {
      setBusyLineId(null);
    }
  }

  async function handleAddLine() {
    clearMessages();

    const parsedProductId = Number(newLine.ProductId);
    const parsedQuantity = Number(newLine.Quantity);
    const parsedPrice = Number(newLine.Price);

    if (
      !Number.isInteger(parsedProductId) ||
      parsedProductId <= 0
    ) {
      setActionError(
        "Eklenecek satır için geçerli bir ürün seçin.",
      );
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setActionError("Miktar sıfırdan büyük olmalıdır.");
      return;
    }

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      setActionError(
        "Birim fiyat sıfır veya sıfırdan büyük olmalıdır.",
      );
      return;
    }

    try {
      setIsAddingLine(true);

      await apiRequest<InvoiceLine>("/invoice-lines/", {
        method: "POST",
        body: JSON.stringify({
          InvoiceId: Number(invoiceId),
          ProductId: parsedProductId,
          Quantity: parsedQuantity,
          Price: parsedPrice,
        }),
      });

      await refreshInvoice();

      setNewLine(createNewLine());
      setNotice("Yeni fatura kalemi başarıyla eklendi.");
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Yeni fatura kalemi eklenemedi.",
      );
    } finally {
      setIsAddingLine(false);
    }
  }

  return (
    <main className="min-h-full bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1490px]">
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

        {!isLoading && loadError ? (
          <section
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
            role="alert"
          >
            {loadError}
          </section>
        ) : null}

        {!isLoading && !loadError && invoice ? (
          <>
            <header className="mt-5 border-b border-app-border pb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Fatura yönetimi
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Faturayı Düzenle
              </h1>

              <p className="mt-2 text-base text-text-muted">
                {invoice.InvoiceNumber} numaralı faturanın üst
                bilgilerini ve ürün/hizmet kalemlerini yönetin.
              </p>
            </header>

            {notice ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-success">
                {notice}
              </div>
            ) : null}

            {actionError ? (
              <div
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
                role="alert"
              >
                {actionError}
              </div>
            ) : null}

            <form
              className="mt-7"
              onSubmit={handleHeaderSubmit}
            >
              <section className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
                <div className="border-b border-app-border px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Temel bilgiler
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Fatura Bilgileri
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    Faturanın müşterisini, numarasını ve tarihini
                    güncelleyin.
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
                      className="h-12 rounded-lg border border-app-border bg-surface px-4 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
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

                <div className="flex justify-end border-t border-app-border bg-surface-muted px-6 py-4">
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmittingHeader}
                    type="submit"
                  >
                    {isSubmittingHeader
                      ? "Kaydediliyor..."
                      : "Üst Bilgileri Kaydet"}
                  </button>
                </div>
              </section>
            </form>

            <section className="mt-6 overflow-hidden rounded-lg border border-app-border bg-surface shadow-sm">
              <div className="border-b border-app-border px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Fatura içeriği
                </p>

                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Ürün ve Hizmet Kalemleri
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                  Mevcut satırları güncelleyin, kaldırın veya
                  faturaya yeni bir satır ekleyin.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left">
                  <thead className="bg-primary-soft text-xs uppercase tracking-[0.08em] text-text-muted">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Ürün / Hizmet
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Miktar
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Birim fiyat
                      </th>

                      <th className="px-4 py-4 text-center font-semibold">
                        KDV
                      </th>

                      <th className="px-4 py-4 text-right font-semibold">
                        Tutar
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-app-border">
                    {editableLines.map((line) => {
                      const lineTotal =
                        Number(line.Quantity) *
                        Number(line.Price || 0);

                      return (
                        <tr key={line.InvoiceLineId}>
                          <td className="min-w-[320px] px-6 py-5">
                            <select
                              className="h-11 w-full rounded-lg border border-app-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                              onChange={(event) =>
                                handleExistingProductChange(
                                  line.InvoiceLineId,
                                  event.target.value,
                                )
                              }
                              value={line.ProductId}
                            >
                              <option value="">
                                Ürün veya hizmet seçin
                              </option>

                              {products.map((product) => (
                                <option
                                  key={product.ProductId}
                                  value={product.ProductId}
                                >
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
                              className="h-11 w-full rounded-lg border border-app-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                              min={1}
                              onChange={(event) =>
                                updateEditableLine(
                                  line.InvoiceLineId,
                                  "Quantity",
                                  Number(event.target.value),
                                )
                              }
                              step={1}
                              type="number"
                              value={line.Quantity}
                            />
                          </td>

                          <td className="w-44 px-4 py-5">
                            <input
                              className="h-11 w-full rounded-lg border border-app-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                              min={0}
                              onChange={(event) =>
                                updateEditableLine(
                                  line.InvoiceLineId,
                                  "Price",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={line.Price}
                            />
                          </td>

                          <td className="px-4 py-5 text-center">
                            <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-dark">
                              {getVatRate(line.ProductId)}
                            </span>
                          </td>

                          <td className="px-4 py-5 text-right font-bold text-foreground">
                            {formatCurrency(lineTotal)}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                className="inline-flex h-10 min-w-24 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  busyLineId ===
                                  line.InvoiceLineId
                                }
                                onClick={() =>
                                  handleUpdateLine(line)
                                }
                                type="button"
                              >
                                {busyLineId ===
                                line.InvoiceLineId
                                  ? "İşleniyor..."
                                  : "Güncelle"}
                              </button>

                              <button
                                className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  busyLineId ===
                                    line.InvoiceLineId ||
                                  editableLines.length <= 1
                                }
                                onClick={() =>
                                  handleDeleteLine(line)
                                }
                                type="button"
                              >
                                Kaldır
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-app-border bg-surface-muted p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Yeni kalem
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_0.6fr_0.9fr_auto] lg:items-end">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Ürün / Hizmet
                    <select
                      className="h-11 rounded-lg border border-app-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      onChange={(event) =>
                        handleNewProductChange(
                          event.target.value,
                        )
                      }
                      value={newLine.ProductId}
                    >
                      <option value="">
                        Ürün veya hizmet seçin
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.ProductId}
                          value={product.ProductId}
                        >
                          {product.ProductCode
                            ? `${product.ProductCode} — `
                            : ""}
                          {product.ProductName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Miktar
                    <input
                      className="h-11 rounded-lg border border-app-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      min={1}
                      onChange={(event) =>
                        setNewLine((currentLine) => ({
                          ...currentLine,
                          Quantity: Number(
                            event.target.value,
                          ),
                        }))
                      }
                      step={1}
                      type="number"
                      value={newLine.Quantity}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Birim fiyat
                    <input
                      className="h-11 rounded-lg border border-app-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      min={0}
                      onChange={(event) =>
                        setNewLine((currentLine) => ({
                          ...currentLine,
                          Price: event.target.value,
                        }))
                      }
                      step="0.01"
                      type="number"
                      value={newLine.Price}
                    />
                  </label>

                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isAddingLine}
                    onClick={handleAddLine}
                    type="button"
                  >
                    {isAddingLine
                      ? "Ekleniyor..."
                      : "Kalem Ekle"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end border-t border-app-border bg-surface px-6 py-5">
                <div className="flex w-full max-w-sm items-center justify-between">
                  <span className="font-semibold text-text-muted">
                    Düzenlenen vergi hariç toplam
                  </span>

                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(editableSubtotal)}
                  </span>
                </div>
              </div>
            </section>

            <div className="mt-6 flex justify-end border-t border-app-border pt-6">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg border border-app-border bg-surface px-6 font-semibold text-text-muted transition hover:border-primary hover:text-primary"
                href={`/invoices/${invoiceId}`}
              >
                Fatura Detayına Dön
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}