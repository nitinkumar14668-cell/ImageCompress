import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Download, Settings2, RefreshCw, X, Layers, Undo2, Redo2, Crop as CropIcon, Check, Wand2, Palette } from 'lucide-react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type FileFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageMeta {
  id: string;
  url: string;
  name: string;
  size: number; // bytes
  width: number;
  height: number;
  type: string;
  exportName?: string;
  exportFormat?: FileFormat | 'original';
}

interface ProcessedImage {
  url: string;
  size: number;
  format: string;
}

const applySharpen = (ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) => {
  if (amount === 0) return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const mix = amount / 100;
  
  const src = new Uint8ClampedArray(data);
  const side = 3;
  const halfSide = 1;
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
            const srcOff = (scy * w + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          } else {
             const srcOff = (y * w + x) * 4;
             const wt = weights[cy * side + cx];
             r += src[srcOff] * wt;
             g += src[srcOff + 1] * wt;
             b += src[srcOff + 2] * wt;
          }
        }
      }
      
      data[dstOff] = Math.min(255, Math.max(0, src[dstOff] + (r - src[dstOff]) * mix));
      data[dstOff + 1] = Math.min(255, Math.max(0, src[dstOff + 1] + (g - src[dstOff + 1]) * mix));
      data[dstOff + 2] = Math.min(255, Math.max(0, src[dstOff + 2] + (b - src[dstOff + 2]) * mix));
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export default function App() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<Record<string, ProcessedImage>>({});
  
  // Batch Settings
  const [targetWidth, setTargetWidth] = useState<number | ''>('');
  const [targetHeight, setTargetHeight] = useState<number | ''>('');
  const [scaleMode, setScaleMode] = useState<'original' | 'width' | 'height' | 'exact'>('original');
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  
  const [format, setFormat] = useState<FileFormat | 'original'>('original');
  const [quality, setQuality] = useState<number>(0.8);
  
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [sepia, setSepia] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [sharpen, setSharpen] = useState<number>(0);
  
  const [pastSettings, setPastSettings] = useState<any[]>([]);
  const [futureSettings, setFutureSettings] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'split' | 'slider'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const overlayImageRef = useRef<HTMLImageElement>(null);
  const sliderHandleRef = useRef<HTMLDivElement>(null);
  const isSliderDraggingRef = useRef<boolean>(false);
  const [isSliderDragging, setIsSliderDragging] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [isProcessingLocal, setIsProcessingLocal] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const cropImgRef = useRef<HTMLImageElement>(null);

  const activeImage = images.find(img => img.id === activeId) || null;

  const saveSettingsHistory = () => {
    const currentState = { targetWidth, targetHeight, scaleMode, format, quality, keepAspectRatio, grayscale, sepia, brightness, contrast, sharpen };
    setPastSettings(p => {
      if (p.length > 0) {
        const last = p[p.length - 1];
        if (
          last.targetWidth === currentState.targetWidth &&
          last.targetHeight === currentState.targetHeight &&
          last.scaleMode === currentState.scaleMode &&
          last.format === currentState.format &&
          last.quality === currentState.quality &&
          last.keepAspectRatio === currentState.keepAspectRatio &&
          last.grayscale === currentState.grayscale &&
          last.sepia === currentState.sepia &&
          last.brightness === currentState.brightness &&
          last.contrast === currentState.contrast &&
          last.sharpen === currentState.sharpen
        ) {
          return p;
        }
      }
      return [...p, currentState];
    });
    setFutureSettings([]);
  };

  const autoEnhanceAllImages = () => {
    saveSettingsHistory();
    setBrightness(110);
    setContrast(115);
    setSharpen(30);
    setGrayscale(false);
    setSepia(false);
  };

  const undoSettings = () => {
    if (pastSettings.length === 0) return;
    const previous = pastSettings[pastSettings.length - 1];
    setPastSettings(p => p.slice(0, p.length - 1));
    setFutureSettings(f => [{ targetWidth, targetHeight, scaleMode, format, quality, keepAspectRatio, grayscale, sepia, brightness, contrast, sharpen }, ...f]);

    setTargetWidth(previous.targetWidth);
    setTargetHeight(previous.targetHeight);
    setScaleMode(previous.scaleMode as any);
    setFormat(previous.format as any);
    setQuality(previous.quality);
    setKeepAspectRatio(previous.keepAspectRatio);
    setGrayscale(previous.grayscale);
    setSepia(previous.sepia);
    setBrightness(previous.brightness);
    setContrast(previous.contrast);
    setSharpen(previous.sharpen || 0);
  };

  const redoSettings = () => {
    if (futureSettings.length === 0) return;
    const next = futureSettings[0];
    setFutureSettings(f => f.slice(1));
    setPastSettings(p => [...p, { targetWidth, targetHeight, scaleMode, format, quality, keepAspectRatio, grayscale, sepia, brightness, contrast, sharpen }]);

    setTargetWidth(next.targetWidth);
    setTargetHeight(next.targetHeight);
    setScaleMode(next.scaleMode as any);
    setFormat(next.format as any);
    setQuality(next.quality);
    setKeepAspectRatio(next.keepAspectRatio);
    setGrayscale(next.grayscale);
    setSepia(next.sepia);
    setBrightness(next.brightness);
    setContrast(next.contrast);
    setSharpen(next.sharpen || 0);
  };

  useEffect(() => {
    isSliderDraggingRef.current = isSliderDragging;
  }, [isSliderDragging]);

  useEffect(() => {
    let localPos: number | null = null;
    const handleMouseUp = () => {
      setIsSliderDragging(false);
      if (localPos !== null) {
        setSliderPosition(localPos);
      }
    };
    
    let rafId: number | null = null;
    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isSliderDraggingRef.current || !sliderContainerRef.current) return;
        
        if (rafId) cancelAnimationFrame(rafId);
        
        rafId = requestAnimationFrame(() => {
          const rect = sliderContainerRef.current!.getBoundingClientRect();
          const x = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
          let pos = ((x - rect.left) / rect.width) * 100;
          pos = Math.max(0, Math.min(100, pos));
          localPos = pos;
          
          if (overlayImageRef.current) {
            overlayImageRef.current.style.clipPath = `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`;
          }
          if (sliderHandleRef.current) {
            sliderHandleRef.current.style.left = `${pos}%`;
          }
        });
    };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const applyCrop = () => {
    if (!completedCrop || !cropImgRef.current || !activeImage) return;

    const scaleX = cropImgRef.current.naturalWidth / cropImgRef.current.width;
    const scaleY = cropImgRef.current.naturalHeight / cropImgRef.current.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = completedCrop.width * scaleX;
    offscreen.height = completedCrop.height * scaleY;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      cropImgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);
      setImages(prev => prev.map(img => {
        if (img.id === activeImage.id) {
          return {
            ...img,
            url: newUrl,
            width: offscreen.width,
            height: offscreen.height,
            size: blob.size,
          };
        }
        return img;
      }));
      setCrop(undefined);
      setCompletedCrop(undefined);
      setIsCropping(false);
    }, activeImage.type);
  };

  // Cleanup object URLs for removed images
  // We handle specific cleanup in removeImage and resetAll methods.
  // We handle active image process updates in the debounced effect.

  const handleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Please select valid image files.');
      return;
    }

    const promises = validFiles.map((file) => {
      return new Promise<ImageMeta | { error: string }>((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({
            id: Math.random().toString(36).substring(2, 11),
            url,
            name: file.name,
            size: file.size,
            width: img.width,
            height: img.height,
            type: file.type,
          });
        };
        img.onerror = () => {
          resolve({ error: file.name });
        };
        img.src = url;
      });
    });

    Promise.all(promises).then((results) => {
      const validImages = results.filter(r => r && !('error' in r)) as ImageMeta[];
      const failedImages = results.filter(r => r && 'error' in r).map(r => (r as { error: string }).error);
      
      if (failedImages.length > 0) {
        alert(`Failed to load the following images:\n${failedImages.join('\n')}`);
      }

      if (validImages.length > 0) {
        setImages((prev) => {
          const newImages = [...prev, ...validImages];
          if (!activeId) {
            setActiveId(newImages[0].id);
          }
          return newImages;
        });
      }
    });
  };

  const onFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
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
      handleFiles(e.dataTransfer.files);
    }
  };

  // Compute active image dimensions based on settings
  let activeTargetWidth = activeImage?.width || 0;
  let activeTargetHeight = activeImage?.height || 0;

  if (activeImage) {
    if (scaleMode === 'exact') {
      activeTargetWidth = (targetWidth as number) || activeImage.width;
      activeTargetHeight = (targetHeight as number) || activeImage.height;
    } else if (scaleMode === 'width' && targetWidth) {
      activeTargetWidth = targetWidth;
      activeTargetHeight = Math.round(targetWidth / (activeImage.width / activeImage.height));
    } else if (scaleMode === 'height' && targetHeight) {
      activeTargetHeight = targetHeight;
      activeTargetWidth = Math.round(targetHeight * (activeImage.width / activeImage.height));
    }
  }

  const handleWidthChange = (val: number | '') => {
    setTargetWidth(val);
    if (val === '') {
      setScaleMode('original'); // Or something else
    } else {
      setScaleMode(keepAspectRatio ? 'width' : 'exact');
    }
  };

  const handleHeightChange = (val: number | '') => {
    setTargetHeight(val);
    if (val === '') {
      setScaleMode('original');
    } else {
      setScaleMode(keepAspectRatio ? 'height' : 'exact');
    }
  };

  const handleUpscale2x = () => {
    if (!activeImage) return;
    saveSettingsHistory();
    setTargetWidth(activeImage.width * 2);
    setTargetHeight(activeImage.height * 2);
    setScaleMode('exact');
  };

  const toggleAspectRatio = (checked: boolean) => {
    setKeepAspectRatio(checked);
    if (checked) {
      if (targetWidth) setScaleMode('width');
      else if (targetHeight) setScaleMode('height');
      else setScaleMode('original');
    } else {
      if (targetWidth || targetHeight) setScaleMode('exact');
      else setScaleMode('original');
    }
  };

  const processSingleImage = async (img: ImageMeta): Promise<ProcessedImage> => {
    let tWidth = img.width;
    let tHeight = img.height;

    if (scaleMode === 'exact') {
      tWidth = (targetWidth as number) || img.width;
      tHeight = (targetHeight as number) || img.height;
    } else if (scaleMode === 'width' && targetWidth) {
      tWidth = targetWidth;
      tHeight = Math.round(targetWidth / (img.width / img.height));
    } else if (scaleMode === 'height' && targetHeight) {
      tHeight = targetHeight;
      tWidth = Math.round(targetHeight * (img.width / img.height));
    }

    const tFormatCheck = img.exportFormat && img.exportFormat !== 'original' ? img.exportFormat : format;
    const tFormat = tFormatCheck === 'original' ? (img.type as FileFormat) : tFormatCheck;
    const finalFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(tFormat) ? tFormat : 'image/jpeg';

    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tWidth;
        canvas.height = tHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not supported.'));
        
        let filterString = '';
        if (grayscale) filterString += 'grayscale(100%) ';
        if (sepia) filterString += 'sepia(100%) ';
        if (brightness !== 100) filterString += `brightness(${brightness}%) `;
        if (contrast !== 100) filterString += `contrast(${contrast}%) `;
        if (filterString) ctx.filter = filterString.trim();

        ctx.drawImage(imageObj, 0, 0, tWidth, tHeight);
        
        if (sharpen > 0) {
          applySharpen(ctx, tWidth, tHeight, sharpen);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                url: URL.createObjectURL(blob),
                size: blob.size,
                format: finalFormat,
              });
            } else {
              reject(new Error('Failed to create blob.'));
            }
          },
          finalFormat,
          quality
        );
      };
      imageObj.onerror = () => reject(new Error(`Failed to load image '${img.name}' for processing.`));
      imageObj.src = img.url;
    });
  };

  // Debounced auto-processing of ACTIVE image
  useEffect(() => {
    if (!activeImage) return;

    setIsProcessingLocal(true);
    const timer = setTimeout(async () => {
      try {
        const processed = await processSingleImage(activeImage);
        setProcessedImages(prev => {
          // Cleanup old URL
          if (prev[activeImage.id]) URL.revokeObjectURL(prev[activeImage.id].url);
          return { ...prev, [activeImage.id]: processed };
        });
      } catch (err) {
        console.error(`Error processing active image (${activeImage.name}):`, err);
        // We could alert here, but since it auto-processes on every slider move, it might get noisy.
        // Alert only if it's not a generic abort.
        if (err instanceof Error && err.message.includes('Failed to load image')) {
           alert(err.message);
        }
      } finally {
        setIsProcessingLocal(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeImage, targetWidth, targetHeight, scaleMode, format, quality, grayscale, sepia, brightness, contrast, sharpen]);

  const downloadAll = async () => {
    if (images.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress(0);
    setBatchTotal(images.length);
    
    const failedImages: string[] = [];

    try {
      const zip = new JSZip();

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const processed = await processSingleImage(img);
          
          // Update local state just in case
          setProcessedImages(prev => ({ ...prev, [img.id]: processed }));
          
          const response = await fetch(processed.url);
          const blob = await response.blob();
          
          const ext = processed.format.split('/')[1] || 'jpeg';
          // handle duplicate names
          const nameToUse = img.exportName || img.name;
          const baseName = nameToUse.replace(/\.[^/.]+$/, "");
          const newName = `${baseName}-optimized.${ext}`;
          
          zip.file(newName, blob);
        } catch (err) {
          console.error(`Failed to process image ${img.name}:`, err);
          failedImages.push(img.name);
        }
        setBatchProgress(i + 1);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'optimized-images.zip');
      
      if (failedImages.length > 0) {
        alert(`Finished batch process, but failed to optimize the following:\n${failedImages.join('\n')}`);
      }

    } catch (err) {
      console.error(err);
      alert('Failed to batch process images.');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(0);
      setBatchTotal(0);
    }
  };

  const removeImage = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting active
    
    // Revoke blobs
    const img = images.find(i => i.id === idToRemove);
    if (img) URL.revokeObjectURL(img.url);
    if (processedImages[idToRemove]) URL.revokeObjectURL(processedImages[idToRemove].url);
    
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== idToRemove);
      if (activeId === idToRemove) {
        setActiveId(newImages.length > 0 ? newImages[0].id : null);
      }
      return newImages;
    });
    setProcessedImages(prev => {
      const { [idToRemove]: removed, ...rest } = prev;
      return rest;
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    Object.values(processedImages).forEach((img: any) => URL.revokeObjectURL(img.url));
    setImages([]);
    setProcessedImages({});
    setActiveId(null);
  };

  const getSavingsPercentage = (originalSize: number, newSize: number) => {
    const saving = ((originalSize - newSize) / originalSize) * 100;
    return saving > 0 ? saving.toFixed(1) : 0;
  };

  const activeProcessed = activeImage ? processedImages[activeImage.id] : null;

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
            <a href="#advanced-features" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#about" className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors">About Us</a>
          </nav>

          {images.length > 0 && (
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
        {images.length === 0 ? (
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
                  <div className="flex flex-col mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold">
                        {images.length > 1 ? 'Global Settings' : 'Dimensions'}
                      </div>
                      <div className="flex items-center gap-1 ml-auto mr-3 border border-slate-200 rounded-md p-0.5 shadow-sm bg-slate-50">
                        <button onClick={undoSettings} disabled={pastSettings.length === 0} title="Undo" className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"><Undo2 className="w-3.5 h-3.5" /></button>
                        <button onClick={redoSettings} disabled={futureSettings.length === 0} title="Redo" className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"><Redo2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {images.length > 1 && <div className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Batch Mode</div>}
                    </div>
                    {images.length > 1 && (
                      <p className="text-[11.5px] text-slate-500 mt-2 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        These settings are applied to <strong>all {images.length} images</strong> during batch download.
                      </p>
                    )}
                  </div>
                  
                  {/* Presets */}
                  <div className="mb-6 w-full">
                    <div className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold mb-3">Optimization Profiles</div>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      <button
                        onClick={() => {
                          saveSettingsHistory();
                          setTargetWidth('');
                          setTargetHeight('');
                          setScaleMode('original');
                          setFormat('image/webp');
                          setQuality(0.6);
                          setGrayscale(false);
                          setSepia(false);
                          setBrightness(100);
                          setContrast(100);
                        }}
                        className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-left w-full"
                      >
                        <span className="text-[13px] font-bold text-slate-800">Web - Smallest</span>
                        <span className="text-[11px] text-slate-500">WebP format, 60% compression</span>
                      </button>
                      <button
                        onClick={() => {
                          saveSettingsHistory();
                          setTargetWidth('');
                          setTargetHeight('');
                          setScaleMode('original');
                          setFormat('image/webp');
                          setQuality(0.85);
                          setGrayscale(false);
                          setSepia(false);
                          setBrightness(100);
                          setContrast(100);
                        }}
                        className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-left w-full"
                      >
                        <span className="text-[13px] font-bold text-slate-800">Web - Balanced</span>
                        <span className="text-[11px] text-slate-500">WebP format, 85% compression</span>
                      </button>
                      <button
                        onClick={() => {
                          saveSettingsHistory();
                          setTargetWidth('');
                          setTargetHeight('');
                          setScaleMode('original');
                          setFormat('image/jpeg');
                          setQuality(1.0);
                          setGrayscale(false);
                          setSepia(false);
                          setBrightness(100);
                          setContrast(100);
                        }}
                        className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-left w-full"
                      >
                        <span className="text-[13px] font-bold text-slate-800">Print - High Quality</span>
                        <span className="text-[11px] text-slate-500">JPEG format, 100% quality</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Dimensions */}
                  <div className="space-y-4 mb-6 w-full">
                    <div className="flex items-center justify-between">
                       <label className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold">Dimensions</label>
                       <button 
                         onClick={handleUpscale2x}
                         className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-[11px] font-bold border border-green-200 transition-colors"
                       >
                         2x Upscale
                       </button>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 w-full">
                      <div className="flex-1 w-full">
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Width (px)</label>
                        <input
                          type="number"
                          value={targetWidth}
                          placeholder={activeTargetWidth.toString()}
                          onFocus={saveSettingsHistory}
                          onChange={(e) => handleWidthChange(e.target.value ? Number(e.target.value) : '')}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Height (px)</label>
                        <input
                          type="number"
                          value={targetHeight}
                          placeholder={activeTargetHeight.toString()}
                          onFocus={saveSettingsHistory}
                          onChange={(e) => handleHeightChange(e.target.value ? Number(e.target.value) : '')}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors shadow-sm"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-50 p-2 rounded-md border border-slate-100 w-full">
                      <input
                        type="checkbox"
                        checked={keepAspectRatio}
                        onPointerDown={saveSettingsHistory}
                        onChange={(e) => toggleAspectRatio(e.target.checked)}
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
                      <button
                        onClick={() => { saveSettingsHistory(); setFormat('original'); }}
                        className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-md border transition-all truncate ${
                          format === 'original'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        MATCH
                      </button>
                      {(['image/jpeg', 'image/png', 'image/webp'] as FileFormat[]).map((f) => {
                        const lbl = f.split('/')[1].toUpperCase();
                        const isSelected = format === f;
                        return (
                          <button
                            key={f}
                            onClick={() => { saveSettingsHistory(); setFormat(f); }}
                            className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-md border transition-all truncate ${
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
                  {((format === 'original' ? activeImage?.type : format) === 'image/jpeg' || 
                    (format === 'original' ? activeImage?.type : format) === 'image/webp') && (
                    <div className="mb-2 w-full">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[13px] font-bold text-slate-700">Compression Quality</label>
                        <span className="text-[14px] font-bold text-blue-700 bg-blue-50 px-2 rounded">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="1"
                        step="0.01"
                        value={quality}
                        onPointerDown={saveSettingsHistory}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 bg-slate-200 rounded-full appearance-none flex cursor-pointer hover:bg-slate-300 transition-colors"
                      />
                      <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
                        <span>High Compression</span>
                        <span>High Quality</span>
                      </div>
                    </div>
                  )}

                  {/* Effects */}
                  <div className="mt-6 mb-2 w-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[12px] uppercase tracking-[0.08em] text-slate-500 font-bold">Image Effects</div>
                      <button 
                        onClick={autoEnhanceAllImages}
                        className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-bold border border-purple-200 transition-colors"
                      >
                        <Wand2 className="w-3 h-3" /> Auto Enhance
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-md border border-slate-100 hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={grayscale}
                          onPointerDown={saveSettingsHistory}
                          onChange={(e) => setGrayscale(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600 accent-blue-600"
                        />
                        <span className="text-[12px] font-semibold text-slate-700">Grayscale</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-md border border-slate-100 hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={sepia}
                          onPointerDown={saveSettingsHistory}
                          onChange={(e) => setSepia(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600 accent-blue-600"
                        />
                        <span className="text-[12px] font-semibold text-slate-700">Sepia</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[13px] font-bold text-slate-700">Brightness</label>
                          <span className="text-[11px] font-medium text-slate-500">{brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          value={brightness}
                          onPointerDown={saveSettingsHistory}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-full appearance-none flex cursor-pointer hover:bg-slate-300 transition-colors"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[13px] font-bold text-slate-700">Contrast</label>
                          <span className="text-[11px] font-medium text-slate-500">{contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          value={contrast}
                          onPointerDown={saveSettingsHistory}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-full appearance-none flex cursor-pointer hover:bg-slate-300 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[13px] font-bold text-slate-700">Sharpen</label>
                          <span className="text-[11px] font-medium text-slate-500">{sharpen}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={sharpen}
                          onPointerDown={saveSettingsHistory}
                          onChange={(e) => setSharpen(Number(e.target.value))}
                          className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-full appearance-none flex cursor-pointer hover:bg-slate-300 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-5 border-t border-slate-100 w-full mb-1">
                    <a
                      href={activeProcessed?.url || '#'}
                      download={activeImage ? `${(activeImage.exportName || activeImage.name).replace(/\\.[^/.]+$/, "")}-optimized.${(activeProcessed?.format || format).split('/')[1]}` : 'image'}
                      className={`w-full flex items-center justify-center py-4 px-4 rounded-xl font-bold transition-all text-[15px] ${
                        activeProcessed
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                      onClick={(e) => {
                        if (!activeProcessed) e.preventDefault();
                      }}
                    >
                      <Download className="w-5 h-5 mr-2" /> Download Displayed
                    </a>
                  </div>
                </aside>
              </div>

              {/* Visuals Canvas Column */}
              <div className="lg:col-span-9 flex flex-col gap-6 h-full w-full max-w-full">
                
                {/* Horizontal Image List */}
                {images.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full relative">
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x items-center">
                      <label className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer ml-1">
                        <UploadCloud className="w-6 h-6" />
                        <input type="file" className="hidden" accept="image/*" multiple onChange={onFileUpload} />
                      </label>
                      <div className="w-px h-10 bg-slate-200 flex-shrink-0 mx-1"></div>
                      {images.map(img => (
                        <div 
                          key={img.id} 
                          onClick={() => setActiveId(img.id)}
                          className={`flex-shrink-0 relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all snap-start shadow-sm border-2 ${activeId === img.id ? 'border-blue-500 ring-4 ring-blue-50 scale-105' : 'border-transparent hover:scale-105'}`}
                        >
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            className="w-full h-full object-cover bg-slate-100" 
                            style={{ filter: `grayscale(${grayscale ? 100 : 0}%) sepia(${sepia ? 100 : 0}%) brightness(${brightness}%) contrast(${contrast}%)` }}
                          />
                          <button 
                            onClick={(e) => removeImage(img.id, e)}
                            className="absolute top-1 right-1 bg-slate-900/50 hover:bg-red-500 text-white p-0.5 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready for download sticky mobile bar - visible only on small screens */}
                {activeProcessed && !isProcessingLocal && (
                  <div className="lg:hidden bg-white p-4 rounded-xl border border-blue-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sticky justify-between flex-row items-center gap-4 top-[72px] z-40 flex">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 mb-0.5 text-sm truncate">
                        {images.length > 1 ? 'Batch ready' : 'Ready to download'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {images.length > 1 ? `${images.length} images` : `- ${getSavingsPercentage(activeImage!.size, activeProcessed.size)}% reduction`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {images.length > 1 ? (
                         <button
                           onClick={downloadAll}
                           disabled={isBatchProcessing}
                           className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-[13px] shadow whitespace-nowrap flex items-center relative overflow-hidden"
                         >
                           {isBatchProcessing ? (
                             <>
                               <div className="absolute inset-0 bg-blue-400 opacity-20" style={{ width: `${(batchProgress / batchTotal) * 100}%`, transition: 'width 0.3s' }}></div>
                               <RefreshCw className="w-4 h-4 animate-spin relative z-10 mr-1.5" /> 
                               <span className="relative z-10">{batchProgress}/{batchTotal}</span>
                             </>
                           ) : 'ZIP'}
                         </button>
                       ) : (
                         <a
                           href={activeProcessed.url}
                           download={activeImage ? `${(activeImage.exportName || activeImage.name).replace(/\\.[^/.]+$/, "")}-optimized.${activeProcessed.format.split('/')[1]}` : 'image'}
                           className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-[13px] shadow whitespace-nowrap"
                         >
                           Save
                         </a>
                       )}
                    </div>
                  </div>
                )}                <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-[300px] md:min-h-[500px] w-full relative">
                  {images.length > 1 && (
                     <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200 z-10 shadow-sm pointer-events-none whitespace-nowrap">
                       PREVIEWING: {activeImage?.name} 
                     </div>
                  )}

                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur border border-slate-200 p-1 rounded-lg flex items-center shadow-lg">
                        <button onClick={() => setViewMode('split')} className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${viewMode === 'split' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>Side-by-Side</button>
                        <button onClick={() => setViewMode('slider')} className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${viewMode === 'slider' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>Compare Slider</button>
                    </div>
                    <button 
                      onClick={autoEnhanceAllImages} 
                      className="bg-purple-600/90 hover:bg-purple-700 backdrop-blur border border-purple-400 text-white p-2 rounded-lg shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                      title="Auto Enhance Image"
                    >
                      <Wand2 className="w-4 h-4 group-hover:animate-pulse" />
                      <span className="sr-only">Auto Enhance</span>
                    </button>
                  </div>

                  {viewMode === 'split' ? (
                    <>
                      {/* Original Preview Card */}
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm w-full md:w-1/2">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[12px] sm:text-[13px]">
                          <span className="font-bold text-slate-700 truncate min-w-0" title={activeImage?.name}>Original: {activeImage?.name}</span>
                          <div className="flex items-center gap-2">
                            {activeImage && !isCropping && (
                              <button onClick={() => setIsCropping(true)} className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-bold bg-white border border-slate-200 hover:border-blue-300 px-2 py-1 rounded shadow-sm transition-colors text-[11px]">
                                <CropIcon className="w-3 h-3"/> Crop
                              </button>
                            )}
                            {isCropping && (
                              <div className="flex items-center gap-1 z-30">
                                <button onClick={applyCrop} className="flex items-center gap-1 text-white hover:bg-green-700 font-bold bg-green-600 px-2 py-1 rounded shadow-sm transition-colors text-[11px]">
                                  <Check className="w-3 h-3"/> Apply
                                </button>
                                <button onClick={() => setIsCropping(false)} className="flex items-center gap-1 text-slate-600 hover:text-slate-800 font-bold bg-white border border-slate-200 hover:border-slate-300 px-2 py-1 rounded shadow-sm transition-colors text-[11px]">
                                  <X className="w-3 h-3"/> Cancel
                                </button>
                              </div>
                            )}
                            <span className="text-slate-500 font-bold whitespace-nowrap ml-1 flex-shrink-0">{activeImage && formatBytes(activeImage.size)}</span>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[250px]" style={{
                          backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}>
                          {activeImage && (
                            isCropping ? (
                              <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                className="max-w-full outline-none bg-white p-1 border border-slate-100 rounded drop-shadow-md flex items-center justify-center max-h-[400px] xl:max-h-[500px]"
                              >
                                <img
                                  ref={cropImgRef}
                                  src={activeImage.url}
                                  alt="Crop Original"
                                  className="max-w-full max-h-[386px] xl:max-h-[486px] object-contain"
                                />
                              </ReactCrop>
                            ) : (
                              <img
                                src={activeImage.url}
                                alt="Original"
                                className="max-w-full max-h-[400px] xl:max-h-[500px] object-contain drop-shadow-md rounded bg-white p-1 border border-slate-100"
                              />
                            )
                          )}
                        </div>
                      </div>

                      {/* Optimized Preview Card */}
                      <div className="flex-1 bg-white border border-blue-600 rounded-xl flex flex-col overflow-hidden shadow-sm relative w-full md:w-1/2">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-[12px] sm:text-[13px]">
                          <span className="font-bold text-slate-800 truncate">Optimized Output</span>
                          <span className="text-blue-700 font-extrabold whitespace-nowrap ml-2 flex-shrink-0">
                             {isProcessingLocal ? 'Processing...' : activeProcessed ? formatBytes(activeProcessed.size) : '--'}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden min-h-[250px]" style={{
                          backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}>
                          {activeImage && (
                            <img
                              src={activeProcessed ? activeProcessed.url : activeImage.url}
                              alt="Optimized"
                              className={`max-w-full max-h-[400px] xl:max-h-[500px] object-contain drop-shadow-md transition-opacity duration-300 rounded bg-white p-1 border border-slate-100 ${isProcessingLocal ? 'opacity-40 grayscale' : 'opacity-100'}`}
                            />
                          )}
                          
                          {activeProcessed && activeImage && activeProcessed.size < activeImage.size && !isProcessingLocal && (
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-lg border border-blue-100 px-4 py-2.5 rounded-xl text-center flex flex-col transform transition-transform hover:scale-105 pointer-events-none z-10">
                              <div className="text-2xl font-extrabold text-blue-600 leading-none mb-1">-{getSavingsPercentage(activeImage.size, activeProcessed.size)}%</div>
                              <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold">Reduction</div>
                            </div>
                          )}
                        </div>
                        {activeImage && (
                          <div className="p-3 bg-blue-50/50 border-t border-blue-100 flex flex-col sm:flex-row gap-3 items-center">
                            <div className="flex-1 w-full">
                               <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Export Filename</label>
                               <input
                                 type="text"
                                 value={activeImage.exportName !== undefined ? activeImage.exportName : activeImage.name}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setImages(imgs => imgs.map(img => img.id === activeImage.id ? { ...img, exportName: val } : img));
                                 }}
                                 className="w-full text-[13px] px-2 py-1.5 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                               />
                            </div>
                            <div className="w-full sm:w-auto">
                               <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Export Format</label>
                               <select
                                 value={activeImage.exportFormat || 'original'}
                                 onChange={(e) => {
                                   const val = e.target.value as FileFormat | 'original';
                                   setImages(imgs => imgs.map(img => img.id === activeImage.id ? { ...img, exportFormat: val } : img));
                                 }}
                                 className="w-full sm:w-32 text-[13px] px-2 py-1.5 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                               >
                                 <option value="original">Use Global</option>
                                 <option value="image/jpeg">JPEG</option>
                                 <option value="image/png">PNG</option>
                                 <option value="image/webp">WebP</option>
                               </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 bg-white border border-blue-600 rounded-xl flex flex-col overflow-hidden shadow-sm relative w-full pt-16">
                      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-[300px]" 
                           ref={sliderContainerRef}
                           style={{
                        backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}>
                        {activeImage && (
                          <div className="relative w-full h-full flex items-center justify-center max-w-full">
                            {/* Base Image (Optimized) */}
                            <img
                              src={activeProcessed ? activeProcessed.url : activeImage.url}
                              alt="Optimized"
                              className={`max-w-full max-h-[500px] xl:max-h-[700px] object-contain drop-shadow-md rounded bg-white/50 p-1 border border-slate-100 ${isProcessingLocal ? 'opacity-40 grayscale' : 'opacity-100'}`}
                            />
                            
                            {/* Overlay Image (Original) */}
                            <img
                              ref={overlayImageRef}
                              src={activeImage.url}
                              alt="Original"
                              className="absolute max-w-full max-h-[500px] xl:max-h-[700px] object-contain drop-shadow-md rounded bg-white/50 p-1 border border-slate-100 pointer-events-none"
                              style={{ 
                                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` 
                              }}
                            />
                          
                            {/* Slider Handle */}
                            <div 
                              ref={sliderHandleRef}
                              className="absolute top-0 bottom-0 flex flex-col items-center justify-center z-10" 
                              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                            >
                               <div className="w-1 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] cursor-ew-resize" onMouseDown={() => setIsSliderDragging(true)} onTouchStart={() => setIsSliderDragging(true)}></div>
                               <div 
                                 className="absolute bg-blue-600 w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-ew-resize pointer-events-auto transform transition-transform hover:scale-110 active:scale-95"
                                 onMouseDown={() => setIsSliderDragging(true)} 
                                 onTouchStart={() => setIsSliderDragging(true)}
                               >
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l6-6-6-6M9 18l-6-6 6-6"/></svg>
                               </div>
                            </div>
                            
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none px-4">
                               <span className="bg-slate-800/70 text-white text-[11px] font-bold px-2 py-1 rounded backdrop-blur-sm">ORIGINAL</span>
                               <span className="bg-blue-600/80 text-white text-[11px] font-bold px-2 py-1 rounded backdrop-blur-sm">OPTIMIZED {activeProcessed && `(-${getSavingsPercentage(activeImage.size, activeProcessed.size)}%)`}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {activeImage && (
                        <div className="p-3 bg-blue-50/50 border-t border-blue-100 flex flex-col sm:flex-row gap-3 items-center z-10 w-full shrink-0">
                          <div className="flex-1 w-full">
                             <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Export Filename</label>
                             <input
                               type="text"
                               value={activeImage.exportName !== undefined ? activeImage.exportName : activeImage.name}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setImages(imgs => imgs.map(img => img.id === activeImage.id ? { ...img, exportName: val } : img));
                               }}
                               className="w-full text-[13px] px-2 py-1.5 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                             />
                          </div>
                          <div className="w-full sm:w-auto">
                             <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Export Format</label>
                             <select
                               value={activeImage.exportFormat || 'original'}
                               onChange={(e) => {
                                 const val = e.target.value as FileFormat | 'original';
                                 setImages(imgs => imgs.map(img => img.id === activeImage.id ? { ...img, exportFormat: val } : img));
                               }}
                               className="w-full sm:w-32 text-[13px] px-2 py-1.5 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                             >
                               <option value="original">Use Global</option>
                               <option value="image/jpeg">JPEG</option>
                               <option value="image/png">PNG</option>
                               <option value="image/webp">WebP</option>
                             </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ready for download section from design HTML - Desktop */}
                {images.length > 0 && (
                  <div className="bg-white px-6 py-5 rounded-xl border border-blue-100 flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm mb-4 hidden md:flex">
                    <div className="max-w-xl">
                      <div className="font-bold text-slate-800 mb-1 text-lg">Batch Processing Ready</div>
                      <div className="text-[13px] text-slate-500 leading-relaxed">
                        {images.length === 1 
                          ? "Your image has been optimized for the web resulting in a smaller footprint with preserved visuals."
                          : `${images.length} images are ready. Download them all as a convenient ZIP archive.`}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {images.length === 1 ? (
                        <a
                          href={activeProcessed?.url}
                          download={activeImage ? `${(activeImage.exportName || activeImage.name).replace(/\\.[^/.]+$/, "")}-optimized.${activeProcessed?.format.split('/')[1]}` : 'image'}
                          className={`font-bold py-3 px-8 rounded-lg shadow-md flex items-center justify-center whitespace-nowrap transition-all hover:-translate-y-0.5 ${
                            activeProcessed 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                          onClick={(e) => { if (!activeProcessed) e.preventDefault(); }}
                        >
                          Download Image
                        </a>
                      ) : (
                        <button
                          onClick={downloadAll}
                          disabled={isBatchProcessing}
                          className={`font-bold py-3 px-8 rounded-lg shadow-md flex items-center justify-center whitespace-nowrap transition-all hover:-translate-y-0.5 relative overflow-hidden ${
                            isBatchProcessing 
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isBatchProcessing ? (
                            <>
                              <div className="absolute inset-0 bg-blue-300 opacity-20" style={{ width: `${(batchProgress / batchTotal) * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin relative z-10" /> 
                              <span className="relative z-10">Compressing {batchProgress}/{batchTotal}</span>
                            </>
                          ) : (
                            <><Layers className="w-5 h-5 mr-2" /> Download All (ZIP)</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SEO Sections (Only visible on initial load / when no image is uploaded) */}
      {images.length === 0 && (
        <div className="w-full bg-white flex-1 relative z-10">
          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-8 border-t border-slate-200 w-full overflow-hidden">
            <div className="max-w-6xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How to Resize & Compress Images?</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">Optimize your images flawlessly in three simple steps without uploading to any external servers. Learn more <a href="#about" className="text-blue-600 hover:underline">about our philosophy here</a>.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative w-full">
                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center bg-white">
                  <div className="w-16 h-16 bg-blue-100text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 bg-white shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Upload your photo</h3>
                  <p className="text-slate-600 leading-relaxed">Drag and drop your JPEG, PNG, or WebP file into the container above to securely load it into your browser. Using <a href="#advanced-features" className="text-blue-600 hover:underline">advanced features</a> starts right away.</p>
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
          <section id="advanced-features" className="py-20 md:py-28 px-4 md:px-8 bg-slate-50 border-t border-slate-200">
            <div className="max-w-6xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Why Use Our Image Tool?</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">Designed for speed, built for privacy, delivering the best quality available on the web. Try uploading an image back at the <a href="#main-content" className="text-blue-600 hover:underline">top of the page</a>.</p>
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
                  We built our free <a href="#main-content" className="text-blue-600 hover:underline">image resizer and compressor</a> with a simple philosophy: digital tools should be straightforward, fast, and respectful of user data. With the web constantly shifting towards higher-quality visual assets, optimizing file sizes can be a chore. Using heavy desktop photography software is often overkill for simple bounding-box resizing or format conversions.
                </p>
                <p>
                  Our utility uses the native Canvas API provided by modern web browsers to shrink, scale, and compress images on the fly. Whether you are adjusting photography for social media, optimizing e-commerce product photos, or building lightning-fast <a href="#advanced-features" className="text-blue-600 hover:underline">mobile-friendly</a> websites, this tool gives you professional results for zero cost.
                </p>
                <p>
                  Furthermore, because page loading speed is a critical ranking factor for search engines, mastering image optimization is vital for Search Engine Optimization (SEO). Formats like WebP offer superior compression characteristics without visible degradation in quality, helping you ace your Core Web Vitals assessments. You can learn more about how this process works in our <a href="#how-it-works" className="text-blue-600 hover:underline">step-by-step guide</a> above.
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
                <li><a href="#advanced-features" className="text-slate-400 hover:text-white transition-colors text-sm">Resize JPEG</a></li>
                <li><a href="#advanced-features" className="text-slate-400 hover:text-white transition-colors text-sm">Compress PNG</a></li>
                <li><a href="#advanced-features" className="text-slate-400 hover:text-white transition-colors text-sm">Convert to WebP</a></li>
                <li><a href="#advanced-features" className="text-slate-400 hover:text-white transition-colors text-sm">Change Aspect Ratio</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">Company</h4>
              <ul className="space-y-3">
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How it Works</a></li>
                <li><a href="#main-content" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#main-content" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">Contact Us &amp; Social</h4>
              <address className="not-italic text-slate-400 text-sm space-y-3">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 min-w-[60px]">Email:</span>
                  <a href="mailto:support@imageresizer.com" className="hover:text-white transition-colors truncate block">support@imageresizer.com</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 min-w-[60px]">Phone:</span>
                  <a href="tel:+18001234567" className="hover:text-white transition-colors block">+1 (800) 123-4567</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 min-w-[60px]">Social:</span>
                  <a href="https://www.instagram.com/nitingaming947?igsh=enl6ZnFoMG0ydDJs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors block text-blue-400 underline decoration-blue-400/30 underline-offset-2">Instagram</a>
                </p>
                <p className="flex items-start gap-2 pt-1 border-t border-slate-800 mt-3">
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
