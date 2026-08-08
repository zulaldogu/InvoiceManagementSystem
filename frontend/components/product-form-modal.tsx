"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from "@/types/product";

type ProductFormModalProps = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function ProductFormModal({
  product,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = product !== null;

  const [productCode, setProductCode] = useState(
    product?.ProductCode ?? "",
  );
  const [productName, setProductName] = useState(
    product?.ProductName ?? "",
  );
  const [unitPrice, setUnitPrice] = useState(
    product?.UnitPrice ?? "",
  );
  const [vatRate, setVatRate] = useState(
    product?.VatRate ?? "20",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError("Ürün adı zorunludur.");
      return;
    }

    if (unitPrice === "" || Number(unitPrice) < 0) {
      setError("Geçerli bir birim fiyat girin.");
      return;
    }

    if (
      vatRate !== "" &&
      (Number(vatRate) < 0 || Number(vatRate) > 100)
    ) {
      setError("KDV oranı 0 ile 100 arasında olmalıdır.");
      return;
    }

    const request: ProductCreate | ProductUpdate = {
      ProductCode: productCode.trim() || null,
      ProductName: productName.trim(),
      UnitPrice: Number(unitPrice),
      VatRate: vatRate === "" ? null : Number(vatRate),
    };

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await apiRequest<Product>(
          `/products/${product.ProductId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
          },
        );
      } else {
        await apiRequest<Product>("/products/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });
      }

      await onSaved();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ürün kaydedilirken beklenmeyen bir hata oluştu.";

      setError(
        message === "Product code already exists in this company"
          ? "Bu ürün kodu firmanızda zaten kullanılıyor."
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-xl overflow-hidden rounded-xl border border-app-border bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Ürün ve hizmet yönetimi
            </p>

            <h2
              id="product-modal-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {isEditing
                ? "Ürün veya Hizmeti Düzenle"
                : "Yeni Ürün veya Hizmet Ekle"}
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Faturalarda kullanılacak ürün veya hizmet bilgilerini
              kaydedin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Pencereyi kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xl text-text-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="product-code"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Ürün kodu
              </label>

              <input
                id="product-code"
                type="text"
                value={productCode}
                onChange={(event) =>
                  setProductCode(event.target.value)
                }
                placeholder="Örn. PRD-001"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />

              <p className="mt-1.5 text-xs text-text-muted">
                Aynı firma içinde benzersiz olmalıdır.
              </p>
            </div>

            <div>
              <label
                htmlFor="product-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Ürün veya hizmet adı
                <span className="ml-1 text-danger">*</span>
              </label>

              <input
                id="product-name"
                type="text"
                required
                value={productName}
                onChange={(event) =>
                  setProductName(event.target.value)
                }
                placeholder="Ürün veya hizmet adını girin"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="unit-price"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Birim fiyat
                  <span className="ml-1 text-danger">*</span>
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-text-muted">
                    ₺
                  </span>

                  <input
                    id="unit-price"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={unitPrice}
                    onChange={(event) =>
                      setUnitPrice(event.target.value)
                    }
                    placeholder="0,00"
                    className="w-full rounded-md border border-app-border bg-surface px-4 py-3 pl-9 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="vat-rate"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  KDV oranı (%)
                </label>

                <input
                  id="vat-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={vatRate}
                  onChange={(event) =>
                    setVatRate(event.target.value)
                  }
                  placeholder="20"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />

                <p className="mt-1.5 text-xs text-text-muted">
                  0 ile 100 arasında bir değer girin.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-app-border bg-surface-muted px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-app-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : isEditing
                  ? "Değişiklikleri Kaydet"
                  : "Ürünü Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}