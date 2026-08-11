"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProductFormModal from "@/components/product-form-modal";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/types/product";

function formatCurrency(value: string) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatVatRate(value: string | null) {
  if (value === null) {
    return "Belirtilmemiş";
  }

  return `%${Number(value).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Belirtilmemiş";
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-");

  if (year && month && day) {
    return `${day}.${month}.${year}`;
  }

  return value;
}

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      try {
        const data = await apiRequest<Product>(
          `/products/${productId}`,
        );

        if (isActive) {
          setProduct(data);
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Ürün veya hizmet bilgileri alınamadı.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isActive = false;
    };
  }, [productId]);

  async function handleProductSaved() {
    try {
      const updatedProduct = await apiRequest<Product>(
        `/products/${productId}`,
      );

      setProduct(updatedProduct);
      setNotice("Ürün veya hizmet bilgileri başarıyla güncellendi.");
      setIsFormOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Güncel ürün bilgileri alınamadı.",
      );
    }
  }

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1440px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
          href="/products"
        >
          <span aria-hidden="true">←</span>
          Ürün ve hizmetlere dön
        </Link>

        {isLoading ? (
          <section className="mt-6 rounded-lg border border-app-border bg-surface p-8 text-text-muted shadow-sm">
            Ürün veya hizmet bilgileri yükleniyor...
          </section>
        ) : null}

        {error ? (
          <section
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
            role="alert"
          >
            {error}
          </section>
        ) : null}

        {!isLoading && !error && product ? (
          <>
            <header className="mt-5 flex flex-col gap-5 border-b border-app-border pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Ürün ve hizmet detayı
                  </p>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-success">
                    Aktif kayıt
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {product.ProductName}
                </h1>

                <p className="mt-2 text-base text-text-muted">
                  Ürün veya hizmetin fiyat, KDV ve kayıt bilgilerini
                  inceleyin.
                </p>
              </div>

              <button
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-bold text-white shadow-sm transition hover:bg-primary-dark"
                onClick={() => {
                  setNotice(null);
                  setIsFormOpen(true);
                }}
                type="button"
              >
                Ürün/Hizmeti Düzenle
              </button>
            </header>

            {notice ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-success">
                {notice}
              </div>
            ) : null}

            <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Ürün ID
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {product.ProductId}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Sistem kayıt numarası
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Ürün kodu
                </p>
                <p className="mt-3 text-xl font-bold text-primary">
                  {product.ProductCode ?? "Belirtilmemiş"}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Ürün veya hizmet kodu
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  KDV oranı
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {formatVatRate(product.VatRate)}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Faturalarda kullanılacak oran
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-primary p-5 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">
                  Birim fiyat
                </p>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(product.UnitPrice)}
                </p>
                <p className="mt-1 text-sm text-blue-100">
                  Vergi hariç satış fiyatı
                </p>
              </article>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <article className="rounded-lg border border-app-border bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Ürün bilgileri
                </p>

                <h2 className="mt-2 text-xl font-bold text-foreground">
                  Fiyat ve Vergi Bilgileri
                </h2>

                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Ürün veya hizmet adı
                    </dt>
                    <dd className="mt-2 font-bold text-foreground">
                      {product.ProductName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Ürün kodu
                    </dt>
                    <dd className="mt-2 font-bold text-foreground">
                      {product.ProductCode ?? "Belirtilmemiş"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Vergi hariç birim fiyat
                    </dt>
                    <dd className="mt-2 text-xl font-bold text-foreground">
                      {formatCurrency(product.UnitPrice)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      KDV oranı
                    </dt>
                    <dd className="mt-2">
                      <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-dark">
                        {formatVatRate(product.VatRate)}
                      </span>
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                      Birim fiyat vergi hariç tutarı gösterir. KDV oranı
                      fatura kalemi oluşturulurken bilgi amacıyla
                      kullanılmaktadır.
                    </p>
                  </div>
                </dl>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Kayıt bilgileri
                </p>

                <h2 className="mt-2 text-xl font-bold text-foreground">
                  Sistem Kaydı
                </h2>

                <dl className="mt-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 border-b border-app-border pb-4">
                    <dt className="text-sm font-semibold text-text-muted">
                      Firma ID
                    </dt>
                    <dd className="font-bold text-foreground">
                      {product.CompanyId ?? "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-app-border pb-4">
                    <dt className="text-sm font-semibold text-text-muted">
                      Oluşturan kullanıcı
                    </dt>
                    <dd className="font-bold text-foreground">
                      {product.UserId
                        ? `Kullanıcı #${product.UserId}`
                        : "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm font-semibold text-text-muted">
                      Kayıt tarihi
                    </dt>
                    <dd className="font-bold text-foreground">
                      {formatDate(product.RecordDate)}
                    </dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="mt-6 rounded-lg border border-app-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Bu ürünü faturada kullan
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Yeni fatura ekranına geçerek bu ürün veya hizmeti
                    faturaya ekleyebilirsiniz.
                  </p>
                </div>

                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-primary px-5 font-bold text-primary transition hover:bg-primary-soft"
                  href="/invoices/new"
                >
                  Yeni Fatura Oluştur
                </Link>
              </div>
            </section>

            <div className="mt-6 flex justify-end border-t border-app-border pt-6">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg border border-app-border bg-surface px-6 font-semibold text-text-muted transition hover:border-primary hover:text-primary"
                href="/products"
              >
                Ürün Listesine Dön
              </Link>
            </div>

            {isFormOpen ? (
              <ProductFormModal
                product={product}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleProductSaved}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}