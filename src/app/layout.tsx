import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { MobileNav } from "@/components/organisms/MobileNav";
import { DeviceListener } from "@/components/atoms/DeviceListener";
import { PWAInstallPrompt } from "@/components/molecules/PWAInstallPrompt";
import { LiveActivityToast } from "@/components/molecules/LiveActivityToast";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const otfitsGrotesk = localFont({
  src: [
    {
      path: "../../public/fonts/OtfitsGrotesk-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/OtfitsGrotesk-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/OtfitsGrotesk-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Otfits Grotesk Var-VF.ttf",
      style: "normal",
    },
  ],
  variable: "--font-otfits-grotesk",
});

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${otfitsGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 font-sans">
        <AuthSessionProvider>
          <DeviceListener />
          <Navbar />
          <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
          <PWAInstallPrompt />
          <LiveActivityToast />
          <MobileNav />
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
