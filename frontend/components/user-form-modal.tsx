"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/types/auth";
import type { Company } from "@/types/company";
import type {
  User,
  UserCreate,
  UserUpdate,
} from "@/types/user";

type UserFormModalProps = {
  user: User | null;
  companies: Company[];
  currentUser: CurrentUser;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function UserFormModal({
  user,
  companies,
  currentUser,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const isEditing = user !== null;
  const canManageStatus = currentUser.IsSuperAdmin;

  const [userName, setUserName] = useState(
    user?.UserName ?? "",
  );
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState(
    user?.CompanyId?.toString() ?? "",
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(
    user?.IsSuperAdmin ?? false,
  );
  const [isActive, setIsActive] = useState(
    user?.IsActive ?? true,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompany = companies.find(
    (company) => company.CompanyId === user?.CompanyId,
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    const normalizedUserName = userName.trim();

    if (!normalizedUserName) {
      setError("Kullanıcı adı zorunludur.");
      return;
    }

    if (!isEditing && password.length < 8) {
      setError("Parola en az 8 karakter olmalıdır.");
      return;
    }

    if (
      isEditing &&
      password.length > 0 &&
      password.length < 8
    ) {
      setError(
        "Yeni parola boş bırakılmalı veya en az 8 karakter olmalıdır.",
      );
      return;
    }

    if (
      !isEditing &&
      !isSuperAdmin &&
      companyId === ""
    ) {
      setError(
        "Firma kullanıcısı için bir firma seçilmelidir.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const request: UserUpdate = {
          UserName: normalizedUserName,
        };

        if (password) {
          request.Password = password;
        }

        if (canManageStatus) {
          request.IsActive = isActive;
        }

        await apiRequest<User>(
          `/users/${user.UserId}`,
          {
            method: "PUT",
            body: JSON.stringify(request),
          },
        );
      } else {
        const request: UserCreate = {
          UserName: normalizedUserName,
          Password: password,
          CompanyId:
            companyId === "" ? null : Number(companyId),
          IsSuperAdmin: isSuperAdmin,
          IsActive: isActive,
        };

        await apiRequest<User>("/users/", {
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
          : "Kullanıcı kaydedilirken beklenmeyen bir hata oluştu.";

      if (message === "Username already exists") {
        setError("Bu kullanıcı adı zaten kullanılıyor.");
      } else if (
        message ===
        "CompanyId is required for company users"
      ) {
        setError(
          "Firma kullanıcısı için bir firma seçilmelidir.",
        );
      } else if (message === "Active company not found") {
        setError(
          "Seçilen firma bulunamadı veya aktif değil.",
        );
      } else if (
        message ===
        "Only a super administrator can change account status"
      ) {
        setError(
          "Hesap durumunu yalnızca süper yönetici değiştirebilir.",
        );
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
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-xl border border-app-border bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Kullanıcı yönetimi
            </p>

            <h2
              id="user-modal-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {isEditing
                ? user.UserId === currentUser.UserId
                  ? "Hesabımı Düzenle"
                  : "Kullanıcıyı Düzenle"
                : "Yeni Kullanıcı Ekle"}
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              {isEditing
                ? "Kullanıcı adı, parola ve hesap bilgilerini güncelleyin."
                : "Sisteme erişecek yeni kullanıcıyı oluşturun."}
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
                htmlFor="user-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Kullanıcı adı
                <span className="ml-1 text-danger">*</span>
              </label>

              <input
                id="user-name"
                type="text"
                required
                maxLength={50}
                value={userName}
                onChange={(event) =>
                  setUserName(event.target.value)
                }
                autoComplete="username"
                placeholder="Kullanıcı adını girin"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div>
              <label
                htmlFor="user-password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                {isEditing ? "Yeni parola" : "Parola"}
                {!isEditing && (
                  <span className="ml-1 text-danger">*</span>
                )}
              </label>

              <input
                id="user-password"
                type="password"
                required={!isEditing}
                minLength={password ? 8 : undefined}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                placeholder={
                  isEditing
                    ? "Değiştirmeyecekseniz boş bırakın"
                    : "En az 8 karakter"
                }
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />

              <p className="mt-1.5 text-xs text-text-muted">
                {isEditing
                  ? "Parolayı korumak için bu alanı boş bırakabilirsiniz."
                  : "Parola en az 8 karakter olmalıdır."}
              </p>
            </div>

            {!isEditing && (
              <>
                <div>
                  <label
                    htmlFor="user-company"
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Firma
                    {!isSuperAdmin && (
                      <span className="ml-1 text-danger">*</span>
                    )}
                  </label>

                  <select
                    id="user-company"
                    value={companyId}
                    required={!isSuperAdmin}
                    onChange={(event) =>
                      setCompanyId(event.target.value)
                    }
                    className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  >
                    <option value="">
                      {isSuperAdmin
                        ? "Sistem geneli — firma seçilmedi"
                        : "Firma seçin"}
                    </option>

                    {companies
                      .filter((company) => company.IsActive)
                      .map((company) => (
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

                <div className="rounded-lg border border-app-border bg-surface-muted p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSuperAdmin}
                      onChange={(event) =>
                        setIsSuperAdmin(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-app-border text-primary focus:ring-primary"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        Süper yönetici
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-text-muted">
                        Süper yöneticiler tüm firmalara ve sistem
                        yönetimi işlemlerine erişebilir.
                      </span>
                    </span>
                  </label>
                </div>
              </>
            )}

            {isEditing && (
              <div className="rounded-lg border border-app-border bg-primary-soft/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.09em] text-primary">
                  Hesap kapsamı
                </p>

                <p className="mt-2 text-sm font-semibold text-foreground">
                  {user.IsSuperAdmin
                    ? "Süper Yönetici"
                    : selectedCompany?.CompanyName ??
                      `Firma #${user.CompanyId}`}
                </p>

                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Firma ve yönetici kapsamı mevcut kullanıcı
                  güncelleme endpointi tarafından değiştirilemez.
                </p>
              </div>
            )}

            {canManageStatus && (
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
                      Kullanıcı hesabı aktif
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-text-muted">
                      Pasif kullanıcılar sisteme giriş yapamaz.
                    </span>
                  </span>
                </label>
              </div>
            )}

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
                  : "Kullanıcıyı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}