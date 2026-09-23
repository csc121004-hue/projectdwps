import React from 'react';
import { SCHOOL_INFO, HOTLINK_IMAGES } from '../data/schoolData';

interface HeroProps {
  onEnrollClick: () => void;
  onCampusTourClick: () => void;
  onFeeCalculatorClick?: () => void;
}

export const HeroSection: React.FC<HeroProps> = ({ onEnrollClick, onCampusTourClick, onFeeCalculatorClick }) => {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-[#F2F8FD] via-[#f7f9ff] to-[#f7f9ff]"
    >
      {/* Decorative architectural background element */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#ffdcc3]/50 blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-[#dce3ec]/60 blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Admission Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDE68A]/50 border border-[#904d00]/25 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#904d00] animate-ping"></span>
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Admissions Open {SCHOOL_INFO.academicYear} Session
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] lg:leading-[64px] font-bold text-[#021936] tracking-tight font-serif text-balance">
              Where Education Meets{' '}
              <span className="italic text-[#904d00] font-normal underline decoration-[#FDE68A] decoration-4 underline-offset-8">
                Inspiration.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#44474e] max-w-2xl leading-relaxed">
              Located in the heart of <strong className="text-[#021936] font-semibold">{SCHOOL_INFO.locationTag}</strong>, Disney World Public School nurtures curiosity, builds character, and fosters academic excellence from Playgroup to Grade School.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-3.5">
              <button
                onClick={onEnrollClick}
                className="inline-flex items-center justify-center text-sm font-bold bg-[#904d00] hover:bg-[#B45309] text-white px-6 sm:px-7 py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">school</span>
                Enroll for {SCHOOL_INFO.academicYear}
              </button>

              {onFeeCalculatorClick && (
                <button
                  onClick={onFeeCalculatorClick}
                  className="inline-flex items-center justify-center text-sm font-bold bg-[#021936] hover:bg-[#1a2e4c] text-white px-5 sm:px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-[#FDE68A]">calculate</span>
                  Fee Calculator
                </button>
              )}

              <a
                className="inline-flex items-center justify-center text-sm font-semibold bg-white text-[#021936] hover:text-[#904d00] border-2 border-[#1a2e4c]/20 hover:border-[#904d00]/50 px-5 sm:px-6 py-3.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 gap-2"
                href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}?text=Hello%20DWPS%20Ballabgarh,%20I%20would%20like%20to%20know%20more%20about%20curriculum%20and%20admissions.`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="material-symbols-outlined text-[#25D366] text-xl">chat</span>
                WhatsApp Desk
              </a>
            </div>

            {/* Authentic Trust Badges */}
            <div className="pt-6 border-t border-[#dce3ec] grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#904d00] text-xl">verified_user</span>
                <span className="text-xs font-semibold text-[#021936]">Safe Campus</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#904d00] text-xl">diversity_3</span>
                <span className="text-xs font-semibold text-[#021936]">Holistic Growth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#904d00] text-xl">psychology</span>
                <span className="text-xs font-semibold text-[#021936]">Expert Faculty</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#904d00] text-xl">auto_stories</span>
                <span className="text-xs font-semibold text-[#021936]">Playgroup to Grade</span>
              </div>
            </div>
          </div>

          {/* Hero Graphic Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Backdrop Frame offset */}
              <div className="absolute inset-0 bg-[#1a2e4c] rounded-2xl transform rotate-2 translate-x-2 translate-y-2 opacity-10"></div>
              
              <div className="relative bg-white rounded-2xl p-5 sm:p-6 custom-shadow-card border border-[#dce3ec]/80">
                <div className="relative overflow-hidden rounded-xl h-64 sm:h-80 bg-[#e8eef7] flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    alt="A bright, cheerful Indian elementary classroom filled with smiling young students dressed in neat uniforms engaging enthusiastically with their teacher in a sunlit modern schoolroom."
                    src={HOTLINK_IMAGES.heroClassroom}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#021936]/85 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FDE68A] block">
                      Subhash Colony Campus
                    </span>
                    <p className="text-lg sm:text-xl font-bold font-serif leading-tight mt-0.5">
                      Inspiring Young Minds Daily
                    </p>
                  </div>
                </div>

                {/* Live Notification Card Floater */}
                <div className="mt-4 p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#904d00]/10 flex items-center justify-center flex-shrink-0 text-[#904d00]">
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-[#021936]">
                      Academic Session {SCHOOL_INFO.academicYear}
                    </h2>
                    <p className="text-[11px] text-[#44474e]">
                      Registrations are strictly reviewed on a first-come, first-served basis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
