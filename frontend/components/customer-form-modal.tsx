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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2
              id="customer-modal-title"
              className="text-xl font-semibold text-white"
            >
              {isEditing
                ? "Müşteriyi Düzenle"
                : "Yeni Müşteri Ekle"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Müşteri firma ve iletişim bilgilerini kaydedin.
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
                htmlFor="customer-title"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Müşteri unvanı
              </label>

              <input
                id="customer-title"
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Firma veya müşteri unvanını girin"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tax-number"
                  className="mb-2 block text-sm font-medium text-slate-300"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-address"
                className="mb-2 block text-sm font-medium text-slate-300"
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
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
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
                  : "Müşteriyi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}