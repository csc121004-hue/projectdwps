import React from 'react';
import { GALLERY_ITEMS, GalleryItem } from '../data/schoolData';

interface GallerySectionProps {
  onImageClick: (item: GalleryItem) => void;
  onViewAllFacilities?: () => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ onImageClick, onViewAllFacilities }) => {
  return (
    <section id="facilities" className="py-20 bg-[#F2F8FD] border-t border-[#dce3ec]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
            Campus Life &amp; Activities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-serif text-[#021936]">
            Gallery: Moments of Learning, Fun &amp; Growth
          </h2>
          <p className="text-sm sm:text-base text-[#44474e]">
            A glimpse into the daily joy, creative expressions, and milestone events at Disney World Public School Ballabgarh.
          </p>
        </div>

        {/* Bento Grid Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => onImageClick(item)}
              className={`${item.colSpan || 'md:col-span-4'} group relative overflow-hidden rounded-2xl bg-[#e8eef7] ${
                item.height || 'h-72'
              } custom-shadow-card cursor-pointer`}
            >
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={item.altText}
                src={item.imageUrl}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021936]/85 via-[#021936]/25 to-transparent transition-opacity group-hover:from-[#021936]/90"></div>
              
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block">
                  {item.subtitle}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-1">
                  {item.title}
                </h3>
              </div>

              {/* Click to expand badge icon */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-lg">zoom_in</span>
              </div>
            </div>
          ))}
        </div>

        {onViewAllFacilities && (
          <div className="mt-10 text-center">
            <button
              onClick={onViewAllFacilities}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-[#dce3ec] text-sm font-bold text-[#021936] hover:text-[#904d00] hover:border-[#904d00] transition-colors custom-shadow-card"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              Explore All Campus Facilities &amp; Transport
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
