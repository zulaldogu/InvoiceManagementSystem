"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProductFormModal from "@/components/product-form-modal";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/types/product";

function formatCurrency(value: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value));
}

function formatVatRate(value: string | null) {
  if (value === null) {
    return "Belirtilmemiş";
  }

  return `%${Number(value).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  })}`;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] =
    useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshProducts() {
    setError(null);

    try {
      const data = await apiRequest<Product[]>("/products/");
      setProducts(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ürünler alınırken beklenmeyen bir hata oluştu.",
      );
    }
  }

  useEffect(() => {
    let isActive = true;

    apiRequest<Product[]>("/products/")
      .then((data) => {
        if (isActive) {
          setProducts(data);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Ürünler alınırken beklenmeyen bir hata oluştu.",
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

  function openCreateForm() {
    setEditingProduct(null);
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  async function handleProductSaved() {
    await refreshProducts();

    setNotice(
      editingProduct
        ? "Ürün bilgileri başarıyla güncellendi."
        : "Yeni ürün başarıyla eklendi.",
    );
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `"${product.ProductName}" kaydını silmek istediğinizden emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.ProductId);
    setError(null);
    setNotice(null);

    try {
      await apiRequest<{ message: string }>(
        `/products/${product.ProductId}`,
        {
          method: "DELETE",
        },
      );

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.ProductId !== product.ProductId,
        ),
      );

      setNotice("Ürün başarıyla silindi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ürün silinirken beklenmeyen bir hata oluştu.";

      setError(
        message ===
          "Product is used by an invoice line and cannot be deleted"
          ? "Bu ürün bir faturada kullanıldığı için silinemez."
          : message,
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase("tr-TR");

  const filteredProducts = products.filter((product) => {
    if (!normalizedQuery) {
      return true;
    }

    const productCode = product.ProductCode ?? "";

    return (
      product.ProductName.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      ) ||
      productCode.toLocaleLowerCase("tr-TR").includes(
        normalizedQuery,
      )
    );
  });

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-5 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Ürün ve Hizmetler
            </h1>

            <p className="mt-2 text-sm text-text-muted lg:text-base">
              Faturalarda kullanılan ürün ve hizmet kayıtlarını
              yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:self-auto"
          >
            <span className="text-xl leading-none">+</span>
            Yeni Ürün/Hizmet
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-app-border bg-surface p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
          <label
            htmlFor="product-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
          >
            Ürün veya hizmet ara
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon />
            </span>

            <input
              id="product-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Ürün kodu veya ürün/hizmet adına göre ara..."
              className="w-full rounded-md border border-app-border bg-surface px-4 py-3 pl-11 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </div>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-success">
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-app-border bg-surface p-8 text-sm text-text-muted">
            Ürün ve hizmetler yükleniyor...
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-app-border bg-surface shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-6 py-4">
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-foreground">
                  {filteredProducts.length}
                </span>{" "}
                ürün veya hizmet gösteriliyor
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-sm font-semibold text-primary transition hover:text-primary-dark"
                >
                  Aramayı temizle
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold text-foreground">
                  {searchQuery
                    ? "Arama kriterine uygun ürün veya hizmet bulunamadı."
                    : "Henüz ürün veya hizmet kaydı bulunmuyor."}
                </p>

                <p className="mt-2 text-sm text-text-muted">
                  {searchQuery
                    ? "Farklı bir ürün kodu veya ad deneyin."
                    : "Yeni bir ürün veya hizmet ekleyerek başlayabilirsiniz."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-surface-muted text-xs uppercase tracking-[0.08em] text-text-muted">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Ürün kodu
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Ürün / Hizmet
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Birim fiyat
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        KDV
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-app-border">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.ProductId}
                        className="transition hover:bg-surface-muted/60"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-primary">
                            {product.ProductCode ?? "—"}
                          </p>

                          <p className="mt-0.5 text-xs text-text-muted">
                            ID: {product.ProductId}
                          </p>
                        </td>

                        <td className="px-6 py-4 font-semibold text-foreground">
                          {product.ProductName}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                          {formatCurrency(product.UnitPrice)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
                            {formatVatRate(product.VatRate)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
  <Link
    href={`/products/${product.ProductId}`}
    className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
  >
    Detay
  </Link>

  <button
    type="button"
    onClick={() => openEditForm(product)}
    className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft"
  >
    Düzenle
  </button>

  <button
    type="button"
    disabled={deletingProductId === product.ProductId}
    onClick={() => handleDelete(product)}
    className="inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-app-border px-3 text-sm font-semibold text-danger transition hover:border-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {deletingProductId === product.ProductId
      ? "Siliniyor..."
      : "Sil"}
  </button>
</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {isFormOpen && (
        <ProductFormModal
          key={editingProduct?.ProductId ?? "new-product"}
          product={editingProduct}
          onClose={closeForm}
          onSaved={handleProductSaved}
        />
      )}
    </main>
  );
}