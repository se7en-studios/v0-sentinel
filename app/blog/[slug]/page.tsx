import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { blogPosts, getBlogPost, type BlogPost } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

const siteUrl = "https://www.sentineltech.com.ar";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function readingTime(post: BlogPost): number {
  const words = post.body
    .flatMap((b) => b.paragraphs)
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: `${siteUrl}${post.coverImage}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${siteUrl}${post.coverImage}`],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${siteUrl}${post.coverImage}`,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "Sentinel Technologies" },
    publisher: { "@type": "Organization", name: "Sentinel Technologies" },
    mainEntityOfPage: url,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);
  const minutes = readingTime(post);

  return (
    <main className="a-root min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ScrollProgress />
      <Navbar />

      <article className="relative pt-32 lg:pt-36">
        <div
          className="relative w-full"
          style={{ height: "clamp(260px, 45vw, 480px)" }}
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "brightness(0.85) saturate(0.9)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1310] via-[#0c1310]/70 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto px-6 lg:px-10 -mt-16 relative z-10">
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 mb-6 text-xs"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#9fb5a7",
            }}
          >
            <Link href="/" className="hover:text-a-accent transition-colors">
              Inicio
            </Link>
            <span className="text-xs opacity-40">/</span>
            <Link
              href="/blog"
              className="hover:text-a-accent transition-colors"
            >
              Blog
            </Link>
            <span className="text-xs opacity-40">/</span>
            <span
              className="truncate max-w-[180px] sm:max-w-xs font-light"
              style={{ color: "#e3f6dc" }}
            >
              {post.title}
            </span>
          </nav>

          <p
            className="text-xs mb-4"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#9fb5a7",
            }}
          >
            {formatDate(post.publishedAt, "long")}
            {" · "}
            {minutes} min de lectura
          </p>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl mb-12"
            style={{
              fontFamily: "var(--font-geist)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#e3f6dc",
              lineHeight: 1.12,
            }}
          >
            {post.title}
          </h1>

          <div className="space-y-10 pb-20">
            {post.body.map((block, i) => (
              <div key={i}>
                {block.heading && (
                  <h2
                    className="text-xl sm:text-2xl mb-4 font-semibold"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "#e3f6dc",
                    }}
                  >
                    {block.heading}
                  </h2>
                )}
                {block.paragraphs.map((p, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed mb-4"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      color: "#b9cdc0",
                    }}
                  >
                    {p}
                  </p>
                ))}
                {i === 0 && (
                  <blockquote
                    className="my-6 pl-6 py-2 rounded-r-lg"
                    style={{
                      borderLeft: "2px solid #a9efc9",
                      background: "#16211b",
                    }}
                  >
                    <p
                      className="text-xl sm:text-2xl leading-snug font-medium italic"
                      style={{
                        fontFamily: "var(--font-heading)",
                        color: "#e3f6dc",
                      }}
                    >
                      {post.pullQuote}
                    </p>
                  </blockquote>
                )}
              </div>
            ))}
          </div>

          <Link
            href={post.relatedLink.href}
            className="inline-flex items-center gap-2 mb-16 text-[13px] font-normal transition-colors hover:text-white"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#a9efc9",
            }}
          >
            {post.relatedLink.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div
            className="rounded-lg p-8 mb-20 text-center"
            style={{
              background: "#16211b",
              border: "1px solid rgba(214,245,201,0.11)",
            }}
          >
            <p
              className="text-lg mb-5 font-semibold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "#e3f6dc",
              }}
            >
              ¿Querés monitoreo continuo en tu territorio?
            </p>
            <a
              href="/#contacto"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-sm text-[13px] font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-sans)",
                background: "#a9efc9",
                border: "1px solid #a9efc9",
                color: "#06150d",
              }}
            >
              Solicitar una reunión
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {related.length > 0 && (
            <div className="pb-24">
              <p
                className="text-xs tracking-[0.25em] uppercase mb-6"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "#6f8577",
                }}
              >
                Seguí leyendo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "#16211b",
                      border: "1px solid rgba(214,245,201,0.11)",
                    }}
                  >
                    <p
                      className="text-[14px] mb-2"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        color: "#e3f6dc",
                      }}
                    >
                      {r.title}
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 400,
                        color: "#9fb5a7",
                      }}
                    >
                      {r.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </main>
  );
}
