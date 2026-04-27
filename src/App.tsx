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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col whitespace-normal">
      {/* Fixed Sticky Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-4 md:px-6 flex items-center shrink-0 z-50 sticky top-0 shadow-sm w-full">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600 flex items-center justify-center bg-blue-50 p-2 rounded-lg">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 leading-tight">
              <span className="text-blue-600">Image Resizer</span><br className="hidden sm:block" />
              <span className="text-[12px] sm:text-[14px] text-slate-500 font-medium hidden sm:inline-block w-full">& Compressor</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 ml-8 flex-1">
            <a href="#main-content" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">Home</a>
            <a href="#how-it-works" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#features" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#about" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">About Us</a>
          </nav>

          {originalImage && (
            <div className="flex items-center">
              <button
                onClick={resetAll}
                className="text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 md:px-4 md:py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Start Over</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Tool Area */}
      <main id="main-content" className="w-full pb-8 flex-none flex flex-col bg-slate-50">
        {!originalImage ? (
          <div className="w-full items-center justify-center px-4 md:px-8 py-12 md:py-20 lg:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50/50 -z-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }}></div>
            
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Free Image Resizer & <span className="text-blue-600">Compressor</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Resize, compress, and optimize your JPEG, PNG, and WebP photos instantly in your browser. Complete privacy—no files uploaded to our servers.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full border-2 border-dashed rounded-2xl p-10 md:p-16 flex flex-col items-center justify-center text-center transition-all bg-white shadow-xl min-h-[300px] md:min-h-[400px] relative overflow-hidden ${
                  isDragging ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-2xl' : 'border-slate-300 hover:border-blue-400 hover:shadow-2xl'
                }`}
              >
                <div className={`p-5 rounded-full mb-6 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <UploadCloud className="w-12 h-12 md:w-16 md:h-16" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold mb-3 text-slate-800">Drag & Drop your image here</h2>
                <p className="text-slate-500 max-w-sm mb-8 leading-relaxed text-sm md:text-base hidden sm:block">
                  Support for high-resolution formats. Client-side processing means zero waiting and complete privacy.
                </p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-semibold cursor-pointer shadow-lg hover:shadow-blue-600/25 transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:ring-offset-2 w-full sm:w-auto text-lg">
                  Browse Files
                  <input type="file" className="hidden" accept="image/*" onChange={onFileUpload} />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-8">
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
              
              {/* Sidebar Controls Column - Underneath image on mobile */}
              <div className="lg:col-span-3 w-full">
                <aside className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm sticky top-24 flex flex-col w-full">
                  <div className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold mb-4">Dimensions</div>
                  
                  {/* Dimensions */}
                  <div className="space-y-4 mb-6 w-full">
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 w-full">
                      <div className="flex-1 w-full">
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Width (px)</label>
                        <input
                          type="number"
                          value={width || ''}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Height (px)</label>
                        <input
                          type="number"
                          value={height || ''}
                          onChange={(e) => handleHeightChange(Number(e.target.value))}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-50 p-2 rounded-md border border-slate-100 w-full">
                      <input
                        type="checkbox"
                        checked={keepAspectRatio}
                        onChange={(e) => setKeepAspectRatio(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-[13px] text-slate-700 font-semibold truncate">Lock Aspect Ratio</span>
                    </label>
                  </div>
                  
                  <div className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold mb-4 mt-2">Compression</div>

                  {/* Format */}
                  <div className="mb-6 w-full">
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Target Format</label>
                    <div className="flex gap-2 w-full">
                      {(['image/jpeg', 'image/png', 'image/webp'] as FileFormat[]).map((f) => {
                        const lbl = f.split('/')[1].toUpperCase();
                        const isSelected = format === f;
                        return (
                          <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`flex-1 py-2 px-2 text-[12px] font-bold rounded-md border transition-all truncate ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quality */}
                  {(format === 'image/jpeg' || format === 'image/webp') && (
                    <div className="mb-2 w-full">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[13px] font-bold text-slate-700">Quality</label>
                        <span className="text-[14px] font-bold text-blue-700 bg-blue-50 px-2 rounded">
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
                        className="w-full accent-blue-600 h-2 bg-slate-200 rounded-full appearance-none flex cursor-pointer hover:bg-slate-300 transition-colors"
                      />
                      <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
                        <span>Smallest File</span>
                        <span>Best Visuals</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-5 border-t border-slate-100 w-full mb-1">
                    <a
                      href={processedImage?.url || '#'}
                      download={`optimized-${originalImage.name.replace(/\.[^/.]+$/, "")}.${format.split('/')[1]}`}
                      className={`w-full flex items-center justify-center py-4 px-4 rounded-xl font-bold transition-all text-[15px] ${
                        processedImage
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                      onClick={(e) => {
                        if (!processedImage) e.preventDefault();
                      }}
                    >
                      <Download className="w-5 h-5 mr-2" /> Download Optimised Image
                    </a>
                  </div>
                </aside>
              </div>

              {/* Visuals Canvas Column */}
              <div className="lg:col-span-9 flex flex-col gap-6 h-full w-full max-w-full">
                
                {/* Ready for download sticky mobile bar - visible only on small screens */}
                {processedImage && !isProcessing && (
                  <div className="lg:hidden bg-white p-4 rounded-xl border border-blue-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sticky justify-between flex-row items-center gap-4 top-[72px] z-40 flex">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 mb-0.5 text-sm truncate">Ready to download</div>
                      <div className="text-[11px] text-slate-500 truncate">- {getSavingsPercentage()}% reduction</div>
                    </div>
                    <a
                      href={processedImage.url}
                      download={`optimized-${originalImage.name.replace(/\.[^/.]+$/, "")}.${format.split('/')[1]}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-[13px] shadow whitespace-nowrap"
                    >
                      Download
                    </a>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-[300px] md:min-h-[500px] w-full">
                  {/* Original Preview Card */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm w-full md:w-1/2">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[12px] sm:text-[13px]">
                      <span className="font-bold text-slate-700 truncate min-w-0" title={originalImage.name}>Original: {originalImage.name}</span>
                      <span className="text-slate-500 font-bold whitespace-nowrap ml-2 flex-shrink-0">{formatBytes(originalImage.size)}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[250px]" style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}>
                      <img
                        src={originalImage.url}
                        alt="Original"
                        className="max-w-full max-h-[400px] xl:max-h-[500px] object-contain drop-shadow-md rounded bg-white p-1 border border-slate-100"
                      />
                    </div>
                  </div>

                  {/* Optimized Preview Card */}
                  <div className="flex-1 bg-white border border-blue-600 rounded-xl flex flex-col overflow-hidden shadow-sm relative w-full md:w-1/2">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-[12px] sm:text-[13px]">
                      <span className="font-bold text-slate-800 truncate">Optimized Output</span>
                      <span className="text-blue-700 font-extrabold whitespace-nowrap ml-2 flex-shrink-0">
                         {isProcessing ? 'Processing...' : processedImage ? formatBytes(processedImage.size) : '--'}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden min-h-[250px]" style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}>
                      <img
                        src={processedImage ? processedImage.url : originalImage.url}
                        alt="Optimized"
                        className={`max-w-full max-h-[400px] xl:max-h-[500px] object-contain drop-shadow-md transition-opacity duration-300 rounded bg-white p-1 border border-slate-100 ${isProcessing ? 'opacity-40 grayscale' : 'opacity-100'}`}
                      />
                      
                      {processedImage && processedImage.size < originalImage.size && !isProcessing && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-lg border border-blue-100 px-4 py-2.5 rounded-xl text-center flex flex-col transform transition-transform hover:scale-105">
                          <div className="text-2xl font-extrabold text-blue-600 leading-none mb-1">-{getSavingsPercentage()}%</div>
                          <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Reduction</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ready for download section from design HTML - Desktop */}
                {processedImage && !isProcessing && (
                  <div className="hidden lg:flex bg-white px-6 py-5 rounded-xl border border-blue-100 flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm mb-4">
                    <div className="max-w-xl">
                      <div className="font-bold text-slate-800 mb-1 text-lg">Ready for download</div>
                      <div className="text-[13px] text-slate-500 leading-relaxed">All transformations applied successfully. Your image has been optimized for the web resulting in a smaller footprint with preserved visuals.</div>
                    </div>
                    <a
                      href={processedImage.url}
                      download={`optimized-${originalImage.name.replace(/\.[^/.]+$/, "")}.${format.split('/')[1]}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center justify-center whitespace-nowrap transition-all hover:-translate-y-0.5"
                    >
                      Download Image
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SEO Sections (Only visible on initial load / when no image is uploaded) */}
      {!originalImage && (
        <div className="w-full bg-white flex-1 relative z-10">
          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-8 border-t border-slate-200 w-full overflow-hidden">
            <div className="max-w-6xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How to Resize & Compress Images?</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">Optimize your images flawlessly in three simple steps without uploading to any external servers.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative w-full">
                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center bg-white">
                  <div className="w-16 h-16 bg-blue-100text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 bg-white shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Upload your photo</h3>
                  <p className="text-slate-600 leading-relaxed">Drag and drop your JPEG, PNG, or WebP file into the container above to securely load it into your browser.</p>
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center bg-white">
                  <div className="w-16 h-16 bg-blue-100text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 bg-white shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                    <span className="text-2xl font-bold text-blue-600">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Adjust Settings</h3>
                  <p className="text-slate-600 leading-relaxed">Change the exact width or height dimensions, toggle the target format, and adjust the image quality slider.</p>
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center bg-white">
                  <div className="w-16 h-16 bg-blue-100text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 bg-white shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                    <span className="text-2xl font-bold text-blue-600">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Download</h3>
                  <p className="text-slate-600 leading-relaxed">Instantly preview the result, verify the file size reduction, and download the finished asset to your device.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 md:py-28 px-4 md:px-8 bg-slate-50 border-t border-slate-200">
            <div className="max-w-6xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Why Use Our Image Tool?</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">Designed for speed, built for privacy, delivering the best quality available on the web.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">✓</span> 
                    100% Client-Side Processing
                  </h3>
                  <p className="text-slate-600 leading-relaxed ml-10">We never upload your photos to our servers. Everything happens directly in your browser ensuring maximum privacy, security, and instantaneous speeds.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">✓</span> 
                    Next-Gen Formats
                  </h3>
                  <p className="text-slate-600 leading-relaxed ml-10">Easily convert older JPEGs and bulky PNGs into lightweight WebP images for massive bandwidth savings, essential for website developers.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">✓</span> 
                    Total Control
                  </h3>
                  <p className="text-slate-600 leading-relaxed ml-10">Say goodbye to automated black-box compressors. You have fine-grained control over resolution width, height, aspect ratio locking, and compression rate.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">✓</span> 
                    Mobile Friendly
                  </h3>
                  <p className="text-slate-600 leading-relaxed ml-10">Our tool is fully responsive and operates flawlessly on both desktop browsers and mobile devices. Resize images directly from your phone's camera roll.</p>
                </div>
              </div>
            </div>
          </section>

          {/* About Us Section (SEO) */}
          <section id="about" className="py-20 md:py-24 px-4 md:px-8 border-t border-slate-200">
            <div className="max-w-3xl mx-auto text-center w-full">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">About Image Resizer & Compressor</h2>
              <div className="text-slate-700 text-lg space-y-6 leading-relaxed text-left">
                <p>
                  We built our free image resizer with a simple philosophy: digital tools should be straightforward, fast, and respectful of user data. With the web constantly shifting towards higher-quality visual assets, optimizing file sizes can be a chore.
                </p>
                <p>
                  Our utility uses the native Canvas API provided by modern browsers to shrink, scale, and compress images on the fly. Whether you are adjusting photography for social media, optimizing e-commerce product photos, or building lightning-fast websites, this tool gives you professional results for zero cost.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Comprehensive Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 px-4 md:px-8 shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 mb-12 border-b border-slate-800 pb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-slate-300">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="font-bold text-white text-lg tracking-tight">
                  Image Resizer & Compressor
                </div>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed mb-6">
                The fastest way to batch, compress, and resize images accurately in your web browser with zero server uploads required.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Free Forever</span>
                <span className="text-[12px] font-bold tracking-wider uppercase text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">Privacy First</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">Features</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Resize JPEG</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Compress PNG</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Convert to WebP</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Change Aspect Ratio</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">Company</h4>
              <ul className="space-y-3">
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How it Works</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">Contact Us</h4>
              <address className="not-italic text-slate-400 text-sm space-y-3">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 min-w-[60px]">Email:</span>
                  <a href="mailto:support@imageresizer.com" className="hover:text-white transition-colors truncate block">support@imageresizer.com</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 min-w-[60px]">Phone:</span>
                  <a href="tel:+18001234567" className="hover:text-white transition-colors block">+1 (800) 123-4567</a>
                </p>
                <p className="flex items-start gap-2 pt-1">
                  <span className="font-bold text-slate-300 min-w-[60px] pt-1">Address:</span>
                  <span className="leading-relaxed">123 Optimization Way,<br />San Francisco, CA 94105</span>
                </p>
              </address>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Image Resizer & Compressor. All rights reserved.</p>
            <p>Made with privacy in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
