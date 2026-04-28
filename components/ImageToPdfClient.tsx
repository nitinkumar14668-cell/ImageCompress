"use client";

import React, { useState } from "react";
import { UploadCloud, FileDown, Plus } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ImageToPdfClient() {
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const urls = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...urls]);
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    
    // Default to A4 format
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < images.length; i++) {
      if (i > 0) doc.addPage();
      
      const imgProps = await getImageProperties(images[i]);
      const imgRatio = imgProps.width / imgProps.height;
      const pageRatio = pageWidth / pageHeight;

      let finalWidth = pageWidth;
      let finalHeight = pageHeight;

      if (imgRatio > pageRatio) {
        finalHeight = pageWidth / imgRatio;
      } else {
        finalWidth = pageHeight * imgRatio;
      }

      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      doc.addImage(images[i], "JPEG", x, y, finalWidth, finalHeight);
    }

    doc.save("converted.pdf");
  };

  const getImageProperties = (url: string): Promise<{width: number; height: number}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = url;
    });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image to PDF</h1>
        <p className="text-slate-500 mb-8">Convert one or multiple images to a PDF document.</p>

        <div className="mb-8">
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors w-full h-48">
            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
            <span className="font-semibold text-slate-700">Add Images</span>
            <span className="text-sm text-slate-500 mt-1">Select multiple images to combine</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {images.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img src={src} className="object-cover w-full h-full" alt={`Page ${i+1}`} />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                    {i + 1}
                  </div>
                  <button 
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={generatePDF}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={() => setImages([])}
                className="text-slate-500 font-medium hover:text-slate-700"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <section className="max-w-4xl mx-auto w-full mt-16 text-slate-700 leading-relaxed space-y-12 bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Transform Images to PDF Securely and Quickly
          </h2>
          <p className="mb-4">
            Need to combine multiple receipts, ID cards, or scanned graphics into a single document? Our <strong>Image to PDF converter</strong> is here to help. Consolidate your JPG, PNG, and WebP files into a versatile, universally accessible PDF format directly from your browser.
          </p>
          <p className="mb-4">
            PDFs are the gold standard for sharing documents securely across different platforms, guaranteeing that your recipients see the document exactly as you intended, regardless of the device they use.
          </p>
        </div>

        <div>
           <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
             How to Convert Images to PDF Effectively
           </h3>
           <ul className="list-disc pl-6 space-y-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <li>
               <strong className="text-slate-900">Batch Processing:</strong> Upload multiple images at once to merge them into one seamless multi-page PDF document.
             </li>
             <li>
               <strong className="text-slate-900">Smart Sizing:</strong> Images are automatically centered and dimensionally scaled to fit onto standard A4 page dimensions flawlessly.
             </li>
             <li>
               <strong className="text-slate-900">Zero Server Uploads:</strong> Because the PDF generation occurs entirely within your own web browser utilizing Client-Side logic, your highly sensitive documents remain exclusively yours.
             </li>
           </ul>
        </div>
      </section>
    </div>
    </>
  );
}
