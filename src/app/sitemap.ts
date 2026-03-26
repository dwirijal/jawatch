import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const lastModified = new Date("2026-03-22T03:41:11Z");

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/anime", priority: 0.9, changeFrequency: "hourly" },
  { path: "/anime/completed", priority: 0.8, changeFrequency: "daily" },
  { path: "/anime/list", priority: 0.7, changeFrequency: "weekly" },
  { path: "/donghua", priority: 0.9, changeFrequency: "hourly" },
  { path: "/manga", priority: 0.9, changeFrequency: "daily" },
  { path: "/manhwa", priority: 0.9, changeFrequency: "daily" },
  { path: "/manhua", priority: 0.9, changeFrequency: "daily" },
  { path: "/movies", priority: 0.9, changeFrequency: "daily" },
  { path: "/collection", priority: 0.6, changeFrequency: "weekly" },
] as const satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  }));
}
