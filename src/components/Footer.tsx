import React from 'react';
import { SCHOOL_INFO, HOTLINK_IMAGES } from '../data/schoolData';
import { ScreenType } from './Header';

interface FooterProps {
  onNavigate: (screen: ScreenType, sectionId?: string) => void;
  onOpenPrivacyModal?: () => void;
  onOpenTermsModal?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPrivacyModal,
  onOpenTermsModal,
  onOpenAdminLogin
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#021936] text-white border-t border-[#1a2e4c]">
      <div className="w-full py-16 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#1a2e4c]">
          {/* Logo and About Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg p-1 bg-white flex items-center justify-center shadow-sm">
                <img
                  alt="School Crest Logo"
                  className="h-10 w-auto object-contain"
                  src={HOTLINK_IMAGES.crestLogo}
                />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-serif text-white block leading-tight">
                  {SCHOOL_INFO.name}
                </span>
                <p className="text-xs text-[#FDE68A] font-semibold tracking-wider uppercase">
                  {SCHOOL_INFO.motto}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#8396b9] leading-relaxed max-w-sm">
              Nurturing curiosity, building character, and achieving academic excellence. Providing a safe, stimulating learning community from Playgroup to Grade School in Ballabgarh.
            </p>

            <div className="pt-2 text-xs text-[#8396b9]">
              <span className="text-white font-semibold">Campus:</span> {SCHOOL_INFO.address}
            </div>
          </div>

          {/* Links Column 1: Quick Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-base font-bold text-white font-serif">Quick Navigation</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onNavigate('admissions', 'admissions-form')}
                  className="text-[#FDE68A] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Admissions {SCHOOL_INFO.academicYear}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('our-team')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Our Dedicated Team
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('academics')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Academic Calendar &amp; Wings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Mandatory Disclosures &amp; Ethos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('facilities')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Campus Safety &amp; Transport
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('newsletters')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  School Newsletters &amp; Bulletins
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact', 'contact')}
                  className="text-[#8396b9] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  Contact Us
                </button>
              </li>
              {onOpenAdminLogin && (
                <li className="pt-1 border-t border-[#1a2e4c]">
                  <button
                    onClick={onOpenAdminLogin}
                    className="text-[#fe932c] hover:underline flex items-center gap-1.5 cursor-pointer text-left font-semibold"
                  >
                    <span className="material-symbols-outlined text-xs">lock</span>
                    Staff &amp; Admin Portal
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Links Column 2: Hours & Direct Line */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-base font-bold text-white font-serif">Admissions Helpdesk</h4>
            <p className="text-xs sm:text-sm text-[#8396b9]">
              Our admissions office is open six days a week for parents to consult our educators.
            </p>

            <div className="p-4 rounded-xl bg-[#1a2e4c]/60 border border-[#1a2e4c] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-white">
                <span className="text-[#8396b9]">Helpline:</span>
                <a
                  className="font-bold text-[#FDE68A] hover:underline"
                  href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
                >
                  {SCHOOL_INFO.phone}
                </a>
              </div>
              <div className="flex items-center justify-between text-white">
                <span className="text-[#8396b9]">Email:</span>
                <a
                  className="font-medium hover:underline text-slate-200"
                  href={`mailto:${SCHOOL_INFO.email}`}
                >
                  {SCHOOL_INFO.email}
                </a>
              </div>
              <div className="flex items-center justify-between text-white">
                <span className="text-[#8396b9]">Office Hours:</span>
                <span className="font-medium text-slate-200">{SCHOOL_INFO.officeHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Copyright & Compliance Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8396b9]">
          <p>© 2026 {SCHOOL_INFO.name}. All rights reserved. Affiliation &amp; Registration compliant.</p>
          <div className="flex items-center gap-5 sm:gap-6">
            <button
              onClick={onOpenPrivacyModal}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={onOpenTermsModal}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Admission
            </button>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="hover:text-[#FDE68A] transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              Back to Top
              <span className="material-symbols-outlined text-xs">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
