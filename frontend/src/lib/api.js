const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith("/auth/login") &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.assign(new URL("/login", window.location.origin).toString());
    }
    throw new Error(result.message || result.error || "Request failed");
  }

  return result;
}
