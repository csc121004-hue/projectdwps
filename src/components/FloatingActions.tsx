import React, { useState } from 'react';
import { SCHOOL_INFO } from '../data/schoolData';

interface FloatingActionsProps {
  onOpenTourModal: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenTourModal }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
      {/* Quick Option: Book Tour */}
      <button
        onClick={onOpenTourModal}
        title="Schedule Campus Tour"
        className="px-4 py-2.5 rounded-full bg-[#021936] text-white border border-[#1a2e4c] shadow-lg hover:shadow-xl hover:bg-[#1a2e4c] transition-all flex items-center gap-2 text-xs font-bold group cursor-pointer"
      >
        <span className="material-symbols-outlined text-base text-[#FDE68A]">calendar_month</span>
        <span className="hidden sm:inline">Book Campus Tour</span>
      </button>

      {/* Floating WhatsApp Action (Exactly as in prompt HTML) */}
      <a
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group relative"
        href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}?text=Hello%20DWPS%20Ballabgarh,%20I%20want%20to%20inquire%20about%20Admissions%20for%20the%20${SCHOOL_INFO.academicYear}%20academic%20year.`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="material-symbols-outlined text-3xl">chat</span>
        <span className="absolute right-16 bg-[#021936] text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
};
