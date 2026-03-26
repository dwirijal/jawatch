import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 2,
      },
    ],
    sitemap: `${SITE_URL}sitemap.xml`,
    host: SITE_URL.toString(),
  };
}
