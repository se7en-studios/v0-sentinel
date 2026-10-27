import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";

// Fecha fija (no new Date()): subirla a mano cuando cambie el contenido de estas páginas.
const SITE_UPDATED = "2026-10-26";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.sentineltech.com.ar";

  return [
    {
      url: baseUrl,
      lastModified: new Date(SITE_UPDATED),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(SITE_UPDATED),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/metodologia`,
      lastModified: new Date(SITE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/creditos`,
      lastModified: new Date(SITE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(SITE_UPDATED),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
