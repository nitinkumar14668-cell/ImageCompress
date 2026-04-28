import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free Image Resizer & Compressor | Web Tools",
  description: "Easily compress or resize images online for free without losing quality.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="google-site-verification" content="jjtd4Eq99eqP9iKp-hCY07dUMf_HG93dv0njHwEZ6lU" />
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <div className="flex-grow">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
