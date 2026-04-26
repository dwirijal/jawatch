import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const projectRoot = realpathSync(fileURLToPath(new URL(".", import.meta.url)));
const tailwindCssEntry = fileURLToPath(new URL("./node_modules/tailwindcss/index.css", import.meta.url));
const defaultImageRemoteHostPatterns = [
  "image.tmdb.org",
  "myanimelist.net",
  "cdn.myanimelist.net",
  "cdn.anilist.co",
  "books.google.com",
  "covers.openlibrary.org",
  "lh3.googleusercontent.com",
  "m.media-amazon.com",
  "iili.io",
  "ik.imagekit.io",
  "anichin.cafe",
  "convert.d-cdn.me",
  "hanime-cdn.com",
  "nekopoi.care",
  "bacaman00.sokuja.id",
  "kacu.gmbr.pro",
  "kanzenin.info",
  "mangasusuku.com",
  "i0.wp.com",
  "i1.wp.com",
  "i2.wp.com",
  "i3.wp.com",
  "images.envira-cdn.com",
  "v2.samehadaku.how",
  "02.ikiru.wtf",
  "komikcast03.com",
  "poster.janzhoutec.com",
  "zshipubcdn.farsunpteltd.com",
  "kreisnow.web.id",
  "f005.backblazeb2.com",
  "thumbnail.komiku.org",
  "rebahinxxi.b-cdn.net",
  "www.manhwaindo.my",
  "static-v1.mydramawave.com",
  "imgcdn.dev",
  "v4.kiryuu.to",
  "komiku.org",
  "www.komiku.org",
];

function readImageRemoteHostPatterns() {
  const configuredHosts = process.env.NEXT_IMAGE_ALLOWED_HOSTS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  return configuredHosts.length > 0 ? configuredHosts : defaultImageRemoteHostPatterns;
}

const imageRemoteHostPatterns = readImageRemoteHostPatterns();

const pwaEnabled = process.env.ENABLE_PWA === "1";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: !pwaEnabled,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.googleadservices.com https://www.google.com https://www.gstatic.com https://va.vercel-scripts.com https://vercel.live https://analytics.ahrefs.com https://a.magsrv.com https://*.magsrv.com",
      "connect-src 'self' https: ws: wss: *.ingest.sentry.io *.ingest.us.sentry.io",
      "frame-src 'self' https:",
      "media-src 'self' data: blob: https:",
      "worker-src 'self' blob:",
    ].join('; '),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      'animejs': 'animejs',
      'lucide-react': 'lucide-react',
      'tailwindcss': tailwindCssEntry,
    },
  },
  images: {
    qualities: [70, 72, 75, 78, 82],
    localPatterns: [
      {
        pathname: '/api/comic/image',
      },
    ],
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

export default withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  tunnelRoute: "/monitoring",
});
