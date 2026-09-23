import React from 'react';
import { SCHOOL_INFO } from '../data/schoolData';

interface Props {
  onOpenInquiry?: () => void;
}

export const NotificationStrip: React.FC<Props> = ({ onOpenInquiry }) => {
  return (
    <aside
      aria-label="Announcement"
      className="bg-[#021936] text-white py-2.5 px-4 text-xs font-medium border-b border-[#1a2e4c] relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#fe932c] text-[#663500] text-[11px] font-bold uppercase tracking-wider animate-pulse">
            Alert
          </span>
          <span className="font-semibold tracking-wide text-[#FDE68A]">
            !! ADMISSIONS OPEN {SCHOOL_INFO.academicYear} !!
          </span>
          <span className="hidden md:inline text-[#8396b9] font-light">|</span>
          <span className="hidden md:inline text-[#F2F8FD] font-normal">
            Playgroup to Grade School • {SCHOOL_INFO.locationTag}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <a
            className="flex items-center gap-1.5 hover:text-[#FDE68A] transition-colors"
            href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
          >
            <span className="material-symbols-outlined text-sm">call</span>
            <span>{SCHOOL_INFO.phone}</span>
          </a>
          <span className="text-[#8396b9]">|</span>
          <a
            className="hidden sm:flex items-center gap-1.5 hover:text-[#FDE68A] transition-colors"
            href={`mailto:${SCHOOL_INFO.email}`}
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            <span>{SCHOOL_INFO.email}</span>
          </a>
          <a
            className="inline-flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-0.5 rounded-full font-bold hover:brightness-110 transition-all text-[11px] shadow-sm"
            href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}?text=Hello%20DWPS%20Ballabgarh,%20I%20would%20like%20to%20inquire%20about%20Admissions%20${SCHOOL_INFO.academicYear}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[13px]">chat</span>
            WhatsApp
          </a>
        </div>
      </div>
    </aside>
  );
};
