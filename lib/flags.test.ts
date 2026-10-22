// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { isEnabled } from "./flags";

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("defaults to off", () => {
  expect(isEnabled("nope")).toBe(false);
});

test("reads NEXT_PUBLIC_FLAG_<NAME> from the env", () => {
  vi.stubEnv("NEXT_PUBLIC_FLAG_BETA", "true");
  vi.stubEnv("NEXT_PUBLIC_FLAG_OFF", "0");
  expect(isEnabled("beta")).toBe(true);
  expect(isEnabled("BETA")).toBe(true);
  expect(isEnabled("off")).toBe(false);
});

test("localStorage override wins in both directions", () => {
  vi.stubEnv("NEXT_PUBLIC_FLAG_BETA", "1");
  localStorage.setItem(
    "sentinel-flags",
    JSON.stringify({ BETA: false, NEW: true }),
  );
  expect(isEnabled("beta")).toBe(false);
  expect(isEnabled("new")).toBe(true);
  expect(isEnabled("other")).toBe(false);
});

test("corrupt or non-object storage falls back to the env", () => {
  vi.stubEnv("NEXT_PUBLIC_FLAG_BETA", "on");
  for (const raw of ["{not json", "[]", "null", '"x"']) {
    localStorage.setItem("sentinel-flags", raw);
    expect(isEnabled("beta")).toBe(true);
  }
});

test("is safe when localStorage throws", () => {
  vi.stubEnv("NEXT_PUBLIC_FLAG_BETA", "yes");
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("denied");
  });
  expect(isEnabled("beta")).toBe(true);
  expect(isEnabled("x")).toBe(false);
});
