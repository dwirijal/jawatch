import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CssBaseline } from "@/components/atoms/CssBaseline";
import { ColorModeScript } from "@/components/atoms/ColorModeScript";
import { JsonLd } from "@/components/atoms/JsonLd";
import { Footer } from "@/components/organisms/Footer";
import { FooterContent } from "@/components/organisms/FooterContent";
import { AdNetworkScripts } from "@/components/organisms/AdNetworkScripts";
import { ClientShell } from "@/components/organisms/ClientShell";
import { MainFrame } from "@/components/organisms/MainFrame";
import { JAWATCH_MARKETING } from "@/lib/marketing";
import { buildOrganizationJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "jawatch - Anime, Donghua, Drama, Film, dan Komik",
    template: "%s | jawatch"
  },
  description: "Nonton anime, donghua, drama Asia, dan film subtitle Indonesia, plus baca manga, manhwa, dan manhua bahasa Indonesia dalam satu katalog cepat.",
  applicationName: "jawatch",
  keywords: [
    "anime subtitle indonesia",
    "donghua subtitle indonesia",
    "drama asia subtitle indonesia",
    "film subtitle indonesia",
    "komik indonesia",
    "baca komik indonesia",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/jawatch-logo.svg", type: "image/svg+xml" }],
    shortcut: ["/jawatch-logo.svg"],
    apple: [{ url: "/jawatch-logo.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "jawatch",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "jawatch",
    title: "jawatch - Anime, Donghua, Drama, Film, dan Komik",
    description: "Nonton anime, donghua, drama Asia, dan film subtitle Indonesia, plus baca manga, manhwa, dan manhua bahasa Indonesia dalam satu katalog cepat.",
    images: [{
      url: JAWATCH_MARKETING.share.defaultImage,
      width: 1200,
      height: 630,
      alt: JAWATCH_MARKETING.share.defaultImageAlt,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "jawatch - Anime, Donghua, Drama, Film, dan Komik",
    description: "Nonton anime, donghua, drama Asia, dan film subtitle Indonesia, plus baca manga, manhwa, dan manhua bahasa Indonesia dalam satu katalog cepat.",
    images: [JAWATCH_MARKETING.share.defaultImage],
  },
  other: {
    "google-adsense-account": "ca-pub-8868090753979495",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistMono.variable} ${plusJakartaSans.variable} ${bricolageGrotesque.variable} h-full antialiased`}
    >
      <head>
        <ColorModeScript />
        <CssBaseline />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AdNetworkScripts />
        <ClientShell />
        <JsonLd data={buildOrganizationJsonLd()} />
        <MainFrame>
          {children}
        </MainFrame>
        <Footer>
          <FooterContent />
        </Footer>
      </body>
    </html>
  );
}
