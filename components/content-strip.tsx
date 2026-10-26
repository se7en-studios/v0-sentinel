import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Instagram } from "lucide-react";
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
      className="bg-charcoal py-16 text-[#f4efe2] md:py-20"
      aria-labelledby="notas-titulo"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="notas-titulo" className="t-h3">
            Notas sobre incendios y teledetección
          </h2>
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
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className={`group flex gap-4 md:block ${focus}`}
              >
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-sm md:mb-4 md:h-40 md:w-full">
                  <Image
                    src={p.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 112px, 33vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="t-label opacity-75">
                    {formatDate(p.publishedAt)}
                  </p>
                  <h3 className="t-body mt-1 font-semibold group-hover:underline">
                    {p.title}
                  </h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
