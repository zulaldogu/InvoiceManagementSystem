"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
} from "@/types/company";

type CompanyFormModalProps = {
  company: Company | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function CompanyFormModal({
  company,
  onClose,
  onSaved,
}: CompanyFormModalProps) {
  const isEditing = company !== null;

  const [companyCode, setCompanyCode] = useState(
    company?.CompanyCode ?? "",
  );
  const [companyName, setCompanyName] = useState(
    company?.CompanyName ?? "",
  );
  const [taxNumber, setTaxNumber] = useState(
    company?.TaxNumber ?? "",
  );
  const [email, setEmail] = useState(company?.EMail ?? "");
  const [address, setAddress] = useState(
    company?.Address ?? "",
  );
  const [isActive, setIsActive] = useState(
    company?.IsActive ?? true,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    const normalizedCode = companyCode.trim().toUpperCase();
    const normalizedName = companyName.trim();

    if (!normalizedCode) {
      setError("Firma kodu zorunludur.");
      return;
    }

    if (!normalizedName) {
      setError("Firma unvanı zorunludur.");
      return;
    }

    const request: CompanyCreate | CompanyUpdate = {
      CompanyCode: normalizedCode,
      CompanyName: normalizedName,
      TaxNumber: taxNumber.trim() || null,
      EMail: email.trim() || null,
      Address: address.trim() || null,
      IsActive: isActive,
    };

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await apiRequest<Company>(
          `/companies/${company.CompanyId}`,
          {
            method: "PUT",
            body: JSON.stringify(request),
          },
        );
      } else {
        await apiRequest<Company>("/companies/", {
          method: "POST",
          body: JSON.stringify(request),
        });
      }

      await onSaved();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Firma kaydedilirken beklenmeyen bir hata oluştu.";

      if (message === "Company code already exists") {
        setError("Bu firma kodu zaten kullanılıyor.");
      } else if (message === "Tax number already exists") {
        setError("Bu vergi numarası zaten kullanılıyor.");
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-3xl overflow-hidden rounded-xl border border-app-border bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Firma yönetimi
            </p>

            <h2
              id="company-modal-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {isEditing
                ? "Firmayı Düzenle"
                : "Yeni Firma Ekle"}
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Firmanın kurumsal, vergi ve iletişim bilgilerini
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="company-code"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Firma kodu
                  <span className="ml-1 text-danger">*</span>
                </label>

                <input
                  id="company-code"
                  type="text"
                  required
                  maxLength={50}
                  value={companyCode}
                  onChange={(event) =>
                    setCompanyCode(event.target.value)
                  }
                  placeholder="Örn. DEMO"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 uppercase text-foreground outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />

                <p className="mt-1.5 text-xs text-text-muted">
                  Sistem genelinde benzersiz olmalıdır.
                </p>
              </div>

              <div>
                <label
                  htmlFor="company-name"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Firma unvanı
                  <span className="ml-1 text-danger">*</span>
                </label>

                <input
                  id="company-name"
                  type="text"
                  required
                  maxLength={150}
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                  placeholder="Firma unvanını girin"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="company-tax-number"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Vergi numarası
                </label>

                <input
                  id="company-tax-number"
                  type="text"
                  maxLength={20}
                  value={taxNumber}
                  onChange={(event) =>
                    setTaxNumber(event.target.value)
                  }
                  placeholder="Vergi numarasını girin"
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>

              <div>
                <label
                  htmlFor="company-email"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  E-posta
                </label>

                <input
                  id="company-email"
                  type="email"
                  maxLength={100}
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
                htmlFor="company-address"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Adres
              </label>

              <textarea
                id="company-address"
                rows={4}
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Firmanın açık adresini girin"
                className="w-full resize-none rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div className="rounded-lg border border-app-border bg-surface-muted p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-app-border text-primary focus:ring-primary"
                />

                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    Firma aktif
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-text-muted">
                    Pasif firmalara bağlı kullanıcılar sisteme giriş
                    yapamaz.
                  </span>
                </span>
              </label>
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
                  : "Firmayı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}