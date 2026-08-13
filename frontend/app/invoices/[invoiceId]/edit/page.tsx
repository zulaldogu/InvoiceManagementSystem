"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calculateInvoiceLineAmounts,
  calculateInvoiceTotals,
} from "@/lib/invoice-calculations";
import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";
import type { Invoice, InvoiceLine } from "@/types/invoice";
import type { Product } from "@/types/product";

type LineFields = {
  ProductId: string;
  Quantity: number;
  Price: string;
  VatRate: string;
  ExciseTaxRate: string;
};

type EditableInvoiceLine = LineFields & {
  InvoiceLineId: number;
};

type ParsedLine = {
  ProductId: number;
  Quantity: number;
  Price: number;
  VatRate: number;
  ExciseTaxRate: number;
};

const inputClass =
  "h-11 w-full rounded-lg border border-app-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft";

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
    VatRate: line.VatRate,
    ExciseTaxRate: line.ExciseTaxRate,
  }));
}

function createNewLine(): LineFields {
  return {
    ProductId: "",
    Quantity: 1,
    Price: "",
    VatRate: "0",
    ExciseTaxRate: "0",
  };
}

function parseLine(line: LineFields): ParsedLine | null {
  const productId = Number(line.ProductId);
  const quantity = Number(line.Quantity);
  const price = Number(line.Price);
  const vatRate = Number(line.VatRate);
  const exciseTaxRate = Number(line.ExciseTaxRate);

  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(vatRate) ||
    vatRate < 0 ||
    vatRate > 100 ||
    !Number.isFinite(exciseTaxRate) ||
    exciseTaxRate < 0 ||
    exciseTaxRate > 100
  ) {
    return null;
  }

  return {
    ProductId: productId,
    Quantity: quantity,
    Price: price,
    VatRate: vatRate,
    ExciseTaxRate: exciseTaxRate,
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
    useState<LineFields>(createNewLine());

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

  const calculatedLines = useMemo(
    () =>
      editableLines.map((line) =>
        calculateInvoiceLineAmounts({
          Quantity: Number(line.Quantity),
          Price: Number(line.Price),
          VatRate: Number(line.VatRate),
          ExciseTaxRate: Number(line.ExciseTaxRate),
        }),
      ),
    [editableLines],
  );

  const editableTotals = useMemo(
    () => calculateInvoiceTotals(calculatedLines),
    [calculatedLines],
  );

  const newLineAmounts = useMemo(
    () =>
      calculateInvoiceLineAmounts({
        Quantity: Number(newLine.Quantity),
        Price: Number(newLine.Price),
        VatRate: Number(newLine.VatRate),
        ExciseTaxRate: Number(newLine.ExciseTaxRate),
      }),
    [newLine],
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
    field: keyof LineFields,
    value: string | number,
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
              VatRate: selectedProduct?.VatRate ?? "0",
              ExciseTaxRate: "0",
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
      VatRate: selectedProduct?.VatRate ?? "0",
      ExciseTaxRate: "0",
    }));
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
          : "Fatura güncellenemedi.";

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

    const parsedLine = parseLine(line);

    if (!parsedLine) {
      setActionError(
        "Geçerli ürün, miktar, fiyat, KDV ve ÖTV oranı girin.",
      );
      return;
    }

    try {
      setBusyLineId(line.InvoiceLineId);

      await apiRequest<InvoiceLine>(
        `/invoice-lines/${line.InvoiceLineId}`,
        {
          method: "PUT",
          body: JSON.stringify(parsedLine),
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

    const parsedLine = parseLine(newLine);

    if (!parsedLine) {
      setActionError(
        "Yeni kalem için geçerli ürün, miktar, fiyat, KDV ve ÖTV oranı girin.",
      );
      return;
    }

    try {
      setIsAddingLine(true);

      await apiRequest<InvoiceLine>("/invoice-lines/", {
        method: "POST",
        body: JSON.stringify({
          InvoiceId: Number(invoiceId),
          ...parsedLine,
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
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1550px]">
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
            <header className="mt-5 flex flex-col gap-4 border-b border-app-border pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Fatura yönetimi
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Faturayı Düzenle
                </h1>

                <p className="mt-2 text-base text-text-muted">
                  {invoice.InvoiceNumber} numaralı faturanın
                  bilgilerini, kalemlerini ve vergilerini yönetin.
                </p>
              </div>

              <div className="rounded-lg bg-primary px-5 py-3 text-right text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-white/75">
                  Ödenecek toplam
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(editableTotals.TotalAmount)}
                </p>
              </div>
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
                    Müşteri, numara ve tarih bilgilerini
                    güncelleyin.
                  </p>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Müşteri
                    <select
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
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
                  Ürün, Hizmet ve Vergiler
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Kalemleri ve KDV/ÖTV oranlarını güncelleyin.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-primary-soft text-xs uppercase tracking-[0.08em] text-text-muted">
                    <tr>
                      <th className="px-5 py-4">Ürün / Hizmet</th>
                      <th className="px-3 py-4">Miktar</th>
                      <th className="px-3 py-4">Birim Fiyat</th>
                      <th className="px-3 py-4">KDV %</th>
                      <th className="px-3 py-4">ÖTV %</th>
                      <th className="px-3 py-4 text-right">
                        Ara Toplam
                      </th>
                      <th className="px-3 py-4 text-right">
                        Vergiler
                      </th>
                      <th className="px-3 py-4 text-right">
                        Satır Toplamı
                      </th>
                      <th className="sticky right-0 z-20 border-l border-app-border bg-primary-soft px-4 py-4 text-right">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-app-border">
                    {editableLines.map((line, index) => {
                      const amounts = calculatedLines[index];

                      return (
                        <tr key={line.InvoiceLineId}>
                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface min-w-[230px] px-5 py-5">
                            <select
                              className={inputClass}
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

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface w-28 px-3 py-5">
                            <input
                              className={inputClass}
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

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface w-36 px-3 py-5">
                            <input
                              className={inputClass}
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

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface w-28 px-3 py-5">
                            <input
                              className={inputClass}
                              max={100}
                              min={0}
                              onChange={(event) =>
                                updateEditableLine(
                                  line.InvoiceLineId,
                                  "VatRate",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={line.VatRate}
                            />
                          </td>

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface w-28 px-3 py-5">
                            <input
                              className={inputClass}
                              max={100}
                              min={0}
                              onChange={(event) =>
                                updateEditableLine(
                                  line.InvoiceLineId,
                                  "ExciseTaxRate",
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={line.ExciseTaxRate}
                            />
                          </td>

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface px-3 py-5 text-right font-semibold">
                            {formatCurrency(amounts.Subtotal)}
                          </td>

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface px-3 py-5 text-right">
                            <p className="font-semibold">
                              {formatCurrency(
                                amounts.VatAmount +
                                  amounts.ExciseTaxAmount,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              KDV{" "}
                              {formatCurrency(amounts.VatAmount)}
                              {" · "}ÖTV{" "}
                              {formatCurrency(
                                amounts.ExciseTaxAmount,
                              )}
                            </p>
                          </td>

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface px-3 py-5 text-right font-bold text-primary">
                            {formatCurrency(amounts.LineTotal)}
                          </td>

                          <td className="sticky right-0 z-10 border-l border-app-border bg-surface px-5 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                className="h-10 rounded-md border border-app-border px-4 text-sm font-semibold text-primary hover:bg-primary-soft disabled:opacity-50"
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
                                className="h-10 rounded-md border border-app-border px-4 text-sm font-semibold text-danger hover:bg-red-50 disabled:opacity-50"
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

                <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_0.6fr_0.9fr_0.65fr_0.65fr_auto] xl:items-end">
                  <label className="grid gap-2 text-sm font-semibold">
                    Ürün / Hizmet
                    <select
                      className={inputClass}
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

                  <label className="grid gap-2 text-sm font-semibold">
                    Miktar
                    <input
                      className={inputClass}
                      min={1}
                      onChange={(event) =>
                        setNewLine((current) => ({
                          ...current,
                          Quantity: Number(event.target.value),
                        }))
                      }
                      step={1}
                      type="number"
                      value={newLine.Quantity}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    Birim fiyat
                    <input
                      className={inputClass}
                      min={0}
                      onChange={(event) =>
                        setNewLine((current) => ({
                          ...current,
                          Price: event.target.value,
                        }))
                      }
                      step="0.01"
                      type="number"
                      value={newLine.Price}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    KDV %
                    <input
                      className={inputClass}
                      max={100}
                      min={0}
                      onChange={(event) =>
                        setNewLine((current) => ({
                          ...current,
                          VatRate: event.target.value,
                        }))
                      }
                      step="0.01"
                      type="number"
                      value={newLine.VatRate}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    ÖTV %
                    <input
                      className={inputClass}
                      max={100}
                      min={0}
                      onChange={(event) =>
                        setNewLine((current) => ({
                          ...current,
                          ExciseTaxRate:
                            event.target.value,
                        }))
                      }
                      step="0.01"
                      type="number"
                      value={newLine.ExciseTaxRate}
                    />
                  </label>

                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                    disabled={isAddingLine}
                    onClick={handleAddLine}
                    type="button"
                  >
                    {isAddingLine
                      ? "Ekleniyor..."
                      : "Kalem Ekle"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-x-6 gap-y-2 text-sm">
                  <span>
                    Ara toplam:{" "}
                    <strong>
                      {formatCurrency(
                        newLineAmounts.Subtotal,
                      )}
                    </strong>
                  </span>
                  <span>
                    Vergiler:{" "}
                    <strong>
                      {formatCurrency(
                        newLineAmounts.VatAmount +
                          newLineAmounts.ExciseTaxAmount,
                      )}
                    </strong>
                  </span>
                  <span>
                    Satır toplamı:{" "}
                    <strong className="text-primary">
                      {formatCurrency(
                        newLineAmounts.LineTotal,
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-end border-t border-app-border bg-surface px-6 py-5">
                <dl className="w-full max-w-md space-y-3">
                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-muted">
                      Vergi hariç toplam
                    </dt>
                    <dd className="font-bold">
                      {formatCurrency(
                        editableTotals.Subtotal,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-muted">
                      Toplam ÖTV
                    </dt>
                    <dd className="font-bold">
                      {formatCurrency(
                        editableTotals.ExciseTaxTotal,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-muted">
                      Toplam KDV
                    </dt>
                    <dd className="font-bold">
                      {formatCurrency(
                        editableTotals.VatTotal,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between border-t border-app-border pt-4">
                    <dt className="font-bold">
                      Düzenleme önizlemesi
                    </dt>
                    <dd className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        editableTotals.TotalAmount,
                      )}
                    </dd>
                  </div>
                </dl>
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