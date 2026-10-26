// Draws the weekly report as a real PDF (A4, one or two pages) with pdf-lib: pure JavaScript, no browser or
// server needed, so the same code can run on the panel and on a scheduled job. Standard fonts only, so text is
// cleaned to what they can draw.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { translate, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";
import { fmtArgentina } from "./report";
import type { WeeklyReport } from "./weekly-report";

const W = 595.28;
const H = 841.89;
const M = 40;
const BOTTOM = M + 28; // room for the page number
const BRAND = rgb(0.059, 0.478, 0.31);
const INK = rgb(0.1, 0.09, 0.07);
const MUTED = rgb(0.38, 0.36, 0.32);
const LINE = rgb(0.86, 0.84, 0.8);
const WASH = rgb(0.96, 0.94, 0.9);
const GRAY = rgb(0.6, 0.6, 0.6);

/** What a standard PDF font can draw: Latin-1 letters and common punctuation; anything else becomes "?". */
export function pdfSafe(s: string): string {
  const clean = s
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\s ]+/g, " ")
    .trim();
  // one "?" per symbol: an emoji is two UTF-16 units
  return Array.from(clean, (ch) =>
    /[\x20-\x7E\xA1-\xFF]/.test(ch) ? ch : "?",
  ).join("");
}

const hex = (c: string) =>
  /^#[0-9a-fA-F]{6}$/.test(c)
    ? rgb(
        parseInt(c.slice(1, 3), 16) / 255,
        parseInt(c.slice(3, 5), 16) / 255,
        parseInt(c.slice(5, 7), 16) / 255,
      )
    : GRAY;

interface Col {
  label: string;
  width: number;
  right?: boolean;
}

class Sheet {
  page!: PDFPage;
  y = 0;
  constructor(
    private doc: PDFDocument,
    private f: { r: PDFFont; b: PDFFont },
    private r: WeeklyReport,
    private t: (k: MsgKey, v?: Record<string, string | number>) => string,
  ) {}

  start() {
    this.page = this.doc.addPage([W, H]);
    this.y = H - M;
  }
  next() {
    this.start();
    this.write(
      `Sentinel - ${this.t("wk.title")} - ${this.r.org}`,
      M,
      this.y - 8,
      { size: 8.5, color: MUTED },
    );
    this.y -= 26;
  }
  need(h: number) {
    if (this.y - h < BOTTOM) this.next();
  }

