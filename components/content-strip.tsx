import Image from "next/image";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

export function ContentStrip() {
  const posts = [...blogPosts]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 3);

  return (
    <section
      id="notas"
      aria-labelledby="notas-titulo"
      className="scroll-mt-20 bg-paper py-20 text-ink md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="notas-titulo" className="t-h2 lg:col-span-5">
            Lo que escribimos sobre incendios y teledetección
          </h2>
          <p className="t-body self-end text-ink/80 lg:col-span-4 lg:col-start-9">
            Notas cortas sobre cómo se detecta un foco desde el espacio y qué
            límites tiene.{" "}
            <Link
              href="/blog"
              className={`font-semibold text-brand underline underline-offset-4 ${focus}`}
            >
              Ver todas
            </Link>
          </p>
        </div>

        <ul className="mt-12 border-b rule">
          {posts.map((p) => (
            <li key={p.slug} className="border-t rule">
              <Link
                href={`/blog/${p.slug}`}
                className={`group grid grid-cols-[6.5rem_1fr] gap-x-5 gap-y-2 py-6 sm:grid-cols-[10rem_1fr] md:gap-x-8 ${focus}`}
              >
                <Image
                  src={p.coverImage}
                  alt=""
                  width={160}
                  height={120}
                  sizes="160px"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="min-w-0">
                  <p className="t-caption">
                    {formatDate(p.publishedAt, "long")}
                  </p>
                  <h3 className="mt-1 font-serif text-xl leading-snug group-hover:underline group-hover:underline-offset-4 md:text-2xl">
                    {p.title}
                  </h3>
                  <p className="t-small mt-2 line-clamp-2 hidden max-w-2xl text-ink/75 sm:block">
                    {p.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
