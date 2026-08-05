"use client";

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
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Ürünler</h2>

            <p className="mt-2 text-sm text-slate-400">
              Faturalarda kullanılan ürün ve hizmet kayıtlarını
              yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            + Yeni Ürün Ekle
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <label htmlFor="product-search" className="sr-only">
            Ürün ara
          </label>

          <input
            id="product-search"
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Ürün kodu veya ürün adına göre ara..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

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
            Ürünler yükleniyor...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">
                {filteredProducts.length} ürün gösteriliyor
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-slate-900/40 p-10 text-center text-slate-400">
                {searchQuery
                  ? "Arama kriterine uygun ürün bulunamadı."
                  : "Henüz ürün kaydı bulunmuyor."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Ürün kodu</th>
                      <th className="px-6 py-4">Ürün / Hizmet</th>
                      <th className="px-6 py-4">Birim fiyat</th>
                      <th className="px-6 py-4">KDV</th>
                      <th className="px-6 py-4 text-right">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.ProductId}
                        className="bg-slate-950 transition hover:bg-slate-900/70"
                      >
                        <td className="px-6 py-4 font-medium text-cyan-300">
                          {product.ProductCode ?? "—"}
                        </td>

                        <td className="px-6 py-4 font-medium">
                          {product.ProductName}
                        </td>

                        <td className="px-6 py-4">
                          {formatCurrency(product.UnitPrice)}
                        </td>

                        <td className="px-6 py-4">
                          {product.VatRate === null
                            ? "Belirtilmemiş"
                            : `%${product.VatRate}`}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(product)
                              }
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                            >
                              Düzenle
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingProductId ===
                                product.ProductId
                              }
                              onClick={() =>
                                handleDelete(product)
                              }
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
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