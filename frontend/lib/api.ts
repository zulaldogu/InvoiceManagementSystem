import type { TokenResponse } from "@/types/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const ACCESS_TOKEN_KEY = "invoice_access_token";

type ValidationErrorItem = {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

function formatErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: unknown) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "msg" in item
        ) {
          const validationItem = item as ValidationErrorItem;
          const field = validationItem.loc
            ?.filter((part) => part !== "body")
            .join(".");

          if (field && validationItem.msg) {
            return `${field}: ${validationItem.msg}`;
          }

          return validationItem.msg ?? null;
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (typeof detail === "object" && detail !== null) {
    try {
      return JSON.stringify(detail);
    } catch {
      return null;
    }
  }

  return null;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: unknown;
    };

    const detailMessage = formatErrorDetail(body.detail);

    if (detailMessage) {
      return detailMessage;
    }
  } catch {
    // Yanıt JSON değilse genel hata mesajı kullanılacak.
  }

  return `API isteği ${response.status} durum koduyla başarısız oldu.`;
}

async function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      "Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
    );
  }
}


export async function login(
  username: string,
  password: string,
): Promise<TokenResponse> {
  const formData = new URLSearchParams();

  formData.set("username", username);
  formData.set("password", password);

  const response = await fetchApi(`${API_BASE_URL}/auth/login`, {
      method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const token = (await response.json()) as TokenResponse;
  setAccessToken(token.access_token);

  return token;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const accessToken = getAccessToken();

  headers.set("Accept", "application/json");

  if (
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetchApi(`${API_BASE_URL}${endpoint}`, {
        ...options,
    headers,
  });

  if (response.status === 401) {
    clearAccessToken();

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}