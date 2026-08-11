"use client";

import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  Profile,
  ProfileCreate,
  ProfileUpdate,
  Role,
  RoleCreate,
  RoleUpdate,
} from "@/types/authorization";
import type { Company } from "@/types/company";

type RecordKind = "role" | "profile";
type AuthorizationRecord = Role | Profile;

type AuthorizationRecordModalProps = {
  kind: RecordKind;
  record: AuthorizationRecord | null;
  companies: Company[];
  onClose: () => void;
  onSaved: (
    savedRecord: AuthorizationRecord,
  ) => Promise<void> | void;};

function getRecordName(
  record: AuthorizationRecord | null,
): string {
  if (!record) {
    return "";
  }

  return "RoleName" in record
    ? record.RoleName
    : record.ProfileName;
}

export default function AuthorizationRecordModal({
  kind,
  record,
  companies,
  onClose,
  onSaved,
}: AuthorizationRecordModalProps) {
  const activeCompanies = companies.filter(
    (company) => company.IsActive,
  );

  const [name, setName] = useState(
    getRecordName(record),
  );
  const [description, setDescription] = useState(
    record?.Description ?? "",
  );
  const [companyId, setCompanyId] = useState(
    record?.CompanyId ??
      activeCompanies[0]?.CompanyId ??
      0,
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  const isEditing = record !== null;
  const isRole = kind === "role";

  const title = isEditing
    ? isRole
      ? "Rolü Düzenle"
      : "Profili Düzenle"
    : isRole
      ? "Yeni Rol Ekle"
      : "Yeni Profil Ekle";

  const descriptionText = isRole
    ? "Uygulama işlemlerinde kullanılacak yetki kaydını yönetin."
    : "Bir kullanıcıya atanabilecek yetki grubunu yönetin.";

  const nameLabel = isRole ? "Rol adı" : "Profil adı";
  const namePlaceholder = isRole
    ? "Örn. VIEW_REPORTS"
    : "Örn. COMPANY_ACCOUNTANT";

    async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName = name.trim();

    if (!normalizedName) {
      setError(`${nameLabel} boş bırakılamaz.`);
      return;
    }

    if (!isEditing && companyId <= 0) {
      setError("Bir firma seçmelisiniz.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let savedRecord: AuthorizationRecord;

      if (isRole) {
        if (record && "RoleId" in record) {
          const payload: RoleUpdate = {
            RoleName: normalizedName,
            Description:
              description.trim() || null,
          };

          savedRecord = await apiRequest<Role>(
            `/roles/${record.RoleId}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            },
          );
        } else {
          const payload: RoleCreate = {
            RoleName: normalizedName,
            Description:
              description.trim() || null,
            CompanyId: companyId,
          };

          savedRecord = await apiRequest<Role>(
            "/roles/",
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
          );
        }
      } else if (
        record &&
        "ProfileId" in record
      ) {
        const payload: ProfileUpdate = {
          ProfileName: normalizedName,
          Description:
            description.trim() || null,
        };

        savedRecord = await apiRequest<Profile>(
          `/profiles/${record.ProfileId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      } else {
        const payload: ProfileCreate = {
          ProfileName: normalizedName,
          Description:
            description.trim() || null,
          CompanyId: companyId,
        };

        savedRecord = await apiRequest<Profile>(
          "/profiles/",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      }

      await onSaved(savedRecord);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kayıt sırasında beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Pencereyi kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="authorization-modal-title"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-app-border bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Yetkilendirme yönetimi
            </p>

            <h2
              id="authorization-modal-title"
              className="mt-2 text-2xl font-semibold text-foreground"
            >
              {title}
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              {descriptionText}
            </p>
          </div>

          <button
            type="button"
            aria-label="Pencereyi kapat"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-lg text-text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {!isEditing && (
              <div>
                <label
                  htmlFor="authorization-company"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Firma <span className="text-danger">*</span>
                </label>

                <select
                  id="authorization-company"
                  value={companyId}
                  onChange={(event) =>
                    setCompanyId(
                      Number(event.target.value),
                    )
                  }
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                >
                  <option value={0}>
                    Firma seçin
                  </option>

                  {activeCompanies.map((company) => (
                    <option
                      key={company.CompanyId}
                      value={company.CompanyId}
                    >
                      {company.CompanyCode} —{" "}
                      {company.CompanyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isEditing && record && (
              <div className="rounded-md border border-blue-200 bg-primary-soft px-4 py-3 text-sm text-primary-dark">
                Firma bağlantısı düzenleme sırasında
                değiştirilemez. Firma ID:{" "}
                <strong>{record.CompanyId}</strong>
              </div>
            )}

            <div>
              <label
                htmlFor="authorization-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                {nameLabel}{" "}
                <span className="text-danger">*</span>
              </label>

              <input
                id="authorization-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder={namePlaceholder}
                maxLength={100}
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div>
              <label
                htmlFor="authorization-description"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Açıklama
              </label>

              <textarea
                id="authorization-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Kaydın kullanım amacını açıklayın"
                maxLength={255}
                rows={4}
                className="w-full resize-none rounded-md border border-app-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
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

          <footer className="flex justify-end gap-3 border-t border-app-border bg-surface-muted px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-app-border bg-surface px-5 py-3 text-sm font-semibold text-text-muted transition hover:bg-background disabled:opacity-50"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : isEditing
                  ? "Değişiklikleri Kaydet"
                  : isRole
                    ? "Rolü Kaydet"
                    : "Profili Kaydet"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}