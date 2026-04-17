import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CssBaseline } from "@/components/atoms/CssBaseline";
import { ColorModeScript } from "@/components/atoms/ColorModeScript";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { FooterContent } from "@/components/organisms/FooterContent";
import { ClientShell } from "@/components/organisms/ClientShell";
import { DeferredCommandBar } from "@/components/organisms/DeferredCommandBar";
import { AdNetworkScripts } from "@/components/organisms/AdNetworkScripts";
import { MainFrame } from "@/components/organisms/MainFrame";
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
  description: "Tempat nonton anime, donghua, drama, dan film serta baca komik bahasa Indonesia dalam satu katalog yang cepat dan rapi.",
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
    description: "Tempat nonton anime, donghua, drama, dan film serta baca komik bahasa Indonesia dalam satu katalog yang cepat dan rapi.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "jawatch - Anime, Donghua, Drama, Film, dan Komik",
    description: "Tempat nonton anime, donghua, drama, dan film serta baca komik bahasa Indonesia dalam satu katalog yang cepat dan rapi.",
    images: ["/logo.png"],
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
        <ClientShell />
        <AdNetworkScripts />
        <DeferredCommandBar />
        <Navbar />
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
