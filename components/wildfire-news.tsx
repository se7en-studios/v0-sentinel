import { ArrowUpRight, Flame } from "lucide-react";
import { curateNews, type NewsItem } from "@/lib/landing-data/news";
import {
  DataUnavailable,
  FAINT,
  GREEN_TEXT,
  INK,
  MUTED,
  SectionShell,
  Updated,
} from "@/components/data/data-section";

// Licensing note (team decision, not made here): GNews's free plan restricts
// commercial/production use and has a daily request cap. Thumbnails are
// hotlinked from third-party publishers; confirm rights before launch.

const QUERY = "incendios forestales Argentina";
const MAX_ITEMS = 6; // same single GNews request as before
const MIN_USEFUL = 1;
const ID = "noticias-title";
const TITLE = "Noticias sobre incendios forestales en Argentina.";

interface GNewsArticle {
  title: string;
  description?: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

async function fetchWildfireNews(): Promise<NewsItem[] | null> {
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

function relativeTime(publishedAt: string, now: number): string {
  const then = new Date(publishedAt).getTime();
  if (Number.isNaN(then)) return "";
  const hours = Math.max(1, Math.round((now - then) / 3_600_000));
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

const ACCENTS = ["#b83a3a", "#8a5a1f", "#0f7a4f"];

export async function WildfireNews() {
  const raw = await fetchWildfireNews();
  if (raw === null) {
    return (
      <DataUnavailable
        id={ID}
        title={TITLE}
        what="El feed de noticias"
        minHeight={420}
        max="max-w-4xl"
      />
    );
  }

  const news = curateNews(raw, MAX_ITEMS);
  const at = new Date();

  return (
    <SectionShell labelledBy={ID} minHeight={420} max="max-w-4xl">
      <h2
        id={ID}
        className="text-3xl sm:text-4xl lg:text-5xl mb-4 max-w-2xl"
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          color: INK,
          lineHeight: 1.1,
        }}
      >
        Noticias sobre <span style={{ color: GREEN_TEXT }}>incendios</span>{" "}
        forestales en Argentina.
      </h2>
      <p
        className="text-sm mb-12 max-w-xl"
        style={{ fontFamily: "var(--font-sans)", color: MUTED }}
      >
        Cobertura reciente de otros medios sobre el problema que Sentinel existe
        para resolver. <Updated at={at} />.
      </p>

      {news.length < MIN_USEFUL ? (
        <p
          role="status"
          className="text-sm"
          style={{ fontFamily: "var(--font-sans)", color: MUTED }}
        >
          No hay notas recientes relevantes sobre incendios en Argentina en este
          momento.
        </p>
      ) : (
        <ul className="list-none p-0 m-0">
          {news.map((item, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <li
                key={item.link}
                style={{
                  borderBottom:
                    i < news.length - 1
                      ? "0.5px solid rgba(26,24,18,0.14)"
                      : "none",
                }}
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b44]"
                >
                  <span
                    aria-hidden="true"
                    className="hidden sm:block shrink-0 tabular-nums"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "22px",
                      color: "var(--muted-foreground)",
                      width: "36px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div
                    className="relative shrink-0 overflow-hidden rounded-md"
                    style={{
                      width: 88,
                      height: 64,
                      background: `radial-gradient(circle at 30% 30%, ${accent}22, rgba(26,24,18,0.06))`,
                    }}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        width={88}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Flame
                          aria-hidden="true"
                          className="w-5 h-5"
                          style={{ color: accent, opacity: 0.85 }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[15px] leading-snug line-clamp-2 transition-colors group-hover:text-[#0b6b44]"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 500,
                        color: INK,
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-xs mt-1.5"
                      style={{ fontFamily: "var(--font-sans)", color: FAINT }}
                    >
                      {item.source} ·{" "}
                      {relativeTime(item.publishedAt, at.getTime())}
                      <span className="sr-only">
                        {" "}
                        (se abre en una pestaña nueva)
                      </span>
                    </p>
                  </div>

                  <ArrowUpRight
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0 transition-all duration-200 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: MUTED }}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <p
        className="text-xs mt-8"
        style={{ fontFamily: "var(--font-sans)", color: FAINT }}
      >
        Fuente:{" "}
        <a
          href="https://gnews.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GNews
        </a>
        , filtradas por relevancia (incendios en Argentina) y sin repetidos. Los
        enlaces abren la nota original en el medio que la publicó.
      </p>
    </SectionShell>
  );
}
