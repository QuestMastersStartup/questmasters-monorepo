import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authFetch } from "./api";

describe("authFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caso inválido: sin sesión activa, rechaza sin llamar a fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(authFetch("/api/campaigns")).rejects.toThrow("No hay sesión activa");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caso válido: agrega el header Authorization con el token de sesión", async () => {
    localStorage.setItem("auth_token", "tok-123");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("/api/campaigns");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer tok-123");
  });

  it("caso límite: agrega Content-Type: application/json solo cuando hay body y no es FormData", async () => {
    localStorage.setItem("auth_token", "tok-123");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("/api/campaigns", { method: "POST", body: JSON.stringify({ a: 1 }) });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("caso inválido: no agrega Content-Type cuando el body es FormData", async () => {
    localStorage.setItem("auth_token", "tok-123");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    const formData = new FormData();
    await authFetch("/api/assets", { method: "POST", body: formData });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Content-Type"]).toBeUndefined();
  });
});
