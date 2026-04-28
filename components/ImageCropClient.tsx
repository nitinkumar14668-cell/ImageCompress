"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Crop as CropIcon, Download } from "lucide-react";
import dynamic from "next/dynamic";
const ReactCrop = dynamic(() => import("react-image-crop"), { ssr: false });
import "react-image-crop/dist/ReactCrop.css";
import type { Crop, PixelCrop } from "react-image-crop";

export default function ImageCropClient() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const generateCroppedImage = () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cropped-image.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image Crop Tool</h1>
        <p className="text-slate-500 mb-8">Quickly crop and extract parts of your images.</p>

        {!imageSrc ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors w-full h-64">
            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
            <span className="font-semibold text-slate-700">Upload Image to Crop</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6 max-w-full overflow-auto inline-block">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={handleCropComplete}
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-h-[60vh] object-contain block"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              <button
                onClick={generateCroppedImage}
                disabled={!completedCrop?.width || !completedCrop?.height}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Download Cropped Image
              </button>
              
              <button
                onClick={() => setImageSrc(null)}
                className="text-slate-500 font-medium hover:text-slate-700 border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50"
              >
                Cancel / New Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <section className="max-w-4xl mx-auto w-full mt-16 text-slate-700 leading-relaxed space-y-12 bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Free Online Image Cropper
          </h2>
          <p className="mb-4">
            Get the perfect framing every single time with our intuitive <strong>Image Cropping Tool</strong>. Whether you're trimming unwanted backgrounds, adjusting the aspect ratio for social media platforms like Instagram, Twitter, or LinkedIn, or highlighting the focal point of your photography, our browser-based utility gets it done fast.
          </p>
          <p className="mb-4">
            Crop your JPG, PNG, and WebP images locally with zero loss in resolution or quality. No more resorting to heavy desktop editing suites for simple and straightforward bounding-box adjustments.
          </p>
        </div>

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
               <strong className="text-slate-900">Rapid Performance:</strong> Everything runs locally on your machine, making the cropper highly responsive even with very large initial file sizes.
             </li>
           </ul>
        </div>
      </section>
    </div>
    </>
  );
}
