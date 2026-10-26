import { describe, expect, it } from "vitest";
import { MAX_PER_DAY_LIMIT, cleanDelivery, cleanNotify, contactsOf, decideDelivery, recordDelivery, EMPTY_DELIVERY, isEmail, isPhone } from "./alert-delivery";
import { DEFAULT_SETTINGS } from "./types";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const on = { ...DEFAULT_SETTINGS.notify, deliver: true, email: "yo@ejemplo.com" };

describe("contacts", () => {
  it("accepts what the server accepts and nothing else", () => {
    expect(isEmail("yo@ejemplo.com")).toBe(true);
    expect(isEmail("yo@")).toBe(false);
    expect(isEmail("a b@c.de")).toBe(false);
    expect(isPhone("+5492991234567")).toBe(true);
    expect(isPhone("2991234567")).toBe(true);
    expect(isPhone("+0123")).toBe(false);
    expect(isPhone("hola")).toBe(false);
  });
  it("lists only valid contacts", () => {
    expect(contactsOf({ email: "bad", whatsapp: "+5492991234567" })).toEqual({ emails: [], phones: ["+5492991234567"] });
  });
});

describe("decideDelivery", () => {
  it("is silent until the person turns it on", () => {
    expect(decideDelivery(EMPTY_DELIVERY, { ...on, deliver: false }, "r1", NOW)).toEqual({ send: false, reason: "off" });
  });
  it("needs a valid contact", () => {
    expect(decideDelivery(EMPTY_DELIVERY, { ...on, email: "", whatsapp: "" }, "r1", NOW)).toEqual({ send: false, reason: "no-contact" });
    expect(decideDelivery(EMPTY_DELIVERY, { ...on, email: "no-es-un-correo" }, "r1", NOW)).toEqual({ send: false, reason: "no-contact" });
  });
  it("sends the first time", () => {
    expect(decideDelivery(EMPTY_DELIVERY, on, "r1", NOW)).toEqual({ send: true });
  });
  it("holds a rule back inside its minimum interval, and lets it go after", () => {
    const s = recordDelivery(EMPTY_DELIVERY, { at: NOW - 30 * MIN, ruleId: "r1", channels: [] });
    expect(decideDelivery(s, on, "r1", NOW)).toEqual({ send: false, reason: "interval" }); // default 60 min
    expect(decideDelivery(s, { ...on, minIntervalMin: 15 }, "r1", NOW)).toEqual({ send: true });
  });
  it("another rule is not held back by the first", () => {
    const s = recordDelivery(EMPTY_DELIVERY, { at: NOW - MIN, ruleId: "r1", channels: [] });
    expect(decideDelivery(s, on, "r2", NOW)).toEqual({ send: true });
  });
  it("stops at the daily maximum, and counts only the last 24 hours", () => {
    let s = EMPTY_DELIVERY;
    for (let i = 0; i < 3; i++) s = recordDelivery(s, { at: NOW - (i + 1) * 2 * HOUR, ruleId: `r${i}`, channels: [] });
    expect(decideDelivery(s, { ...on, maxPerDay: 3 }, "new", NOW)).toEqual({ send: false, reason: "daily" });
    expect(decideDelivery(s, { ...on, maxPerDay: 4 }, "new", NOW)).toEqual({ send: true });
    expect(decideDelivery(s, { ...on, maxPerDay: 3 }, "new", NOW + 20 * HOUR)).toEqual({ send: true }); // the oldest fell out of the window
  });
});

describe("recordDelivery", () => {
  it("returns a new state and keeps the last result", () => {
    const r = { at: NOW, ruleId: "r1", channels: [{ channel: "email", status: "sent" }] };
    const s = recordDelivery(EMPTY_DELIVERY, r);
    expect(s).not.toBe(EMPTY_DELIVERY);
    expect(EMPTY_DELIVERY.sent).toEqual([]);
    expect(s.last).toEqual(r);
    expect(s.lastByRule.r1).toBe(NOW);
  });
  it("never keeps more than the daily limit", () => {
    let s = EMPTY_DELIVERY;
    for (let i = 0; i < MAX_PER_DAY_LIMIT + 20; i++) s = recordDelivery(s, { at: NOW - 1000 + i, ruleId: "r", channels: [] });
    expect(s.sent.length).toBe(MAX_PER_DAY_LIMIT);
  });
});

describe("cleanNotify (untrusted storage)", () => {
  const base = DEFAULT_SETTINGS.notify;
  it("falls back to safe defaults for garbage", () => {
    expect(cleanNotify(null, base)).toEqual(base);
    expect(cleanNotify("x", base)).toEqual(base);
    expect(cleanNotify({ deliver: "yes", minIntervalMin: 7, maxPerDay: "lots", email: 5, whatsapp: {} }, base)).toEqual(base);
  });
  it("keeps valid values and clamps the daily maximum", () => {
    const n = cleanNotify({ deliver: true, minIntervalMin: 360, maxPerDay: 9999, email: " yo@ejemplo.com ", whatsapp: "+5492991234567" }, base);
    expect(n).toMatchObject({ deliver: true, minIntervalMin: 360, maxPerDay: MAX_PER_DAY_LIMIT, email: "yo@ejemplo.com", whatsapp: "+5492991234567" });
    expect(cleanNotify({ maxPerDay: 0 }, base).maxPerDay).toBe(1);
  });
  it("bounds the length of what a person typed", () => {
    expect(cleanNotify({ email: "a".repeat(1000) }, base).email.length).toBe(254);
  });
  it("keeps the existing on/off switches when they are valid booleans", () => {
    expect(cleanNotify({ onZoneHit: false, browser: true }, base)).toMatchObject({ onZoneHit: false, browser: true, onSensor: true });
  });
  it("delivery is off unless it is exactly true", () => {
    for (const v of ["true", 1, "on", undefined]) expect(cleanNotify({ deliver: v }, base).deliver).toBe(false);
  });
});

describe("cleanDelivery (untrusted storage)", () => {
  it("drops garbage, old entries and absurd values", () => {
    expect(cleanDelivery(null, NOW)).toEqual(EMPTY_DELIVERY);
    const s = cleanDelivery(
      { lastByRule: { r1: NOW - HOUR, old: NOW - 3 * 86_400_000, bad: "x", future: NOW + 10 * HOUR }, sent: [NOW - HOUR, "x", NOW - 3 * 86_400_000, NaN], last: { at: NOW, ruleId: "r1", channels: [{ channel: "email", status: "sent" }, 5] } },
      NOW,
    );
    expect(s.lastByRule).toEqual({ r1: NOW - HOUR });
    expect(s.sent).toEqual([NOW - HOUR]);
    expect(s.last?.channels).toEqual([{ channel: "email", status: "sent" }]);
  });
});
