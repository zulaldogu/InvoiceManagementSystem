"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  apiRequest,
  getAccessToken,
  login,
} from "@/lib/api";
import type { CurrentUser } from "@/types/auth";

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
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-lg font-bold text-slate-950">
              FY
            </span>

            <div>
              <p className="font-semibold">Fatura Yönetim Sistemi</p>
              <p className="text-sm text-slate-400">
                Kurumsal yönetim platformu
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Güvenli ve merkezi yönetim
          </p>

          <h1 className="text-4xl font-semibold leading-tight">
            Fatura süreçlerinizi tek bir panel üzerinden yönetin.
          </h1>

          <p className="mt-6 max-w-lg leading-7 text-slate-300">
            Müşteri, ürün, fatura ve yetkilendirme işlemlerine
            firma bazlı veri izolasyonu ve güvenli kullanıcı
            doğrulamasıyla erişin.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-slate-300">
            {[
                "Firma bazlı güvenli veri erişimi",
                "Yetkilere göre kontrollü işlemler",
                "Merkezi müşteri, ürün ve fatura yönetimi",
            ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>{feature}</span>
                </li>
                ))}
            </ul>
        </div>

        <p className="text-sm text-slate-500">
          © 2026 Fatura Yönetim Sistemi
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 font-bold text-white">
              FY
            </span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Yönetim paneli
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Hesabınıza giriş yapın
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Firma hesabınıza erişmek için kullanıcı bilgilerinizi
            girin.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
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
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                placeholder="Kullanıcı adınızı girin"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
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
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                placeholder="Parolanızı girin"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Demo hesabı</p>
            <p className="mt-2">
              Kullanıcı adı: <strong>admin</strong>
            </p>
            <p>
              Parola: <strong>DemoAdmin123!</strong>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}