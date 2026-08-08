"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  apiRequest,
  getAccessToken,
  login,
} from "@/lib/api";
import type { CurrentUser } from "@/types/auth";

const features = [
  "Firma bazlı güvenli veri erişimi",
  "JWT ile korunan kullanıcı oturumları",
  "Merkezi müşteri, ürün ve fatura yönetimi",
];

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      return;
    }

    apiRequest<CurrentUser>("/auth/me")
      .then(() => {
        router.replace("/");
      })
      .catch(() => {
        // Geçersiz token API helper tarafından temizlenir.
      });
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      await apiRequest<CurrentUser>("/auth/me");

      router.replace("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Giriş sırasında beklenmeyen bir hata oluştu.";

      setError(
        message === "Incorrect username or password"
          ? "Kullanıcı adı veya parola hatalı."
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(380px,5fr)_minmax(520px,7fr)]">
      <section className="relative hidden overflow-hidden border-r border-app-border bg-primary-soft p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[70px] border-white/30"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full border-[80px] border-primary/5"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-lg font-bold text-white shadow-sm">
              FY
            </span>

            <div>
              <p className="text-lg font-semibold text-primary-dark">
                Fatura Yönetimi
              </p>

              <p className="text-sm text-text-muted">
                Kurumsal yönetim platformu
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Güvenli ve merkezi yönetim
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">
            Fatura süreçlerinizi tek bir panel üzerinden yönetin.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-text-muted">
            Müşteri, ürün ve fatura işlemlerine güvenli kullanıcı
            doğrulaması ve firma bazlı veri izolasyonuyla erişin.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm font-medium text-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  ✓
                </span>

                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-text-muted">
          © 2026 Fatura Yönetim Sistemi
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary font-bold text-white">
              FY
            </span>

            <div>
              <p className="font-semibold text-primary-dark">
                Fatura Yönetimi
              </p>

              <p className="text-xs text-text-muted">
                Kurumsal Panel
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border bg-surface p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Yönetim paneli
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Hesabınıza giriş yapın
            </h2>

            <p className="mt-3 text-sm leading-6 text-text-muted">
              Firma hesabınıza erişmek için kullanıcı bilgilerinizi
              girin.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Kullanıcı adı
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  placeholder="Kullanıcı adınızı girin"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Parola
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-md border border-app-border bg-surface px-4 py-3 text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  placeholder="Parolanızı girin"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Giriş yapılıyor..."
                  : "Giriş yap"}
              </button>
            </form>

            <div className="mt-7 rounded-md border border-app-border bg-surface-muted p-4 text-sm text-text-muted">
              <p className="font-semibold text-foreground">
                Demo hesabı
              </p>

              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>
                  Kullanıcı adı:{" "}
                  <strong className="text-foreground">
                    admin
                  </strong>
                </p>

                <p>
                  Parola:{" "}
                  <strong className="text-foreground">
                    DemoAdmin123!
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-text-muted">
            Giriş yaparak yalnızca bağlı olduğunuz firma kapsamındaki
            verilere erişirsiniz.
          </p>
        </div>
      </section>
    </main>
  );
}