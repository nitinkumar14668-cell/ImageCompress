import { Metadata } from "next";
import ImageCropClient from "@/components/ImageCropClient";
import Image from "next/image";

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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col p-4 md:p-8 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto w-full mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <Image
          src="/hero-crop.svg"
          alt="Image Cropping"
          width={800}
          height={400}
          priority={true}
          className="w-full h-auto mt-0"
        />
      </div>

      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image Crop Tool</h1>
        <p className="text-slate-500 mb-8">Quickly crop and extract parts of your images right in your browser.</p>
        <ImageCropClient />
      </div>

      {/* SEO Section SSR */}
      <section className="max-w-4xl mx-auto w-full mt-16 text-slate-700 leading-relaxed space-y-12 bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Free Online Image Cropper
          </h2>
          <p className="mb-4">
            Get the perfect framing every single time with our intuitive <strong>Image Cropping Tool</strong>. Whether you're trimming unwanted backgrounds, adjusting the aspect ratio for social media platforms like Instagram, Twitter, Facebook, Pinterest, or LinkedIn, or highlighting the focal point of your photography, our browser-based utility gets it done fast.
          </p>
          <p className="mb-4">
            Crop your JPG, PNG, GIF, BMP, and WebP images locally with zero loss in resolution or quality. No more resorting to heavy desktop editing suites like Photoshop for simple and straightforward bounding-box adjustments. Enhance your visual content effortlessly and right within your web browser, preserving perfect quality without any learning curve.
          </p>
          <p className="mb-4">
            Our tool was built to save you time. Photographers, designers, and social media managers rely on sharp, well-composed visuals to tell their stories. By cutting out the clutter and focusing on the core subject, a simple image crop can dramatically boost engagement metrics across the board. No watermarks, no upload wait times, and absolutely no premium subscriptions required.
          </p>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
            How to Crop an Image Online
          </h3>
          <ol className="list-decimal pl-6 space-y-4 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <li>
              <strong className="text-slate-900">Upload your photo:</strong> Click the upload area or simply drag and drop your image file (JPG, PNG, WebP) directly into the tool. Wait less than a second for the local preview to render.
            </li>
            <li>
              <strong className="text-slate-900">Adjust the crop box:</strong> Click and drag the handles on the interactive image preview to define the exact area you want to keep. You can easily adjust the framing, try out different aspect ratios, and fine-tune exactly which pixels remain until it is completely perfect.
            </li>
            <li>
              <strong className="text-slate-900">Preview and download:</strong> Once you are fully satisfied with your selection, click the big Download button below the editor to instantly save your newly cropped image directly to your local device.
            </li>
          </ol>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
             <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
               Why Crop Your Images With Us?
             </h3>
             <ul className="list-disc pl-6 space-y-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <li>
                 <strong className="text-slate-900">Pixel-Perfect Precision:</strong> Drag and drop the cropping handles onto your canvas to easily select the exact pixels you wish to retain.
               </li>
               <li>
                 <strong className="text-slate-900">Optimized for Web & Social:</strong> Quickly frame your pictures to conform to common aspect profiles perfectly without any stretching or visual distortion.
               </li>
               <li>
                 <strong className="text-slate-900">Rapid Performance:</strong> Everything runs locally on your machine, making the cropper highly responsive even with very large initial file sizes, saving you bandwidth.
               </li>
               <li>
                 <strong className="text-slate-900">100% Privacy Secure:</strong> We value your privacy above everything else. All processing happens entirely within your web browser, ensuring your private photos are never uploaded to our servers, keeping them completely confidential.
               </li>
             </ul>
          </div>

          <div>
             <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
               Frequently Asked Questions
             </h3>
             <div className="space-y-4">
               <div>
                  <h4 className="font-semibold text-slate-900">Does cropping reduce image quality?</h4>
                  <p className="text-sm">Cropping simply removes the unwanted outer areas of your image. The area you keep retains its original visual fidelity and resolution, unlike resizing which alters the pixel dimensions and sometimes causes blurriness.</p>
               </div>
               <div>
                  <h4 className="font-semibold text-slate-900">What image formats are supported?</h4>
                  <p className="text-sm">Our tool supports all standard modern web image formats, including JPEG (JPG), PNG, and WebP, ensuring maximum compatibility with whatever your workflow demands.</p>
               </div>
               <div>
                  <h4 className="font-semibold text-slate-900">Can I crop images on my phone?</h4>
                  <p className="text-sm">Yes! Our online image cropper is fully responsive and carefully optimized specifically for mobile devices, touch screens, and tablets, allowing you to edit your photos seamlessly on the go.</p>
               </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
