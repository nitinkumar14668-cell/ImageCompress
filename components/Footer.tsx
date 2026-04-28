import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      id="contact-section"
      className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 px-4 md:px-8 shrink-0 relative z-20"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 mb-12 border-b border-slate-800 pb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-slate-300">
                <ImageIcon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="font-bold text-white text-lg tracking-tight">
                Web Tools
              </div>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-6">
              The fastest way to compress, resize, extract text, and convert images 
              accurately in your web browser with zero server uploads required.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                Free Forever
              </span>
              <span className="text-[12px] font-bold tracking-wider uppercase text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                Privacy First
              </span>
            </div>
          </div>

          <nav aria-label="Footer Features Navigation">
            <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">
              Features
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Image Resizer
                </Link>
              </li>
              <li>
                <Link href="/image-to-text" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Image to Text (OCR)
                </Link>
              </li>
              <li>
                <Link href="/image-to-pdf" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Image to PDF
                </Link>
              </li>
              <li>
                <Link href="/image-crop" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Image Crop
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Footer Company Navigation">
            <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/#about" className="text-slate-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">
                  How it Works
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="text-white font-bold mb-4 tracking-wide uppercase text-sm">
              Contact Us &amp; Social
            </h4>
            <address className="not-italic text-slate-400 text-sm space-y-4">
              <div className="flex items-center gap-3 group">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Email</span>
                  <a href="mailto:nitinkumar14668@gmail.com" className="hover:text-blue-400 active:scale-[0.98] inline-block origin-left transition-all duration-200 truncate font-medium">
                    nitinkumar14668@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 group">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Phone</span>
                  <a href="tel:+919458049121" className="hover:text-emerald-400 active:scale-[0.98] inline-block origin-left transition-all duration-200 font-medium">
                    +91 9458049121
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 group">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-400 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Social</span>
                  <a href="https://www.instagram.com/nitingaming947?igsh=enl6ZnFoMG0ydDJs" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 active:scale-[0.98] inline-flex items-center gap-1.5 origin-left transition-all duration-200 font-medium">
                    Instagram
                  </a>
                </div>
              </div>
            </address>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Web Tools. All rights reserved.</p>
          <p>Made with privacy in mind.</p>
        </div>
      </div>
    </footer>
  );
}
