import React from 'react';
import { GalleryItem } from '../data/schoolData';

interface LightboxModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-[#021936] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close image preview"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="relative max-h-[75vh] flex items-center justify-center bg-black">
          <img
            src={item.imageUrl}
            alt={item.altText}
            className="w-full h-auto max-h-[75vh] object-contain"
          />
        </div>

        <div className="p-6 bg-[#021936] text-white">
          <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block mb-1">
            {item.subtitle}
          </span>
          <h3 className="text-xl font-bold font-serif text-white">{item.title}</h3>
          <p className="text-xs sm:text-sm text-[#8396b9] mt-2 leading-relaxed">
            {item.altText}
          </p>
        </div>
      </div>
    </div>
  );
};
