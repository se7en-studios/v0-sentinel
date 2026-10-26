import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { blogPosts } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

const siteUrl = "https://www.sentineltech.com.ar";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Ideas y análisis sobre detección temprana de incendios, monitoreo forestal e inteligencia territorial en la Patagonia.",
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: "Blog | Sentinel Technologies",
    description:
      "Ideas y análisis sobre detección temprana de incendios, monitoreo forestal e inteligencia territorial en la Patagonia.",
    url: `${siteUrl}/blog`,
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = [...blogPosts].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );

  return (
    <>
      <ScrollProgress />
      <header>
        <Navbar />
      </header>

      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-5 pb-28 pt-32 md:px-8 md:pt-40">
          <nav
            aria-label="Ruta de navegación"
            className="t-small mb-8 flex items-center gap-2 text-ink/70"
          >
            <Link
              href="/"
              className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Inicio
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-ink">
              Blog
            </span>
          </nav>
          <h1 className="t-display max-w-4xl !text-5xl md:!text-7xl">
            Notas sobre monitoreo forestal y teledetección
          </h1>

          <ul className="mt-16 border-b rule">
            {posts.map((post, i) => (
              <li key={post.slug} className="border-t rule">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-x-8 gap-y-4 py-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand md:grid-cols-[16rem_1fr]"
                >
                  <Image
                    src={post.coverImage}
                    alt=""
                    width={512}
                    height={384}
                    sizes="(max-width: 768px) 100vw, 256px"
                    priority={i === 0}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="min-w-0 max-w-2xl">
                    <p className="t-caption">
                      {formatDate(post.publishedAt, "long")}
                    </p>
                    <h2 className="t-h2 mt-1 !text-3xl group-hover:underline group-hover:underline-offset-4 md:!text-4xl">
                      {post.title}
                    </h2>
                    <p className="t-body mt-3 line-clamp-3 text-ink/80">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
