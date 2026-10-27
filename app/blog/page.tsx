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

      <main id="main-content" className="a-root min-h-screen">
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-28 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav
              aria-label="Ruta de navegación"
              className="flex items-center gap-2 mb-6 text-[12px]"
              style={{
                fontFamily: "var(--font-sans)",
                color: "#9fb5a7",
              }}
            >
              <Link href="/" className="hover:text-a-accent transition-colors">
                Inicio
              </Link>
              <span className="text-xs opacity-60">/</span>
              <span
                className="font-light"
                style={{ color: "#e3f6dc" }}
              >
                Blog
              </span>
            </nav>

            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{
                fontFamily: "var(--font-sans)",
                color: "#6f8577",
              }}
            >
              Artículos y Publicaciones
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl mb-16"
              style={{
                fontFamily: "var(--font-geist)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: "#e3f6dc",
                lineHeight: 1.05,
              }}
            >
              Ideas sobre{" "}
              monitoreo forestal e
              inteligencia territorial.
            </h1>

            {/* Featured — most recent post gets real weight instead of
                sitting in the grid as just another identical tile. */}
            {posts[0] && (
              <Link
                href={`/blog/${posts[0].slug}`}
                className="group grid sm:grid-cols-2 gap-6 sm:gap-10 items-center rounded-lg overflow-hidden mb-14 transition-all duration-300"
                style={{
                  background: "#16211b",
                  border: "1px solid rgba(214,245,201,0.11)",
                }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: "16/11" }}
                >
                  <Image
                    src={posts[0].coverImage}
                    alt={posts[0].title}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 sm:p-0 sm:pr-10">
                  <p
                    className="text-xs mb-3 font-normal"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "#a9efc9",
                    }}
                  >
                    Última nota · {formatDate(posts[0].publishedAt, "long")}
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl mb-4 leading-snug font-bold transition-colors duration-200 group-hover:text-a-accent"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "#e3f6dc",
                    }}
                  >
                    {posts[0].title}
                  </h2>
                  <p
                    className="text-[14px] leading-relaxed line-clamp-3"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      color: "#9fb5a7",
                    }}
                  >
                    {posts[0].excerpt}
                  </p>
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.slice(1).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(169,239,201,0.4)]"
                  style={{
                    background: "#16211b",
                    border: "1px solid rgba(214,245,201,0.11)",
                  }}
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p
                        className="text-xs mb-2 font-normal"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: "#a9efc9",
                        }}
                      >
                        {formatDate(post.publishedAt, "long")}
                      </p>
                      <h2
                        className="text-lg mb-3 leading-snug font-bold transition-colors duration-200 group-hover:text-a-accent"
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: "#e3f6dc",
                        }}
                      >
                        {post.title}
                      </h2>
                      <p
                        className="text-[13px] leading-relaxed line-clamp-3"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 400,
                          color: "#9fb5a7",
                        }}
                      >
                        {post.excerpt}
                      </p>
                    </div>
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
