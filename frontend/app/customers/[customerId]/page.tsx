"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CustomerFormModal from "@/components/customer-form-modal";
import { apiRequest } from "@/lib/api";
import type { Customer } from "@/types/customer";

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

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCustomer() {
      try {
        const data = await apiRequest<Customer>(
          `/customers/${customerId}`,
        );

        if (isActive) {
          setCustomer(data);
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Müşteri bilgileri alınamadı.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      isActive = false;
    };
  }, [customerId]);

  async function handleCustomerSaved() {
    try {
      const updatedCustomer = await apiRequest<Customer>(
        `/customers/${customerId}`,
      );

      setCustomer(updatedCustomer);
      setNotice("Müşteri bilgileri başarıyla güncellendi.");
      setIsFormOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Güncel müşteri bilgileri alınamadı.",
      );
    }
  }

  return (
    <main className="min-h-full bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
          href="/customers"
        >
          <span aria-hidden="true">←</span>
          Müşterilere dön
        </Link>

        {isLoading ? (
          <section className="mt-6 rounded-lg border border-app-border bg-surface p-8 text-text-muted shadow-sm">
            Müşteri bilgileri yükleniyor...
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

        {!isLoading && !error && customer ? (
          <>
            <header className="mt-5 flex flex-col gap-5 border-b border-app-border pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Müşteri detayı
                  </p>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-success">
                    Aktif kayıt
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {customer.Title}
                </h1>

                <p className="mt-2 text-base text-text-muted">
                  Müşteri firma, iletişim ve kayıt bilgilerini inceleyin.
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
                Müşteriyi Düzenle
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
                  Müşteri ID
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {customer.CustomerId}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Sistem kayıt numarası
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  Vergi numarası
                </p>
                <p className="mt-3 text-xl font-bold text-foreground">
                  {customer.TaxNumber ?? "Belirtilmemiş"}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Firma vergi bilgisi
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  E-posta
                </p>

                {customer.EMail ? (
                  <a
                    className="mt-3 block break-all text-lg font-bold text-primary transition hover:text-primary-dark"
                    href={`mailto:${customer.EMail}`}
                  >
                    {customer.EMail}
                  </a>
                ) : (
                  <p className="mt-3 text-xl font-bold text-foreground">
                    Belirtilmemiş
                  </p>
                )}

                <p className="mt-1 text-sm text-text-muted">
                  İletişim adresi
                </p>
              </article>

              <article className="rounded-lg border border-app-border bg-primary p-5 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">
                  Kayıt tarihi
                </p>
                <p className="mt-3 text-xl font-bold">
                  {formatDate(customer.RecordDate)}
                </p>
                <p className="mt-1 text-sm text-blue-100">
                  Sisteme eklenme tarihi
                </p>
              </article>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <article className="rounded-lg border border-app-border bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Firma bilgileri
                </p>

                <h2 className="mt-2 text-xl font-bold text-foreground">
                  İletişim ve Adres
                </h2>

                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      Müşteri unvanı
                    </dt>
                    <dd className="mt-2 font-bold text-foreground">
                      {customer.Title}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-text-muted">
                      E-posta adresi
                    </dt>
                    <dd className="mt-2 break-all font-medium text-foreground">
                      {customer.EMail ?? "Belirtilmemiş"}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-sm font-semibold text-text-muted">
                      Açık adres
                    </dt>
                    <dd className="mt-2 min-h-20 rounded-lg bg-surface-muted p-4 font-medium leading-7 text-foreground">
                      {customer.Address ?? "Adres belirtilmemiş"}
                    </dd>
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
                      {customer.CompanyId ?? "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-app-border pb-4">
                    <dt className="text-sm font-semibold text-text-muted">
                      Oluşturan kullanıcı
                    </dt>
                    <dd className="font-bold text-foreground">
                      {customer.UserId
                        ? `Kullanıcı #${customer.UserId}`
                        : "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm font-semibold text-text-muted">
                      Kayıt tarihi
                    </dt>
                    <dd className="font-bold text-foreground">
                      {formatDate(customer.RecordDate)}
                    </dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="mt-6 rounded-lg border border-app-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Bu müşteri için fatura oluştur
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Yeni fatura ekranına geçerek müşteri için bir fatura
                    kaydı oluşturabilirsiniz.
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
                href="/customers"
              >
                Müşteri Listesine Dön
              </Link>
            </div>

            {isFormOpen ? (
              <CustomerFormModal
                customer={customer}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleCustomerSaved}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}