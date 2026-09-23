import React, { useState } from 'react';
import { SCHOOL_INFO, HOTLINK_IMAGES } from '../data/schoolData';

export type ScreenType = 'home' | 'about' | 'academics' | 'admissions' | 'facilities' | 'our-team' | 'contact';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType, sectionId?: string) => void;
  onOpenTourModal: () => void;
  onOpenInquiriesDrawer: () => void;
  inquiryCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenTourModal,
  onOpenInquiriesDrawer,
  inquiryCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (screen: ScreenType, sectionId?: string) => {
    onNavigate(screen, sectionId);
    setMobileMenuOpen(false);
  };

  const navItems: { label: string; screen: ScreenType; sectionId?: string }[] = [
    { label: 'Home', screen: 'home', sectionId: 'home' },
    { label: 'About Us', screen: 'about', sectionId: 'about' },
    { label: 'Our Team', screen: 'our-team', sectionId: 'our-team' },
    { label: 'Academics & Programs', screen: 'academics', sectionId: 'academics' },
    { label: 'Admissions 2026-27', screen: 'admissions', sectionId: 'admissions' },
    { label: 'Facilities', screen: 'facilities', sectionId: 'facilities' },
    { label: 'Contact', screen: 'contact', sectionId: 'contact' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md text-[#021936] border-b border-[#dce3ec] shadow-sm sticky top-0 z-50 transition-all duration-200">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto h-20">
        {/* Brand Crest & Identity */}
        <button
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-3.5 group text-left focus:outline-none"
        >
          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg p-1 bg-white shadow-sm border border-[#dce3ec] flex items-center justify-center">
            <img
              alt="School Crest Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              src={HOTLINK_IMAGES.crestLogo}
              onError={(e) => {
                // Fallback shield if network is restricted
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Fallback Shield Icon if image error */}
            <span className="material-symbols-outlined text-2xl text-[#904d00] hidden">
              shield
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] sm:text-[20px] font-bold text-[#021936] tracking-tight leading-tight font-serif">
              {SCHOOL_INFO.name}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#904d00] tracking-widest uppercase">
              {SCHOOL_INFO.motto} • Subhash Colony
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={item.label}
                onClick={() => handleLinkClick(item.screen, item.sectionId)}
                className={`text-[14px] font-semibold transition-colors duration-150 py-1 cursor-pointer ${
                  isActive
                    ? 'text-[#904d00] border-b-2 border-[#904d00]'
                    : 'text-[#44474e] hover:text-[#021936]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Cluster */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={() => handleLinkClick('admissions', 'admissions-form')}
            className="text-[13px] font-semibold text-[#021936] hover:text-[#904d00] hover:bg-[#eef4fd] px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >
            Inquire Now
          </button>
          
          <button
            onClick={() => handleLinkClick('admissions', 'admissions-form')}
            className="inline-flex items-center justify-center text-[13px] font-bold bg-[#904d00] hover:bg-[#B45309] text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all active:scale-95 duration-150 gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            Apply for Admission
          </button>

          {/* Inquiries Desk Trigger for school admin / parent tracking */}
          <button
            onClick={onOpenInquiriesDrawer}
            title="Admissions Helpdesk Log"
            className="p-2 text-[#1a2e4c] hover:bg-[#eef4fd] rounded-lg transition-colors relative"
            aria-label="View Inquiries"
          >
            <span className="material-symbols-outlined text-xl">folder_shared</span>
            {inquiryCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B91C1C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {inquiryCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenInquiriesDrawer}
            className="p-1.5 text-[#021936] rounded-lg hover:bg-slate-100"
            aria-label="Inquiries desk"
          >
            <span className="material-symbols-outlined text-xl">folder_shared</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#021936] hover:bg-slate-100 rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#dce3ec] bg-white px-6 py-5 shadow-lg space-y-4">
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleLinkClick(item.screen, item.sectionId)}
                className={`text-left text-sm font-semibold py-2 transition-colors ${
                  currentScreen === item.screen
                    ? 'text-[#904d00] font-bold pl-2 border-l-4 border-[#904d00]'
                    : 'text-[#44474e]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#dce3ec] flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTourModal();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#F2F8FD] text-[#021936] font-semibold text-sm border border-[#dce3ec] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base text-[#904d00]">calendar_month</span>
              Book Campus Tour
            </button>
            <button
              onClick={() => handleLinkClick('admissions', 'admissions-form')}
              className="w-full py-3 px-4 rounded-lg bg-[#904d00] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              Apply for Admission (2026-27)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
