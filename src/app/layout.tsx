import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { CssBaseline } from "@/components/atoms/CssBaseline";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { MobileNav } from "@/components/organisms/MobileNav";
import { AdNetworkScripts } from "@/components/organisms/AdNetworkScripts";
import { DeviceListener } from "@/components/atoms/DeviceListener";
import { NoSsr } from "@/components/atoms/NoSsr";
import { PWAInstallPrompt } from "@/components/molecules/PWAInstallPrompt";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { getServerAuthStatus } from "@/lib/server/auth-session";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    default: "dwizzyWEEB - Premium Discovery",
    template: "%s | dwizzyWEEB"
  },
  description: "High-performance platform for Anime, Manga, Donghua and Movies discovery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "dwizzyWEEB",
  },
  openGraph: {
    type: "website",
    siteName: "dwizzyWEEB",
    title: "dwizzyWEEB - Premium Discovery",
    description: "Stream your favorite Anime, Manga, and Movies in high definition.",
    images: ["/favicon.ico"],
  },
  twitter: {
    card: "summary_large_image",
    title: "dwizzyWEEB - Premium Discovery",
    description: "Stream your favorite Anime, Manga, and Movies in high definition.",
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
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${bricolageGrotesque.variable} h-full antialiased`}
    >
      <head>
        <CssBaseline />
      </head>
      <body className="min-h-full flex flex-col text-foreground font-sans">
        <AuthSessionProvider initialState={authSession}>
          <AdNetworkScripts />
          <DeviceListener />
          <Navbar />
          <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
          <NoSsr>
            <PWAInstallPrompt />
          </NoSsr>
          <Analytics />
          <MobileNav />
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
