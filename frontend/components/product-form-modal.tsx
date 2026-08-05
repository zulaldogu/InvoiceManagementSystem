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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2
              id="product-modal-title"
              className="text-xl font-semibold text-white"
            >
              {isEditing ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Ürün veya hizmet bilgilerini kaydedin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Pencereyi kapat"
            className="rounded-lg px-3 py-1.5 text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="product-code"
                className="mb-2 block text-sm font-medium text-slate-300"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                htmlFor="product-name"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Ürün veya hizmet adı
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="unit-price"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Birim fiyat
                </label>

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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="vat-rate"
                  className="mb-2 block text-sm font-medium text-slate-300"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 bg-slate-950/40 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
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