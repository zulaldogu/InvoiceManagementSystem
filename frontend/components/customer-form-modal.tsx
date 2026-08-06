"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "@/types/customer";

type CustomerFormModalProps = {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEditing = customer !== null;

  const [title, setTitle] = useState(customer?.Title ?? "");
  const [taxNumber, setTaxNumber] = useState(
    customer?.TaxNumber ?? "",
  );
  const [email, setEmail] = useState(customer?.EMail ?? "");
  const [address, setAddress] = useState(
    customer?.Address ?? "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Müşteri unvanı zorunludur.");
      return;
    }

    const request: CustomerCreate | CustomerUpdate = {
      Title: title.trim(),
      TaxNumber: taxNumber.trim() || null,
      EMail: email.trim() || null,
      Address: address.trim() || null,
    };

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await apiRequest<Customer>(
          `/customers/${customer.CustomerId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
          },
        );
      } else {
        await apiRequest<Customer>("/customers/", {
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
          : "Müşteri kaydedilirken beklenmeyen bir hata oluştu.";

      setError(
        message === "Tax number already exists in this company"
          ? "Bu vergi numarası firmanızda zaten kullanılıyor."
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
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-xl border border-app-border bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Müşteri yönetimi
            </p>

            <h2
              id="customer-modal-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {isEditing
                ? "Müşteriyi Düzenle"
                : "Yeni Müşteri Ekle"}
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Müşteri firma ve iletişim bilgilerini kaydedin.
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
                htmlFor="customer-title"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Müşteri unvanı
                <span className="ml-1 text-danger">*</span>
              </label>

              <input
                id="customer-title"
                type="text"
                required
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Firma veya müşteri unvanını girin"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tax-number"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Vergi numarası
                </label>

                <input
                  id="tax-number"
                  type="text"
                  value={taxNumber}
                  onChange={(event) =>
                    setTaxNumber(event.target.value)
                  }
                  placeholder="10 veya 11 haneli numara"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />

                <p className="mt-1.5 text-xs text-text-muted">
                  Aynı firma içinde benzersiz olmalıdır.
                </p>
              </div>

              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  E-posta
                </label>

                <input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="ornek@firma.com"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-address"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Adres
              </label>

              <textarea
                id="customer-address"
                rows={4}
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Müşterinin açık adresini girin"
                className="w-full resize-none rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
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
                  : "Müşteriyi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}