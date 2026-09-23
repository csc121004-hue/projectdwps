import React, { useState } from 'react';
import { SCHOOL_INFO, BUS_ROUTES, GALLERY_ITEMS, GalleryItem } from '../data/schoolData';

interface FacilitiesViewProps {
  onImageClick: (item: GalleryItem) => void;
  onBookTourClick: () => void;
}

export const FacilitiesView: React.FC<FacilitiesViewProps> = ({ onImageClick, onBookTourClick }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const facilityHighlights = [
    {
      title: 'Digital Smart Classrooms',
      icon: 'devices',
      desc: 'Interactive smart boards, audiovisual animations, and multimedia learning modules for visual learners.'
    },
    {
      title: 'Science & Discovery Labs',
      icon: 'biotech',
      desc: 'Safe hands-on STEM experiments, microscope stations, and conceptual apparatus for experiential science.'
    },
    {
      title: 'Outdoor Athletics & Play Zone',
      icon: 'sports_baseball',
      desc: 'Dedicated field for track races, football, cricket nets, badminton, and supervised recreational recess.'
    },
    {
      title: 'Montessori Early Years Studio',
      icon: 'toys',
      desc: 'Cushioned flooring, sensory building blocks, storytelling amphitheater, and child-safe play apparatus.'
    },
    {
      title: 'Music & Performing Arts Wing',
      icon: 'music_note',
      desc: 'Harmonium, tabla, keyboards, and acoustic space for classical Indian vocal music, drama, and annual day rehearsals.'
    },
    {
      title: 'Safe Fleet Transport',
      icon: 'directions_bus',
      desc: 'GPS-enabled school buses with vetted drivers, speed governors, and trained lady attendants on every route.'
    }
  ];

  const safetyItems = [
    { title: '24/7 CCTV Surveillance', desc: 'Comprehensive camera coverage across entry gates, corridors, and play zones.' },
    { title: 'Purified RO Drinking Water', desc: 'Commercial grade multi-stage RO filtration plants tested monthly.' },
    { title: 'Full Background Verification', desc: 'Police verified teaching staff, transport drivers, and support personnel.' },
    { title: 'First Aid & Health Infirmary', desc: 'Stocked medical room with qualified nursing assistance on call.' }
  ];

  return (
    <div className="py-12 bg-[#f7f9ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-16">
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Subhash Colony Campus
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936]">
            Modern Facilities Built for Joy, Safety &amp; Exploration
          </h1>
          <p className="text-sm sm:text-base text-[#44474e]">
            A vibrant learning ecosystem equipped with interactive smart technology, secure play areas, and dedicated pastoral care.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilityHighlights.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-[#dce3ec] custom-shadow-card flex flex-col justify-between hover:border-[#904d00]/50 transition-colors"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F2F8FD] text-[#904d00] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-base font-bold text-[#021936] mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Gallery Preview */}
        <div className="bg-white rounded-2xl p-8 border border-[#dce3ec] custom-shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Photo Tour
              </span>
              <h2 className="text-2xl font-bold font-serif text-[#021936]">
                Campus Life in Action
              </h2>
            </div>
            <button
              onClick={onBookTourClick}
              className="py-2.5 px-4 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold transition-colors"
            >
              Book In-Person Campus Walkthrough
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => onImageClick(item)}
                className="group relative h-64 rounded-xl overflow-hidden cursor-pointer bg-slate-100 shadow-xs"
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] text-[#FDE68A] uppercase font-bold tracking-wider block">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold">{item.subtitle}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bus Routes & Transport Network */}
        <div className="bg-white rounded-2xl p-8 border border-[#dce3ec] custom-shadow-card">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              Safe Commute
            </span>
            <h3 className="text-2xl font-bold font-serif text-[#021936] mt-1">
              School Bus Transport &amp; Coverage Zones
            </h3>
            <p className="text-xs sm:text-sm text-[#44474e] mt-1">
              Serving residential neighborhoods throughout Ballabgarh and surrounding sectors with dependable pickup and drop-off points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUS_ROUTES.map((route, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[#021936] text-[#FDE68A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">directions_bus</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#021936]">{route.route}</h4>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#dce3ec] text-slate-600 font-semibold">
                      {route.stops} Designated Stops
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{route.coverage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Health Protocols */}
        <div className="bg-[#021936] text-white rounded-2xl p-8 lg:p-10 border border-[#1a2e4c]">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider">
              Safety Commitment
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1">
              Uncompromising Safety &amp; Hygiene Standards
            </h3>
            <p className="text-xs sm:text-sm text-[#8396b9] mt-2">
              Every measure is actively implemented so parents can entrust their children with absolute peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {safetyItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#1a2e4c]/70 border border-[#8396b9]/20 space-y-2">
                <span className="material-symbols-outlined text-2xl text-[#FDE68A]">verified_user</span>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-[#8396b9] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
