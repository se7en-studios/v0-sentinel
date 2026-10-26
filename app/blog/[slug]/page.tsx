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
    <main className="min-h-screen bg-[#faf7f0]">
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

      <article className="relative pt-16">
        <div
          className="relative isolate w-full"
          style={{ height: "clamp(300px, 48vw, 520px)" }}
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover saturate-[0.8]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgb(232_115_42/0.18),transparent_50%,rgb(15_122_79/0.3))]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-charcoal/50" />
        </div>

        <div className="relative z-10 mx-auto -mt-24 max-w-3xl px-6 lg:px-10">
          <nav
            aria-label="Ruta de navegación"
            className="t-small mb-6 flex items-center gap-2 text-foreground/70"
          >
            <Link
              href="/"
              className="transition-colors hover:text-[#0f7a4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
            >
              Inicio
            </Link>
            <span aria-hidden>/</span>
            <Link
              href="/blog"
              className="transition-colors hover:text-[#0f7a4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
            >
              Blog
            </Link>
            <span aria-hidden>/</span>
            <span
              aria-current="page"
              className="max-w-[180px] truncate text-foreground sm:max-w-xs"
            >
              {post.title}
            </span>
          </nav>

          <p className="t-label mb-4 text-[#0b6b44]">
            {formatDate(post.publishedAt, "long")} · {minutes} min de lectura
          </p>

          <h1 className="t-h2 mb-12">{post.title}</h1>

          <div className="space-y-10 pb-20">
            {post.body.map((block, i) => (
              <div key={i}>
                {block.heading && (
                  <h2 className="t-h3 mb-4 !text-2xl">{block.heading}</h2>
                )}
                {block.paragraphs.map((p, j) => (
                  <p key={j} className="t-body mb-4 text-foreground/85 sm:text-[1.0625rem]">
                    {p}
                  </p>
                ))}
                {i === 0 && (
                  <blockquote className="glass-light my-8 rounded-[20px] border-l-4 !border-l-[#0f7a4f] px-6 py-6">
                    <p className="t-h3 !text-2xl leading-snug sm:!text-3xl">
                      {post.pullQuote}
                    </p>
                  </blockquote>
                )}
              </div>
            ))}
          </div>

          <Link
            href={post.relatedLink.href}
            className="t-small mb-16 inline-flex items-center gap-2 font-semibold text-[#0b6b44] transition-colors hover:text-[#09593a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7a4f]"
          >
            {post.relatedLink.label}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>

          <div className="relative isolate mb-20 overflow-hidden rounded-[20px] bg-charcoal p-8 text-center text-[#f4efe2] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] md:p-10">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgb(15_122_79/0.5),transparent_70%)]"
            />
            <p className="t-h3 mb-6">¿Querés monitoreo continuo en tu territorio?</p>
            <Link
              href="/#contacto"
              className="glow-leaf inline-flex min-h-12 items-center gap-2 rounded-full bg-leaf-bright px-7 text-base font-semibold text-charcoal transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Solicitar una reunión
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          {related.length > 0 && (
            <div className="pb-24">
              <p className="t-label mb-6 text-[#0b6b44]">Seguí leyendo</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group glass-light rounded-[20px] p-6 transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7a4f]"
                  >
                    <p className="t-h3 mb-2 !text-lg group-hover:text-[#0b6b44]">
                      {r.title}
                    </p>
                    <p className="t-small text-foreground/75">{r.excerpt}</p>
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
