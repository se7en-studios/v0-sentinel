import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const cookieValue = vi.fn<() => string | undefined>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: cookieValue() }) }),
}));

import {
  authConfigured,
  isAuthed,
  isOpenDemo,
  newSessionToken,
  normalizePassword,
  passwordMatches,
} from "./auth";

const ENV = { ...process.env };
beforeEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  cookieValue.mockReset();
});
afterEach(() => {
  process.env = { ...ENV };
  vi.useRealTimers();
});

describe("normalizePassword", () => {
  test.each([
    ["  clave\n", "clave"],
    ['"clave"', "clave"],
    ["'clave'", "clave"],
    [' " clave " ', "clave"],
    ['"abierta', '"abierta'],
    ['"', '"'],
  ])("%j -> %j", (input, out) => {
    expect(normalizePassword(input)).toBe(out);
  });
});

describe("configuración", () => {
  test("sin clave: fuera de producción abre como demo, en producción queda cerrado", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(authConfigured()).toBe(false);
    expect(isOpenDemo()).toBe(true);
    expect(await isAuthed()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isOpenDemo()).toBe(false);
    expect(await isAuthed()).toBe(false);
  });
});

describe("con clave configurada", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "  secreta ";
  });

  test("passwordMatches tolera espacios y comillas pero no otra clave", () => {
    expect(passwordMatches("secreta")).toBe(true);
    expect(passwordMatches('"secreta"')).toBe(true);
    expect(passwordMatches("secreto")).toBe(false);
    expect(passwordMatches("")).toBe(false);
  });

  test("una sesión recién emitida es válida", async () => {
    cookieValue.mockReturnValue(newSessionToken());
    expect(await isAuthed()).toBe(true);
  });

  test("una sesión sin cookie, adulterada o vencida se rechaza", async () => {
    cookieValue.mockReturnValue(undefined);
    expect(await isAuthed()).toBe(false);
    const [exp, mac] = newSessionToken().split(".");
    cookieValue.mockReturnValue(`${Number(exp) + 1}.${mac}`);
    expect(await isAuthed()).toBe(false);
    vi.useFakeTimers({ now: Date.now() + 15 * 86_400_000 });
    cookieValue.mockReturnValue(`${exp}.${mac}`);
    expect(await isAuthed()).toBe(false);
  });

  test("rotar el secreto invalida las sesiones existentes", async () => {
    const token = newSessionToken();
    process.env.ADMIN_SESSION_SECRET = "otro";
    cookieValue.mockReturnValue(token);
    expect(await isAuthed()).toBe(false);
  });
});
