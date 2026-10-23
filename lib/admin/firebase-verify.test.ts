import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const jwtVerify = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: () => "jwks",
  jwtVerify: (...a: unknown[]) => jwtVerify(...a),
}));

import { verifyFirebaseToken } from "./firebase-verify";

const ENV = { ...process.env };
beforeEach(() => {
  jwtVerify.mockReset();
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "proj";
  delete process.env.ADMIN_ALLOWED_EMAILS;
});
afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllEnvs();
});

describe("verifyFirebaseToken", () => {
  test("sin proyecto configurado rechaza sin consultar", async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    expect(await verifyFirebaseToken("t")).toBe(false);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  test("valida emisor y audiencia del proyecto", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jwtVerify.mockResolvedValue({ payload: { sub: "u1" } });
    expect(await verifyFirebaseToken("t")).toBe(true);
    expect(jwtVerify).toHaveBeenCalledWith("t", "jwks", {
      issuer: "https://securetoken.google.com/proj",
      audience: "proj",
      algorithms: ["RS256"],
      requiredClaims: ["exp", "sub"],
    });
  });

  test("un token inválido o sin sub se rechaza", async () => {
    jwtVerify.mockRejectedValueOnce(new Error("firma"));
    expect(await verifyFirebaseToken("t")).toBe(false);
    jwtVerify.mockResolvedValueOnce({ payload: {} });
    expect(await verifyFirebaseToken("t")).toBe(false);
  });

  test("sin lista de correos: abre fuera de producción y cierra en producción", async () => {
    jwtVerify.mockResolvedValue({ payload: { sub: "u1", email: "a@b.com" } });
    vi.stubEnv("NODE_ENV", "development");
    expect(await verifyFirebaseToken("t")).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(await verifyFirebaseToken("t")).toBe(false);
  });

  test("con lista de correos solo entran los permitidos (sin importar mayúsculas)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.ADMIN_ALLOWED_EMAILS = " Franco@Sentinel.com , otro@x.com ";
    jwtVerify.mockResolvedValueOnce({
      payload: { sub: "u1", email: "franco@sentinel.com" },
    });
    expect(await verifyFirebaseToken("t")).toBe(true);
    jwtVerify.mockResolvedValueOnce({
      payload: { sub: "u2", email: "intruso@x.com" },
    });
    expect(await verifyFirebaseToken("t")).toBe(false);
    jwtVerify.mockResolvedValueOnce({ payload: { sub: "u3" } });
    expect(await verifyFirebaseToken("t")).toBe(false);
  });
});
