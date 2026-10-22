import { describe, expect, it } from "vitest";
import { signWebhook, verifyWebhook } from "./webhook-sign";

const NOW = 1_800_000_000;
const body = '{"alert":"x"}';

describe("webhook-sign", () => {
  const sig = signWebhook("s3cret", NOW, body);

  it("firma determinística en hex y verifica", () => {
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyWebhook("s3cret", NOW, body, sig, { nowSec: NOW + 10 })).toBe(
      true,
    );
  });

  it("rechaza cuerpo alterado, timestamp alterado y secreto equivocado", () => {
    expect(verifyWebhook("s3cret", NOW, body + " ", sig, { nowSec: NOW })).toBe(
      false,
    );
    expect(verifyWebhook("s3cret", NOW + 1, body, sig, { nowSec: NOW })).toBe(
      false,
    );
    expect(verifyWebhook("otro", NOW, body, sig, { nowSec: NOW })).toBe(false);
  });

  it("rechaza repeticiones fuera de la ventana (y timestamps futuros)", () => {
    expect(verifyWebhook("s3cret", NOW, body, sig, { nowSec: NOW + 301 })).toBe(
      false,
    );
    expect(
      verifyWebhook("s3cret", NOW, body, sig, {
        nowSec: NOW + 301,
        toleranceSec: 600,
      }),
    ).toBe(true);
    expect(verifyWebhook("s3cret", NOW, body, sig, { nowSec: NOW - 301 })).toBe(
      false,
    );
  });

  it("rechaza firmas malformadas o de otro largo sin lanzar", () => {
    for (const bad of ["", "zz", sig.slice(2), sig + "00"])
      expect(verifyWebhook("s3cret", NOW, body, bad, { nowSec: NOW })).toBe(
        false,
      );
    expect(verifyWebhook("s3cret", "abc", body, sig)).toBe(false);
  });
});
