import { describe, expect, it } from "vitest";
import {
  MODIS_WINDOWS,
  VIIRS_WINDOWS,
  artMinute,
  clock,
  nextPass,
  passWindows,
} from "./polar-passes";

// 12:00 ART = 15:00 UTC
const art = (hh: number, mm = 0) => Date.UTC(2026, 9, 23, hh + 3, mm);

describe("artMinute", () => {
  it("is Argentina time, wrapping at midnight", () => {
    expect(artMinute(art(12, 30))).toBe(750);
    expect(artMinute(Date.UTC(2026, 9, 23, 2, 0))).toBe(23 * 60); // 02:00Z = 23:00 ART the day before
    expect(artMinute(Date.UTC(2026, 9, 23, 3, 0))).toBe(0);
  });
});

describe("passWindows", () => {
  it("keeps VIIRS to its two daily windows and merges overlapping MODIS ones", () => {
    expect(passWindows(false)).toEqual(VIIRS_WINDOWS);
    const w = passWindows(true);
    // night VIIRS 00:30-04:00 runs into Aqua 04:00-05:30; day VIIRS 13:00-17:00 into Aqua 16:00-18:00
    expect(w[0]).toEqual({ from: 30, to: 330 });
    expect(w.some((x) => x.from === 780 && x.to === 1080)).toBe(true);
    expect(w.length).toBeLessThan(VIIRS_WINDOWS.length + MODIS_WINDOWS.length);
    for (let i = 1; i < w.length; i++)
      expect(w[i].from).toBeGreaterThan(w[i - 1].to);
  });
});

describe("nextPass", () => {
  it("reports the minutes to the next window when none is open", () => {
    const n = nextPass(art(10, 0), false);
    expect(n.inWindow).toBe(false);
    expect(n.minutes).toBe(3 * 60);
    expect(clock(n.window.from)).toBe("13:00");
  });
  it("reports how long the open window lasts", () => {
    const n = nextPass(art(14, 0), false);
    expect(n).toMatchObject({ inWindow: true, minutes: 3 * 60 });
  });
  it("rolls over to tomorrow's first window after the last one", () => {
    const n = nextPass(art(20, 0), false);
    expect(n.inWindow).toBe(false);
    expect(n.minutes).toBe(4 * 60 + 30);
    expect(clock(n.window.from)).toBe("00:30");
  });
  it("sees the extra MODIS passes when they are on", () => {
    expect(nextPass(art(8, 0), false).minutes).toBe(5 * 60);
    expect(nextPass(art(8, 0), true).minutes).toBe(60); // Terra at 09:00
  });
});
