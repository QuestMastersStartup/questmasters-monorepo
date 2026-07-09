import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftPersistence } from "./useDraftPersistence";

describe("useDraftPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("caso válido: guarda el draft en localStorage tras el debounce de 1000ms", () => {
    renderHook(({ data }) => useDraftPersistence("draft-1", data), {
      initialProps: { data: { title: "Borrador" } },
    });

    expect(localStorage.getItem("draft-1")).toBeNull(); // aún no pasó el debounce

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const saved = JSON.parse(localStorage.getItem("draft-1")!);
    expect(saved.data).toEqual({ title: "Borrador" });
  });

  it("caso límite: enabled=false nunca escribe en localStorage", () => {
    renderHook(() => useDraftPersistence("draft-2", { title: "x" }, false));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(localStorage.getItem("draft-2")).toBeNull();
  });

  it("caso válido: loadDraft recupera exactamente los datos guardados", () => {
    localStorage.setItem("draft-3", JSON.stringify({ data: { title: "Guardado" }, savedAt: 123 }));

    const { result } = renderHook(() => useDraftPersistence("draft-3", { title: "" }));

    expect(result.current.loadDraft()).toEqual({ title: "Guardado" });
  });

  it("caso inválido: loadDraft devuelve null si no hay nada guardado o el JSON está corrupto", () => {
    const { result } = renderHook(() => useDraftPersistence("draft-4", { title: "" }));
    expect(result.current.loadDraft()).toBeNull();

    localStorage.setItem("draft-5", "{esto no es json");
    const { result: result2 } = renderHook(() => useDraftPersistence("draft-5", { title: "" }));
    expect(result2.current.loadDraft()).toBeNull();
  });

  it("caso válido: clearDraft elimina la entrada de localStorage", () => {
    localStorage.setItem("draft-6", JSON.stringify({ data: {}, savedAt: 1 }));
    const { result } = renderHook(() => useDraftPersistence("draft-6", { title: "" }));

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem("draft-6")).toBeNull();
  });
});
