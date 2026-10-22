import { vi } from "vitest";

/** Replaces global fetch with a mock answering each call with the next answer (the last one repeats). */
export function mockFetch(
  ...answers: { ok?: boolean; json?: unknown; reject?: boolean }[]
) {
  let i = 0;
  const fn = vi.fn<(...a: unknown[]) => Promise<Response>>(async () => {
    const a = answers[Math.min(i++, answers.length - 1)];
    if (a.reject) throw new Error("offline");
    return { ok: a.ok ?? true, json: async () => a.json } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** document.hidden is read-only in jsdom: redefine it for the visibility tests. */
export function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}
