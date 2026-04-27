import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Resizer from './pages/Resizer';
import ImageToText from './pages/ImageToText';
import ImageToPdf from './pages/ImageToPdf';
import ImageCrop from './pages/ImageCrop';
import Footer from './components/Footer';
import { Layers, FileText, FileDown, Crop as CropIcon, Image as ImageIcon } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  const links = [
    { name: "Resizer", path: "/", icon: <Layers className="w-4 h-4" /> },
    { name: "Image to Text", path: "/image-to-text", icon: <FileText className="w-4 h-4" /> },
    { name: "Image to PDF", path: "/image-to-pdf", icon: <FileDown className="w-4 h-4" /> },
    { name: "Image Crop", path: "/image-crop", icon: <CropIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-blue-600 flex items-center justify-center bg-blue-50 p-2 rounded-lg">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 leading-tight">
              <span className="text-blue-600">Web</span> Tools
            </div>
          </Link>
          <div className="flex items-center overflow-x-auto hide-scrollbar space-x-1 pb-1 md:pb-0">
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
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Resizer />} />
            <Route path="/image-to-text" element={<ImageToText />} />
            <Route path="/image-to-pdf" element={<ImageToPdf />} />
            <Route path="/image-crop" element={<ImageCrop />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
