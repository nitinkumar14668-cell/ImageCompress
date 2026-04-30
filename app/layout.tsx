import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://imageresizee.vercel.app'),
  title: "Free Image Resizer & Compressor | Web Tools",
  description: "Easily compress or resize images online for free without losing quality.",
  openGraph: {
    title: "Free Image Resizer & Compressor | Web Tools",
    description: "Easily compress or resize images online for free without losing quality.",
    url: 'https://imageresizee.vercel.app',
    siteName: 'ImageResizee',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://imageresizee.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="jjtd4Eq99eqP9iKp-hCY07dUMf_HG93dv0njHwEZ6lU" />
        <script src="https://quge5.com/88/tag.min.js" data-zone="234886" async data-cfasync="false"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:p-4 focus:bg-white focus:text-blue-600">
          Skip to main content
        </a>
        <div className="flex flex-col min-h-screen">
          <header>
            <Navigation />
          </header>
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-S2R20NE64Q"} />
      </body>
    </html>
  );
}
