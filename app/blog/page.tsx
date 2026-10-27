import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { blogPosts } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

import { OG_IMAGE } from "@/lib/og";

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
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
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
        <section className="mx-auto max-w-5xl px-5 pb-28 pt-36 md:px-8 lg:pt-44">
          <h1 className="a-display-m a-load max-w-3xl">
            Ideas sobre monitoreo forestal e inteligencia territorial.
          </h1>

          <ul className="mt-16 divide-y divide-a-line border-y border-a-line">
            {posts.map((post, i) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-5 py-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent md:grid-cols-[16rem_1fr] md:gap-10"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-a-surface">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 256px"
                      priority={i === 0}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-a-mute">{formatDate(post.publishedAt, "long")}</p>
                    <h2 className="mt-2 text-2xl font-semibold leading-snug text-[#e3f6dc] transition-colors group-hover:text-a-accent">
                      {post.title}
                    </h2>
                    <p className="mt-3 line-clamp-2 max-w-2xl text-base leading-relaxed text-a-mute">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </>
  );
}
