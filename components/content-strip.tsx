import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Instagram } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { blogPosts } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf-bright";

export function ContentStrip() {
  const posts = [...blogPosts]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 3);

  return (
    <section
      className="relative isolate overflow-hidden bg-charcoal py-20 text-[#f4efe2] md:py-28"
      aria-labelledby="notas-titulo"
    >
      <div
        aria-hidden
        className="bg-noise absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
      />
      <div
        aria-hidden
        className="absolute -right-40 top-0 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(15_122_79/0.25),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="t-label mb-4 text-leaf-bright">Notas</p>
            <h2 id="notas-titulo" className="t-h2 max-w-2xl">
              Notas sobre incendios y teledetección
            </h2>
          </div>
          <div className="t-small flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/blog"
              className={`inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 ${focus}`}
            >
              Ver todas las notas <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="https://www.instagram.com/sentinel.patagonia"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 underline underline-offset-4 ${focus}`}
            >
              <Instagram className="h-4 w-4" aria-hidden /> @sentinel.patagonia
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              <span className="sr-only">(abre Instagram en pestaña nueva)</span>
            </a>
          </div>
        </Reveal>
        <ul className="grid gap-5 md:grid-cols-2 md:grid-rows-2 lg:grid-cols-[1.45fr_1fr] lg:gap-6">
          {posts.map((p, i) => {
            const featured = i === 0;
            return (
              <Reveal as="li" key={p.slug} delay={i * 100} className={featured ? "md:row-span-2" : ""}>
                <Link
                  href={`/blog/${p.slug}`}
                  className={`group relative block h-full min-h-[18rem] overflow-hidden rounded-[20px] border border-white/10 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] transition duration-300 hover:-translate-y-1 hover:border-leaf-bright/40 ${
                    featured ? "md:min-h-[34rem]" : "md:min-h-[16rem]"
                  } ${focus}`}
                >
                  <Image
                    src={p.coverImage}
                    alt=""
                    fill
                    sizes={
                      featured
                        ? "(max-width: 768px) 100vw, 58vw"
                        : "(max-width: 768px) 100vw, 40vw"
                    }
                    loading="lazy"
                    className="object-cover saturate-[0.8] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgb(18_17_14/0.95)_8%,rgb(18_17_14/0.55)_55%,rgb(15_122_79/0.12))]"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                    <p className="glass t-label mb-3 inline-block rounded-full px-3 py-1">
                      {formatDate(p.publishedAt)}
                    </p>
                    <h3
                      className={`font-semibold leading-snug group-hover:underline group-hover:underline-offset-4 ${
                        featured ? "t-h3 md:text-3xl" : "t-body"
                      }`}
                    >
                      {p.title}
                    </h3>
                    {featured && (
                      <p className="t-small mt-3 line-clamp-2 max-w-xl text-[#f4efe2]/80">
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
