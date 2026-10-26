import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
  const [featured, ...rest] = posts;

  return (
    <>
      <ScrollProgress />
      <header>
        <Navbar />
      </header>

      <main id="main-content" className="min-h-screen bg-background">
        <section className="relative isolate overflow-hidden bg-charcoal px-6 pb-24 pt-36 text-[#f4efe2] lg:pb-32 lg:pt-44">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgb(15_122_79/0.45),transparent_60%),linear-gradient(to_bottom,transparent_60%,var(--color-background))]"
          />
          <div
            aria-hidden
            className="bg-noise absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
          />
          <div className="mx-auto max-w-6xl">
            <nav
              aria-label="Ruta de navegación"
              className="t-small mb-8 flex items-center gap-2 text-[#f4efe2]/75"
            >
              <Link
                href="/"
                className="transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
              >
                Inicio
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-[#f4efe2]">
                Blog
              </span>
            </nav>
            <p className="t-label mb-5 text-leaf-bright">
              Artículos y publicaciones
            </p>
            <h1 className="t-display max-w-4xl">
              Ideas sobre <span className="text-leaf-bright">monitoreo forestal</span>{" "}
              e inteligencia territorial.
            </h1>
          </div>
        </section>

        <section className="relative -mt-12 px-6 pb-28 lg:-mt-16">
          <div className="mx-auto max-w-6xl">
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group glass-light mb-8 grid overflow-hidden rounded-[20px] transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7a4f] lg:grid-cols-[1.3fr_1fr]"
              >
                <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[26rem]">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    className="object-cover saturate-[0.85] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(232_115_42/0.12),transparent_50%,rgb(15_122_79/0.2))]" />
                </div>
                <div className="flex flex-col justify-center p-7 lg:p-10">
                  <p className="t-label mb-4 text-[#0b6b44]">
                    Última nota · {formatDate(featured.publishedAt, "long")}
                  </p>
                  <h2 className="t-h2 !text-3xl lg:!text-4xl group-hover:text-[#0b6b44]">
                    {featured.title}
                  </h2>
                  <p className="t-body mt-4 line-clamp-4 text-foreground/75">
                    {featured.excerpt}
                  </p>
                  <span className="t-small mt-6 inline-flex items-center gap-1.5 font-semibold text-[#0b6b44]">
                    Leer la nota <ArrowRight aria-hidden className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group glass-light flex flex-col overflow-hidden rounded-[20px] transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7a4f]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover saturate-[0.85] transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(18_17_14/0.35),transparent_60%)]" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="t-label mb-3 text-[#0b6b44]">
                      {formatDate(post.publishedAt, "long")}
                    </p>
                    <h2 className="t-h3 mb-3 group-hover:text-[#0b6b44]">
                      {post.title}
                    </h2>
                    <p className="t-small line-clamp-3 text-foreground/75">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
