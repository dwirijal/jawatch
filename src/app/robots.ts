import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/search",
          "/login",
          "/signup",
          "/forgot-password",
          "/auth",
          "/onboarding",
          "/vault",
          "/admin",
        ],
        crawlDelay: 2,
      },
    ],
    sitemap: `${SITE_URL.toString()}sitemap.xml`,
    host: SITE_URL.host,
  };
}
