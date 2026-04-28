import { Metadata } from "next";
import dynamic from "next/dynamic";

const ImageCropClient = dynamic(() => import("@/components/ImageCropClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center text-slate-500">Loading tools...</div>
});

export const metadata: Metadata = {
  title: "Image Crop Tool | Free Online Photo Cropper",
  description: "Crop your images online instantly. Free, secure, client-side photo cropper for web and social media.",
  alternates: {
    canonical: "https://imageresizee.vercel.app/image-crop",
  },
  openGraph: {
    title: "Image Crop Tool",
    description: "Crop your images online instantly.",
    url: "https://imageresizee.vercel.app/image-crop",
    siteName: "Web Tools",
    locale: "en_US",
    type: "website",
  },
};

export default function ImageCropPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Image Crop Tool",
    "url": "https://imageresizee.vercel.app/image-crop",
    "description": "Crop your images online instantly.",
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
      <ImageCropClient />
    </>
  );
}
