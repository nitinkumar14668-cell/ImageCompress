"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";


export default function ImageToTextClient() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setText("");
    }
  };

  const extractText = async () => {
    if (!image) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      setText(result.data.text);
    } catch (error) {
      console.error(error);
      setText("Error extracting text.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image to Text (OCR)</h1>
        <p className="text-slate-500 mb-8">Extract text from your images instantly.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {!image ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors h-64">
                <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                <span className="font-semibold text-slate-700">Upload Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="flex flex-col gap-4">
                <img src={image} className="rounded-xl border border-slate-200 max-h-64 object-contain" alt="Upload" />
                <button
                  onClick={extractText}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  {isProcessing ? `Extracting... ${progress}%` : "Extract Text"}
                </button>
                <button
                  onClick={() => setImage(null)}
                  className="text-slate-500 text-sm hover:text-slate-700 underline"
                >
                  Choose another image
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="h-full min-h-[16rem] bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
              {text ? (
                <textarea
                  className="w-full h-full bg-transparent resize-none outline-none text-slate-700"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Extracted text will appear here..."
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm p-6 text-center">
                  Image text will be displayed here once extracted.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <section className="max-w-4xl mx-auto w-full mt-16 text-slate-700 leading-relaxed space-y-12 bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Free Online Image to Text Converter (OCR)
          </h2>
          <p className="mb-4">
            Our powerful <strong>Image to Text</strong> tool utilizes advanced Optical Character Recognition (OCR) technology to extract text from your photos seamlessly. Whether you&apos;re dealing with scanned documents, screenshots, whiteboards, or handwritten notes, our completely free browser-based utility converts images into editable digital text instantly.
          </p>
          <p className="mb-4">
            Instead of manually typing out long paragraphs from a picture, simply upload your image (JPEG, PNG, WebP) and let our state-of-the-art OCR engine do the heavy lifting in seconds.
          </p>
        </div>

        <div>
           <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
             Why Use Our OCR Tool?
           </h3>
           <ul className="list-disc pl-6 space-y-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <li>
               <strong className="text-slate-900">100% Privacy-Focused:</strong> All text extraction happens securely within your browser. You don't need to permanently store your sensitive documents on our servers.
             </li>
             <li>
               <strong className="text-slate-900">High Accuracy:</strong> Powered by highly intelligent OCR algorithms, capable of recognizing a wide array of fonts and layouts efficiently.
             </li>
             <li>
               <strong className="text-slate-900">Time-Saving:</strong> Eliminate tedious duplicate data entry for receipts, digital invoices, book pages, and graphical infographics.
             </li>
           </ul>
        </div>
      </section>
    </div>
    </>
  );
}
