import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Resizer from './pages/Resizer';
import ImageToText from './pages/ImageToText';
import ImageToPdf from './pages/ImageToPdf';
import ImageCrop from './pages/ImageCrop';
import { Layers, FileText, FileDown, Crop as CropIcon } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  const links = [
    { name: "Resizer & Compressor", path: "/", icon: <Layers className="w-4 h-4" /> },
    { name: "Image to Text", path: "/image-to-text", icon: <FileText className="w-4 h-4" /> },
    { name: "Image to PDF", path: "/image-to-pdf", icon: <FileDown className="w-4 h-4" /> },
    { name: "Image Crop", path: "/image-crop", icon: <CropIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center overflow-x-auto hide-scrollbar space-x-1 py-3">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* We are placing Navigation at the top. Note: the Resizer page has its own inner header, 
          which will show up below this. For a rapid feature addition, this is totally fine and gives 
          the user an immediate way to access the new tools. */}
      <Navigation />
      <Routes>
        <Route path="/" element={<Resizer />} />
        <Route path="/image-to-text" element={<ImageToText />} />
        <Route path="/image-to-pdf" element={<ImageToPdf />} />
        <Route path="/image-crop" element={<ImageCrop />} />
      </Routes>
    </BrowserRouter>
  );
}
