import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const defaultImageRemoteHostPatterns = [
  "image.tmdb.org",
  "**.myanimelist.net",
  "cdn.anilist.co",
  "books.google.com",
  "covers.openlibrary.org",
  "**.googleusercontent.com",
  "m.media-amazon.com",
  "**.media-amazon.com",
  "iili.io",
  "ik.imagekit.io",
];

function readImageRemoteHostPatterns() {
  const configuredHosts = process.env.NEXT_IMAGE_ALLOWED_HOSTS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  return configuredHosts.length > 0 ? configuredHosts : defaultImageRemoteHostPatterns;
}

const imageRemoteHostPatterns = readImageRemoteHostPatterns();

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const legacyRedirects = [
  ['/anime', '/series/anime'],
  ['/anime/list', '/series/anime'],
  ['/anime/completed', '/series/list'],
  ['/anime/genres/:slug', '/series/genre/:slug'],
  ['/anime/episode/:slug', '/series/watch/:slug'],
  ['/anime/batch/:slug', '/series/:slug'],
  ['/anime/:slug', '/series/:slug'],
  ['/donghua', '/series/donghua'],
  ['/donghua/episode/:episodeSlug', '/series/watch/:episodeSlug'],
  ['/donghua/:slug', '/series/:slug'],
  ['/series/episode/:slug', '/series/watch/:slug'],
  ['/manga', '/comic/manga'],
  ['/manhwa', '/comic/manhwa'],
  ['/manhua', '/comic/manhua'],
  ['/manga/:slug/:chapter', '/comic/:slug/:chapter'],
  ['/manga/:slug', '/comic/:slug'],
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
  turbopack: {
    root: path.resolve(projectRoot),
    resolveAlias: {
      'animejs': 'animejs',
      'lucide-react': 'lucide-react',
    },
  },
  images: {
    remotePatterns: imageRemoteHostPatterns.map((hostname) => ({
      protocol: hostname === 'localhost' || hostname === '127.0.0.1' ? 'http' : 'https',
      hostname,
    })),
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default withPWA(nextConfig);
