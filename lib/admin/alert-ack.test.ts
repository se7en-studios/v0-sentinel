import { describe, expect, test } from "vitest";
import { ACK_MAX, cleanAckMap, isAcked, zoneKey } from "./alert-ack";

const ack = { t: 1_000, by: "ana", n: 3 };

describe("isAcked", () => {
  test("no acknowledgement means not handled", () => {
    expect(isAcked(undefined, 1, 0)).toBe(false);
  });

  test("an acknowledgement holds while detections do not grow", () => {
    expect(isAcked(ack, 3, 5_000)).toBe(true);
    expect(isAcked(ack, 2, 5_000)).toBe(true);
  });

  test("new detections re-open an acknowledged alert", () => {
    expect(isAcked(ack, 4, 5_000)).toBe(false);
  });

  test("a snooze ends at its deadline", () => {
    const snoozed = { ...ack, until: 10_000 };
    expect(isAcked(snoozed, 3, 9_999)).toBe(true);
    expect(isAcked(snoozed, 3, 10_000)).toBe(false);
  });

  test("new detections re-open a snoozed alert even before the deadline", () => {
    expect(isAcked({ ...ack, until: 10_000 }, 4, 5_000)).toBe(false);
  });
});

describe("cleanAckMap", () => {
  test("keeps well-formed entries and drops malformed ones", () => {
    const out = cleanAckMap({
      [zoneKey("a")]: { t: 1, by: "ana", n: 2, until: 9 },
      b: { t: "x", n: 1 },
      c: null,
      d: { t: 2, n: 0 },
    });
    expect(Object.keys(out).sort()).toEqual(["d", "zone:a"]);
    expect(out["zone:a"].until).toBe(9);
    expect(out.d.by).toBe("");
    expect(out.d.until).toBeUndefined();
  });

  test("tolerates non-objects and caps the size", () => {
    expect(cleanAckMap(undefined)).toEqual({});
    expect(cleanAckMap([1, 2])).toEqual({});
    const many = Object.fromEntries(
      Array.from({ length: ACK_MAX + 30 }, (_, i) => [`k${i}`, { t: i, n: 1 }]),
    );
    expect(Object.keys(cleanAckMap(many))).toHaveLength(ACK_MAX);
  });
});

describe("early alerts", () => {
  test("a spot keeps its key while its position drifts inside ~5 km", async () => {
    const { earlyKey } = await import("./alert-ack");
    expect(earlyKey({ lat: -41.1, lng: -71.3 })).toBe(earlyKey({ lat: -41.11, lng: -71.31 }));
    expect(earlyKey({ lat: -41.1, lng: -71.3 })).not.toBe(earlyKey({ lat: -40.5, lng: -71.3 }));
  });

  test("acknowledged or snoozed spots leave the pending list until the deadline", async () => {
    const { earlyKey, pendingEarly } = await import("./alert-ack");
    const a = { lat: -41.1, lng: -71.3 };
    const b = { lat: -30, lng: -60 };
    const acks = { [earlyKey(a)]: { t: 0, by: "ana", n: 0, until: 10_000 } };
    expect(pendingEarly([a, b], acks, 5_000)).toEqual([b]);
    expect(pendingEarly([a, b], acks, 10_000)).toEqual([a, b]);
  });
});

describe("cleanAckMap cap", () => {
  test("keeps the newest acknowledgements when there are more than the cap", () => {
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < ACK_MAX + 5; i++) raw[`early:${i}`] = { t: i, by: "x", n: 0 };
    const out = cleanAckMap(raw);
    expect(Object.keys(out)).toHaveLength(ACK_MAX);
    expect(out[`early:${ACK_MAX + 4}`]).toBeDefined();
    expect(out["early:0"]).toBeUndefined();
  });
});
