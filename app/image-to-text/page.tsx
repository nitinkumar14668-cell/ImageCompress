import { Metadata } from "next";
import dynamic from "next/dynamic";

const ImageToTextClient = dynamic(() => import("@/components/ImageToTextClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center text-slate-500">Loading tools...</div>
});

export const metadata: Metadata = {
  title: "Image to Text Converter (OCR) | Extract Text from Images Free",
  description: "Free online OCR tool to extract text from images securely. Convert JPG, PNG to Text instantly with our accurate Image to Text converter.",
  alternates: {
    canonical: "https://imageresizee.vercel.app/image-to-text",
  },
  openGraph: {
    title: "Image to Text Converter (OCR)",
    description: "Free online OCR tool to extract text from images securely.",
    url: "https://imageresizee.vercel.app/image-to-text",
    siteName: "Web Tools",
    locale: "en_US",
    type: "website",
  },
};

export default function ImageToTextPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Image to Text Converter",
    "url": "https://imageresizee.vercel.app/image-to-text",
    "description": "Free online OCR tool to extract text from images securely.",
    "applicationCategory": "UtilitiesApplication",
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
      <ImageToTextClient />
    </>
  );
}
