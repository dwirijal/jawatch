import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CssBaseline } from "@/components/atoms/CssBaseline";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { ClientShell } from "@/components/organisms/ClientShell";
import { CommandBar } from "@/components/organisms/CommandBar";
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
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <CssBaseline />
      </head>
      <body className="min-h-full flex flex-col text-foreground font-sans">
        <ClientShell />
        <CommandBar />
        <Navbar />
        <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
