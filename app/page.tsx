import { Metadata } from "next";
import ResizerClient from "@/components/ResizerClient";

export const metadata: Metadata = {
  title: "Free Image Resizer & Compressor | Shrink, Resize, Optimize Photos Fast",
  description: "Easily compress or resize images online for free without losing quality. Optimize JPG, PNG and WebP files locally with 100% privacy safely in your browser.",
  alternates: {
    canonical: "https://imageresizee.vercel.app/",
  },
  openGraph: {
    title: "Free Image Resizer & Compressor",
    description: "Easily compress or resize images online for free without losing quality.",
    url: "https://imageresizee.vercel.app/",
    siteName: "Web Tools",
    locale: "en_US",
    type: "website",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Image Resizer",
    "url": "https://imageresizee.vercel.app/",
    "description": "Easily compress or resize images online for free without losing quality.",
    "applicationCategory": "MultimediaApplication",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ResizerClient />
    </>
  );
}
