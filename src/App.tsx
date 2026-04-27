import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Download, Settings2, RefreshCw, X } from 'lucide-react';

type FileFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageMeta {
  url: string;
  name: string;
  size: number; // bytes
  width: number;
  height: number;
  type: string;
}

interface ProcessedImage {
  url: string;
  size: number;
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageMeta | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<FileFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.8);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Aspect ratio reference
  const aspectRatio = useRef<number>(1);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage.url);
      if (processedImage) URL.revokeObjectURL(processedImage.url);
    };
  }, [originalImage, processedImage]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const meta: ImageMeta = {
        url,
        name: file.name,
        size: file.size,
        width: img.width,
        height: img.height,
        type: file.type,
      };
      
      aspectRatio.current = img.width / img.height;
      
      setOriginalImage(meta);
      setWidth(img.width);
      setHeight(img.height);
      setFormat((file.type as FileFormat) || 'image/jpeg');
      setQuality(0.8);
      setProcessedImage(null);
    };
    img.src = url;
  };

  const onFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (keepAspectRatio && aspectRatio.current) {
      setHeight(Math.round(val / aspectRatio.current));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (keepAspectRatio && aspectRatio.current) {
      setWidth(Math.round(val * aspectRatio.current));
    }
  };

  const processImage = async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not supported.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob.'));
            },
            format,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image for processing.'));
        img.src = originalImage.url;
      });

      const processedUrl = URL.createObjectURL(blob);
      if (processedImage) URL.revokeObjectURL(processedImage.url);
      
      setProcessedImage({
        url: processedUrl,
        size: blob.size,
      });
    } catch (error) {
      console.error(error);
      alert('Error processing image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Debounced auto-processing when settings change
  useEffect(() => {
    if (!originalImage) return;
    const timer = setTimeout(() => {
      processImage();
    }, 500);
    return () => clearTimeout(timer);
  }, [width, height, format, quality, originalImage]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetAll = () => {
    if (originalImage) URL.revokeObjectURL(originalImage.url);
    if (processedImage) URL.revokeObjectURL(processedImage.url);
    setOriginalImage(null);
    setProcessedImage(null);
  };

  const getSavingsPercentage = () => {
    if (!originalImage || !processedImage) return 0;
    const saving = ((originalImage.size - processedImage.size) / originalImage.size) * 100;
    return saving > 0 ? saving.toFixed(1) : 0;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 py-5 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ImResizer</h1>
          </div>
          {originalImage && (
            <button
              onClick={resetAll}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        {!originalImage ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-3 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all bg-white min-h-[60vh] ${
              isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className={`p-5 rounded-full mb-6 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              <UploadCloud className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-slate-900">Upload your image</h2>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Drag and drop your image here, or click to browse. We support JPEG, PNG, and WebP up to high resolutions.
            </p>
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-medium cursor-pointer shadow-md hover:shadow-lg transition-all focus-within:ring-4 focus-within:ring-indigo-100">
              Select Image
              <input type="file" className="hidden" accept="image/*" onChange={onFileUpload} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Visuals Column */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-slate-800">Preview</h3>
                  {isProcessing && (
                    <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
                
                <div className="relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden min-h-[40vh] border-dashed flex items-center justify-center p-4">
                  <img
                    src={processedImage ? processedImage.url : originalImage.url}
                    alt="Preview"
                    className="max-w-full max-h-[60vh] object-contain rounded drop-shadow-sm transition-opacity duration-300 ease-in-out"
                    style={{ opacity: isProcessing ? 0.5 : 1 }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {/* Original Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Original</p>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 text-lg">{formatBytes(originalImage.size)}</p>
                      <p className="text-sm text-slate-500">{originalImage.width} × {originalImage.height} px</p>
                    </div>
                  </div>

                  {/* Processed Info */}
                  <div className={`p-4 rounded-2xl border ${processedImage && processedImage.size < originalImage.size ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output</p>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 text-lg">
                        {processedImage ? formatBytes(processedImage.size) : '--'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {width} × {height} px
                      </p>
                    </div>
                    {processedImage && processedImage.size < originalImage.size && (
                      <p className="text-xs font-medium text-emerald-600 mt-2 bg-emerald-100/50 inline-block px-2 py-0.5 rounded-full">
                        {getSavingsPercentage()}% smaller
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Column */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-28">
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-lg text-slate-800">Resize Settings</h3>
                </div>

                <div className="space-y-6">
                  {/* Dimensions */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Dimensions (px)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={width || ''}
                            onChange={(e) => handleWidthChange(Number(e.target.value))}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            placeholder="Width"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">W</span>
                        </div>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={height || ''}
                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            placeholder="Height"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">H</span>
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={keepAspectRatio}
                          onChange={(e) => setKeepAspectRatio(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-colors">
                          <X className={`w-3 h-3 text-white transition-opacity ${keepAspectRatio ? 'opacity-100' : 'opacity-0'}`} style={{ strokeWidth: 4 }} />
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-800 select-none">Maintain aspect ratio</span>
                    </label>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Format */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Format</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                      {(['image/jpeg', 'image/png', 'image/webp'] as FileFormat[]).map((f) => {
                        const lbl = f.split('/')[1].toUpperCase();
                        return (
                          <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                              format === f
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quality (only for jpeg and webp) */}
                  {(format === 'image/jpeg' || format === 'image/webp') && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-slate-700">Compression Quality</label>
                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Smaller File</span>
                        <span>Higher Quality</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <a
                      href={processedImage?.url || '#'}
                      download={`resized-${originalImage.name.replace(/\.[^/.]+$/, "")}.${format.split('/')[1]}`}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                        processedImage
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        if (!processedImage) e.preventDefault();
                      }}
                    >
                      <Download className="w-5 h-5" />
                      Download Image
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
