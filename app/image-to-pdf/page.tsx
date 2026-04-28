import { Metadata } from "next";
import dynamic from "next/dynamic";

const ImageToPdfClient = dynamic(() => import("@/components/ImageToPdfClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center text-slate-500">Loading tools...</div>
});

export const metadata: Metadata = {
  title: "Image to PDF Converter | Convert JPG to PDF Online Free",
  description: "Convert your images to a single PDF document easily. Fast, free, and secure client-side Image to PDF converter.",
  alternates: {
    canonical: "https://imageresizee.vercel.app/image-to-pdf",
  },
  openGraph: {
    title: "Image to PDF Converter",
    description: "Convert your images to a single PDF document easily.",
    url: "https://imageresizee.vercel.app/image-to-pdf",
    siteName: "Web Tools",
    locale: "en_US",
    type: "website",
  },
};

export default function ImageToPdfPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Image to PDF Converter",
    "url": "https://imageresizee.vercel.app/image-to-pdf",
    "description": "Convert your images to a single PDF document easily.",
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
      <ImageToPdfClient />
    </>
  );
}
