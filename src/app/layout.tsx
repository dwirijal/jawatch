import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { CssBaseline } from "@/components/atoms/CssBaseline";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { ClientShell } from "@/components/organisms/ClientShell";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { getServerAuthStatus } from "@/lib/server/auth-session";
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
    default: "dwizzyWEEB - Anime, Donghua, Drama, Film, Komik, dan Novel",
    template: "%s | dwizzyWEEB"
  },
  description: "Tempat nonton anime, donghua, drama, film, baca komik, dan novel subtitle Indonesia dalam satu katalog yang cepat dan rapi.",
  applicationName: "dwizzyWEEB",
  keywords: [
    "anime subtitle indonesia",
    "donghua subtitle indonesia",
    "drama asia subtitle indonesia",
    "film subtitle indonesia",
    "komik indonesia",
    "novel online indonesia",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "dwizzyWEEB",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "dwizzyWEEB",
    title: "dwizzyWEEB - Anime, Donghua, Drama, Film, Komik, dan Novel",
    description: "Tempat nonton anime, donghua, drama, film, baca komik, dan novel subtitle Indonesia dalam satu katalog yang cepat dan rapi.",
    images: ["/favicon.ico"],
  },
  twitter: {
    card: "summary_large_image",
    title: "dwizzyWEEB - Anime, Donghua, Drama, Film, Komik, dan Novel",
    description: "Tempat nonton anime, donghua, drama, film, baca komik, dan novel subtitle Indonesia dalam satu katalog yang cepat dan rapi.",
    images: ["/favicon.ico"],
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = await getServerAuthStatus();

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
        <AuthSessionProvider initialState={authSession}>
          <ClientShell />
          <Navbar />
          <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
          <Analytics />
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
