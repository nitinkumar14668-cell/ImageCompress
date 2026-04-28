"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Crop as CropIcon, Download } from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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
        {!imageSrc ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors w-full h-64">
            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" aria-hidden="true" />
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
                <Download className="w-5 h-5" aria-hidden="true" />
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
    </>
  );
}
