"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/types/auth";
import type { User, UserUpdate } from "@/types/user";

type AccountSettingsPanelProps = {
  currentUser: CurrentUser;
  onClose: () => void;
  onUpdated: (user: User) => void;
  onLogout: () => void;
};

export default function AccountSettingsPanel({
  currentUser,
  onClose,
  onUpdated,
  onLogout,
}: AccountSettingsPanelProps) {
  const [userName, setUserName] = useState(
    currentUser.UserName,
  );
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const normalizedUserName = userName.trim();

    if (!normalizedUserName) {
      setError("Kullanıcı adı zorunludur.");
      return;
    }

    if (password && password.length < 8) {
      setError("Yeni parola en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Yeni parola ve parola doğrulaması eşleşmiyor.");
      return;
    }

    const request: UserUpdate = {
      UserName: normalizedUserName,
    };

    if (password) {
      request.Password = password;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await apiRequest<User>(
        `/users/${currentUser.UserId}`,
        {
          method: "PUT",
          body: JSON.stringify(request),
        },
      );

      onUpdated(updatedUser);
      setPassword("");
      setPasswordConfirmation("");
      setNotice("Hesap bilgileriniz başarıyla güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hesap bilgileri güncellenirken beklenmeyen bir hata oluştu.";

      setError(
        message === "Username already exists"
          ? "Bu kullanıcı adı zaten kullanılıyor."
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Hesap ayarlarını kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-app-border bg-surface shadow-[-20px_0_60px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-start justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Kullanıcı hesabı
            </p>

            <h2
              id="account-settings-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              Hesap Ayarları
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Kullanıcı adınızı ve parolanızı yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Paneli kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xl text-text-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center gap-4 rounded-lg border border-app-border bg-surface-muted p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-dark">
                {currentUser.UserName.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {currentUser.UserName}
                </p>

                <p className="mt-1 text-sm text-text-muted">
                  {currentUser.IsSuperAdmin
                    ? "Süper Yönetici"
                    : `Firma #${currentUser.CompanyId}`}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="account-user-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Kullanıcı adı
                <span className="ml-1 text-danger">*</span>
              </label>

              <input
                id="account-user-name"
                type="text"
                required
                maxLength={50}
                value={userName}
                onChange={(event) =>
                  setUserName(event.target.value)
                }
                autoComplete="username"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            <div>
              <label
                htmlFor="account-password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Yeni parola
              </label>

              <input
                id="account-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                placeholder="Değiştirmeyecekseniz boş bırakın"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />

              <p className="mt-1.5 text-xs text-text-muted">
                Yeni parola en az 8 karakter olmalıdır.
              </p>
            </div>

            <div>
              <label
                htmlFor="account-password-confirmation"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Yeni parola doğrulama
              </label>

              <input
                id="account-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                autoComplete="new-password"
                placeholder="Yeni parolayı tekrar girin"
                className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>

            {notice && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-success">
                {notice}
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

          <div className="space-y-3 border-t border-app-border bg-surface-muted p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>

            <button
              type="button"
              onClick={onLogout}
              disabled={isSubmitting}
              className="w-full rounded-md border border-red-200 bg-surface px-5 py-3 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Oturumu Kapat
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}