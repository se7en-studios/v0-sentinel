import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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
    <main className="min-h-screen bg-paper text-ink">
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

      <article className="mx-auto max-w-3xl px-6 pb-20 pt-32 md:pt-40 lg:px-10">
        <nav
          aria-label="Ruta de navegación"
          className="t-small mb-8 flex items-center gap-2 text-ink/70"
        >
          <Link
            href="/"
            className={`underline-offset-4 hover:underline ${focus}`}
          >
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link
            href="/blog"
            className={`underline-offset-4 hover:underline ${focus}`}
          >
            Blog
          </Link>
        </nav>

        <h1 className="t-display !text-4xl md:!text-6xl">{post.title}</h1>
        <p className="t-caption mt-5">
          {formatDate(post.publishedAt, "long")} · {minutes} min de lectura
        </p>

        <figure className="mt-10">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={900}
            height={600}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full"
          />
        </figure>

        <div className="mt-12 space-y-10">
          {post.body.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h2 className="t-h2 mb-4 !text-3xl">{block.heading}</h2>
              )}
              {block.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className="t-body mb-4 text-ink/85 sm:text-[1.0625rem]"
                >
                  {p}
                </p>
              ))}
              {i === 0 && (
                <blockquote className="my-10 border-l-2 border-brand pl-6">
                  <p className="t-quote">{post.pullQuote}</p>
                </blockquote>
              )}
            </div>
          ))}
        </div>

        <p className="mt-12">
          <Link
            href={post.relatedLink.href}
            className={`t-body font-semibold text-brand underline underline-offset-4 ${focus}`}
          >
            {post.relatedLink.label}
          </Link>
        </p>

        <div className="mt-16 border-t rule pt-8">
          <p className="t-h3">¿Querés monitoreo continuo en tu territorio?</p>
          <p className="t-body mt-2 text-ink/80">
            Contanos qué zona cuidás y vemos si un piloto tiene sentido.
          </p>
          <Link
            href="/#contacto"
            className="mt-5 inline-flex min-h-12 items-center rounded-sm bg-brand px-7 text-base font-semibold text-paper transition hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Solicitar una reunión
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="t-h3 mb-4">Seguí leyendo</h2>
            <ul className="border-b rule">
              {related.map((r) => (
                <li key={r.slug} className="border-t rule">
                  <Link
                    href={`/blog/${r.slug}`}
                    className={`group block py-5 ${focus}`}
                  >
                    <p className="font-serif text-xl leading-snug group-hover:underline group-hover:underline-offset-4">
                      {r.title}
                    </p>
                    <p className="t-small mt-1 text-ink/75">{r.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      <Footer />
    </main>
  );
}
