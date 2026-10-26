export interface NewsItem {
  title: string;
  description: string;
  source: string;
  link: string;
  image: string;
  publishedAt: string;
}

const FIRE = /incendi|fuego|quema|brigadist|forestal|focos? de calor|llamas/i;
const ARGENTINA =
  /argentin|patagoni|chubut|neuqu[eé]n|r[ií]o negro|santa cruz|tierra del fuego|mendoza|c[oó]rdoba|bariloche|el bols[oó]n|esquel|corrientes|misiones|san luis|la pampa|salta|jujuy|tucum[aá]n|catamarca|entre r[ií]os|parque nacional|manejo del fuego/i;
// Foreign fire stories that mention Argentina only in passing
// (e.g. an Argentine delegation visiting Spain).
const FOREIGN =
  /espa[nñ]a|castilla|galicia|portugal|california|canad[aá]|australia|grecia|turqu[ií]a|chile\b|bolivia|brasil|amazon|paraguay|uruguay|m[eé]xico|estados unidos|europa|siberia|hawai/i;

// A province/city in the title means the story is local even if the body
// mentions a foreign place.
const LOCAL = new RegExp(
  ARGENTINA.source.replace("argentin|", ""),
  "i",
);

export const isRelevant = (n: Pick<NewsItem, "title" | "description">) => {
  const text = `${n.title} ${n.description}`;
  if (!FIRE.test(n.title) || !ARGENTINA.test(text)) return false;
  return LOCAL.test(n.title) || !FOREIGN.test(text);
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const urlKey = (u: string) => u.split(/[?#]/)[0].replace(/\/$/, "");

function similar(a: string, b: string): boolean {
  const A = new Set(a.split(" ").filter((w) => w.length > 3));
  const B = new Set(b.split(" ").filter((w) => w.length > 3));
  if (A.size === 0 || B.size === 0) return false;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter) >= 0.7;
}

/**
 * Keeps relevant items, dropping any that repeat a title, near-title or URL
 * already seen (first occurrence wins). A repeated image is blanked, not the
 * item, so the row falls back to the icon instead of showing the same photo.
 */
export function curateNews(items: NewsItem[], max = 6): NewsItem[] {
  const titles: string[] = [];
  const links = new Set<string>();
  const images = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    if (!item.title || !item.link || !isRelevant(item)) continue;
    const t = norm(item.title);
    const l = urlKey(item.link);
    if (links.has(l) || titles.some((x) => x === t || similar(x, t))) continue;
    titles.push(t);
    links.add(l);
    const img = item.image && !images.has(item.image) ? item.image : "";
    if (item.image) images.add(item.image);
    out.push({ ...item, image: img });
    if (out.length === max) break;
  }
  return out;
}
