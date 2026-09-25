import axios, { AxiosError } from "axios";
import type { Category, ListParams, Product, ProductInput, ProductList, Session } from "./types";

const TOKEN_KEY = "product_admin_token";
const USER_KEY = "product_admin_user";

export const api = axios.create({ baseURL: "https://dummyjson.com", timeout: 15000 });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      clearSession();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("session-expired"));
    }
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Something went wrong. Please try again.");
    return Promise.reject(new Error(message));
  },
);

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const user = window.localStorage.getItem(USER_KEY);
  if (!token || !user) return null;
  try {
    return { accessToken: token, ...JSON.parse(user) } as Session;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: Session) {
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: session.username,
      firstName: session.firstName,
      lastName: session.lastName,
    }),
  );
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `product_admin_token=${encodeURIComponent(session.accessToken)}; path=/; max-age=3600; SameSite=Lax${secure}`;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `product_admin_token=; path=/; max-age=0; SameSite=Lax${secure}`;
}

export async function login(username: string, password: string): Promise<Session> {
  const { data } = await api.post<Session>("/auth/login", {
    username,
    password,
    expiresInMins: 60,
  });
  saveSession(data);
  return data;
}

export async function getProducts(
  { page, size, search, category, sort }: ListParams,
  signal?: AbortSignal,
): Promise<ProductList> {
  const [sortBy, order] = sort.split("-");
  const path = search
    ? "/products/search"
    : category
      ? `/products/category/${encodeURIComponent(category)}`
      : "/products";
  const { data } = await api.get<ProductList>(path, {
    params: {
      ...(search ? { q: search } : {}),
      limit: size,
      skip: (page - 1) * size,
      sortBy,
      order,
    },
    signal,
  });
  return data;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/products/categories", { signal });
  return data;
}

export async function getProduct(id: number, signal?: AbortSignal): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`, { signal });
  return data;
}

export async function addProduct(product: ProductInput): Promise<Product> {
  const { data } = await api.post<Product>("/products/add", product);
  return data;
}

export async function editProduct(id: number, product: ProductInput): Promise<Product> {
  const { data } = await api.put<Product>(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
