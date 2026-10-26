import type { NewsItem } from "@/lib/landing-data/news";
// Licensing note (team decision, not made here): GNews's free plan restricts
// commercial/production use and has a daily request cap. Thumbnails are
// hotlinked from third-party publishers; confirm rights before launch.

const QUERY = "incendios forestales Argentina";
export const MAX_ITEMS = 6; // same single GNews request as before

interface GNewsArticle {
  title: string;
  description?: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

export async function fetchWildfireNews(): Promise<NewsItem[] | null> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return null;

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(QUERY)}&lang=es&max=${MAX_ITEMS}&sortby=publishedAt&apikey=${key}`;
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { articles?: GNewsArticle[] };
    if (!data.articles) return null;

    return data.articles.map((a) => ({
      title: a.title,
      description: a.description ?? "",
      source: a.source.name,
      link: a.url,
      image: a.image ?? "",
      publishedAt: a.publishedAt,
    }));
  } catch {
    return null;
  }
}

export function relativeTime(publishedAt: string, now: number): string {
  const then = new Date(publishedAt).getTime();
  if (Number.isNaN(then)) return "";
  const hours = Math.max(1, Math.round((now - then) / 3_600_000));
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}