  fit(s: string, size: number, max: number, font = this.f.r): string {
    let out = pdfSafe(s);
    if (font.widthOfTextAtSize(out, size) <= max) return out;
    while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > max)
      out = out.slice(0, -1);
    return `${out.trimEnd()}...`;
  }
  write(
    s: string,
    x: number,
    y: number,
    o: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      max?: number;
      right?: boolean;
    } = {},
  ) {
    const size = o.size ?? 10;
    const font = o.bold ? this.f.b : this.f.r;
    const str = o.max ? this.fit(s, size, o.max, font) : pdfSafe(s);
    const dx = o.right ? -font.widthOfTextAtSize(str, size) : 0;
    this.page.drawText(str, {
      x: x + dx,
      y,
      size,
      font,
      color: o.color ?? INK,
    });
  }

  /** Wrapped paragraph; returns the lines used. */
  para(
    s: string,
    o: { size?: number; color?: ReturnType<typeof rgb>; width?: number } = {},
  ) {
    const size = o.size ?? 10;
    const width = o.width ?? W - 2 * M;
    const lines: string[] = [];
    let cur = "";
    for (const w of pdfSafe(s).split(" ")) {
      const test = cur ? `${cur} ${w}` : w;
      if (this.f.r.widthOfTextAtSize(test, size) > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    this.need(lines.length * (size + 3) + 4);
    for (const l of lines) {
      this.write(l, M, this.y - size, { size, color: o.color });
      this.y -= size + 3;
    }
    this.y -= 4;
  }

  h2(label: string) {
    this.need(40);
    this.y -= 10;
    this.write(label.toUpperCase(), M, this.y - 9, {
      size: 9,
      bold: true,
      color: BRAND,
    });
    this.page.drawLine({
      start: { x: M, y: this.y - 14 },
      end: { x: W - M, y: this.y - 14 },
      thickness: 0.6,
      color: LINE,
    });
    this.y -= 24;
  }

  table(cols: Col[], rows: string[][]) {
    const draw = (cells: string[], bold: boolean, bg?: boolean) => {
      this.need(18);
      if (bg)
        this.page.drawRectangle({
          x: M,
          y: this.y - 15,
          width: W - 2 * M,
          height: 17,
          color: WASH,
        });
      let x = M + 4;
      cells.forEach((c, i) => {
        const col = cols[i];
        const w = col.width - 8;
        this.write(c, col.right ? x + w : x, this.y - 11, {
          size: 9,
          bold,
          max: w,
          right: col.right,
          color: bold ? MUTED : INK,
        });
        x += col.width;
      });
      this.y -= 17;
      this.page.drawLine({
        start: { x: M, y: this.y },
        end: { x: W - M, y: this.y },
        thickness: 0.4,
        color: LINE,
      });
    };
    draw(
      cols.map((c) => c.label),
      true,
      true,
    );
    rows.forEach((r) => draw(r, false));
    this.y -= 6;
  }
}

export async function renderWeeklyPdf(r: WeeklyReport): Promise<Uint8Array> {
  const t = (k: MsgKey, v?: Record<string, string | number>) =>
    translate(r.locale, k, v);
  const loc = NUM_LOCALE[r.locale];
  const n = (v: number) => Math.round(v).toLocaleString(loc);
  const doc = await PDFDocument.create();
  doc.setTitle(pdfSafe(`${t("wk.title")} - ${r.org}`));
  doc.setAuthor("Sentinel");
  doc.setCreator("Sentinel");
  doc.setCreationDate(new Date(r.generatedAt));
  const f = {
    r: await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const s = new Sheet(doc, f, r, t);
  s.start();

  // ---- header band ----
  s.page.drawRectangle({ x: 0, y: H - 74, width: W, height: 74, color: BRAND });
  s.write("SENTINEL", M, H - 40, { size: 15, bold: true, color: rgb(1, 1, 1) });
  s.write(t("wk.title"), W - M, H - 40, {
    size: 15,
    bold: true,
    color: rgb(1, 1, 1),
    right: true,
  });
  s.y = H - 74 - 22;
  s.write(
    t("wk.subtitle", {
      org: pdfSafe(r.org) || "-",
      region: pdfSafe(r.region) || "-",
    }),
    M,
    s.y - 12,
    { size: 13, bold: true, max: W - 2 * M },
  );
  s.y -= 20;
  const meta = [
    r.period ? t("wk.period", { from: r.period.from, to: r.period.to }) : "",
    t("wk.generated", { t: fmtArgentina(new Date(r.generatedAt), r.locale) }),
  ]
    .filter(Boolean)
    .join("   |   ");
  s.write(meta, M, s.y - 10, { size: 9, color: MUTED, max: W - 2 * M });
  s.y -= 24;

  // ---- one-sentence summary, in plain words ----
  const { totals } = r;
  s.para(
    totals.zones === 0
      ? t("wk.headline.noZones")
      : totals.zonesHit === 0
        ? t("wk.headline.quiet", { total: totals.zones })
        : t("wk.headline.hits", { n: totals.zonesHit, total: totals.zones }),
    { size: 12 },
  );
  s.para(t("wk.headline.country", { n: n(totals.fires) }), {
    size: 10,
    color: MUTED,
  });

  // ---- four figures ----
  const kpis: [string, string][] = [
    [t("wk.k.fires"), n(totals.fires)],
    [
      t("wk.k.zones"),
      totals.zones ? `${totals.zonesHit} / ${totals.zones}` : "-",
    ],
    [t("wk.k.power"), n(totals.frpMw)],
    [t("wk.k.area"), `${n(totals.hectares10d)} ha`],
  ];
  const bw = (W - 2 * M - 3 * 8) / 4;
  s.need(58);
  kpis.forEach(([label, value], i) => {
    const x = M + i * (bw + 8);
    s.page.drawRectangle({
      x,
      y: s.y - 50,
      width: bw,
      height: 50,
      borderColor: LINE,
      borderWidth: 0.8,
      color: rgb(1, 1, 1),
    });
    s.write(value, x + 8, s.y - 25, { size: 16, bold: true, max: bw - 12 });
    s.write(label, x + 8, s.y - 40, { size: 7.5, color: MUTED, max: bw - 12 });
  });
  s.y -= 62;

  // ---- fires per day ----
  s.h2(t("wk.perDay"));
  if (r.days.length) {
    const chartH = 70;
    s.need(chartH + 30);
    const max = Math.max(1, ...r.days.map((d) => d.count));
    const slot = (W - 2 * M) / r.days.length;
    const bar = Math.min(34, slot - 10);
    r.days.forEach((d, i) => {
      const h = (d.count / max) * chartH;
      const x = M + i * slot + (slot - bar) / 2;
      s.page.drawRectangle({
        x,
        y: s.y - chartH - 4,
        width: bar,
        height: Math.max(h, d.count ? 1.5 : 0.5),
        color: d.count ? BRAND : LINE,
      });
      const num = pdfSafe(n(d.count));
      s.write(
        num,
        x + bar / 2 - f.r.widthOfTextAtSize(num, 8) / 2,
        s.y - chartH - 4 + h + 3,
        { size: 8, color: MUTED },
      );
      const lab = pdfSafe(d.label);
      s.write(
        lab,
        x + bar / 2 - f.r.widthOfTextAtSize(lab, 8) / 2,
        s.y - chartH - 16,
        { size: 8, color: MUTED },
      );
    });
    s.y -= chartH + 26;
  }

  // ---- the person's zones ----
  s.h2(t("wk.zones"));
  if (r.zones.length) {
    const cw = [W - 2 * M - 3 * 92, 92, 92, 92];
    s.table(
      [
        { label: t("wk.th.zone"), width: cw[0] },
        { label: t("wk.th.area"), width: cw[1], right: true },
        { label: t("wk.th.recent"), width: cw[2], right: true },
        { label: t("wk.th.total"), width: cw[3], right: true },
      ],
      r.zones.map((z) => [
        z.name,
        `${n(z.areaHa)} ha`,
        n(z.recent),
        n(z.total),
      ]),
    );
    if (r.zonesOmitted)
      s.para(t("wk.zones.more", { n: r.zonesOmitted }), {
        size: 9,
        color: MUTED,
      });
  } else s.para(t("wk.zones.none"), { size: 10, color: MUTED });

  // ---- biggest fires ----
  s.h2(t("wk.incidents"));
  if (r.incidents.length)
    s.table(
      [
        { label: t("wk.th.place"), width: W - 2 * M - 3 * 80 },
        { label: t("wk.th.area"), width: 80, right: true },
        { label: t("wk.th.fires"), width: 80, right: true },
        { label: t("wk.th.days"), width: 80, right: true },
      ],
      r.incidents.map((x) => [
        x.place,
        `${n(x.areaHa)} ha`,
        n(x.fires),
        n(x.daysActive),
      ]),
    );
  else s.para(t("wk.incidents.none"), { size: 10, color: MUTED });

  // ---- forecast ----
  s.h2(t("wk.forecast"));
  if (r.forecast?.length) {
    s.need(64);
    const fw = (W - 2 * M) / r.forecast.length;
    r.forecast.forEach((d, i) => {
      const x = M + i * fw;
      s.page.drawRectangle({
        x: x + 2,
        y: s.y - 44,
        width: fw - 4,
        height: 44,
        color: hex(d.color),
      });
      s.write(d.risk, x + fw / 2, s.y - 18, {
        size: 8.5,
        bold: true,
        color: rgb(1, 1, 1),
        max: fw - 8,
        right: false,
      });
      s.write(
        String(Math.round(d.score)),
        x + fw / 2 - f.b.widthOfTextAtSize(String(Math.round(d.score)), 12) / 2,
        s.y - 34,
        { size: 12, bold: true, color: rgb(1, 1, 1) },
      );
      s.write(
        d.label,
        x + fw / 2 - f.r.widthOfTextAtSize(pdfSafe(d.label), 8) / 2,
        s.y - 56,
        { size: 8, color: MUTED },
      );
    });
    s.y -= 66;
  } else s.para(t("wk.forecast.none"), { size: 10, color: MUTED });

  // ---- data status and alerts ----
  s.h2(t("wk.sources"));
  for (const src of r.sources) {
    const age =
      src.ageMin === undefined
        ? ""
        : `  (${t("wk.sources.age", { t: src.ageMin < 60 ? `${Math.round(src.ageMin)} min` : `${(src.ageMin / 60).toLocaleString(loc, { maximumFractionDigits: 1 })} h` })})`;
    s.para(
      `${src.label}: ${src.ok ? t("wk.sources.ok") : t("wk.sources.down")}${age}`,
      { size: 9.5, color: src.ok ? INK : rgb(0.72, 0.23, 0.23) },
    );
  }
  s.para(t("wk.rules", { n: r.activeRules }), { size: 9.5 });
  s.need(40);
  s.y -= 8;
  s.para(t("wk.disclaimer"), { size: 8, color: MUTED });

  // ---- page numbers ----
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const label = pdfSafe(t("wk.page", { n: i + 1, total: pages.length }));
    p.drawText(label, {
      x: W - M - f.r.widthOfTextAtSize(label, 8),
      y: M - 4,
      size: 8,
      font: f.r,
      color: MUTED,
    });
  });
  return doc.save();
}
