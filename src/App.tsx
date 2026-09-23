import React, { useState } from 'react';
import { NotificationStrip } from './components/NotificationStrip';
import { Header, ScreenType } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PillarsBar } from './components/PillarsBar';
import { AboutSection } from './components/AboutSection';
import { CurriculumSection } from './components/CurriculumSection';
import { ServicesSection } from './components/ServicesSection';
import { GallerySection } from './components/GallerySection';
import { AdmissionsSection } from './components/AdmissionsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { LightboxModal } from './components/LightboxModal';
import { CampusTourModal } from './components/CampusTourModal';
import { InquiriesDrawer } from './components/InquiriesDrawer';
import { AcademicsView } from './components/AcademicsView';
import { AdmissionsView } from './components/AdmissionsView';
import { FacilitiesView } from './components/FacilitiesView';
import { AboutView } from './components/AboutView';
import { OurTeamView } from './components/OurTeamView';
import { NewsTicker } from './components/NewsTicker';
import { GalleryItem, InquiryRecord, INITIAL_INQUIRIES, SCHOOL_INFO } from './data/schoolData';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isInquiriesDrawerOpen, setIsInquiriesDrawerOpen] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>(INITIAL_INQUIRIES);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleNavigate = (screen: ScreenType, sectionId?: string) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId && (screen === 'home' || screen === 'admissions')) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleNewInquirySubmitted = (newInquiry: InquiryRecord) => {
    setInquiries((prev) => [newInquiry, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9ff] text-[#151c23]">
      {/* 1. Top Alert Notification Strip */}
      <NotificationStrip onOpenInquiry={() => handleNavigate('admissions', 'admissions-form')} />

      {/* 2. Institutional Sticky Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenTourModal={() => setIsTourModalOpen(true)}
        onOpenInquiriesDrawer={() => setIsInquiriesDrawerOpen(true)}
        inquiryCount={inquiries.length}
      />

      {/* 3. Main Screen View Switcher */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          <>
            {/* Top of Homepage: Scrolling News Ticker for latest notices & event dates */}
            <NewsTicker
              onOpenInquiry={() => {
                const el = document.getElementById('admissions');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleNavigate('admissions', 'admissions-form');
                }
              }}
              onOpenTourModal={() => setIsTourModalOpen(true)}
            />

            {/* Hero Section */}
            <HeroSection
              onEnrollClick={() => {
                const el = document.getElementById('admissions');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleNavigate('admissions', 'admissions-form');
                }
              }}
              onCampusTourClick={() => setIsTourModalOpen(true)}
              onFeeCalculatorClick={() => {
                const el = document.getElementById('admissions');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleNavigate('admissions');
                }
              }}
            />

            {/* 4 Pillars Stats Bar */}
            <PillarsBar />

            {/* About School Section */}
            <AboutSection
              onScheduleTour={() => setIsTourModalOpen(true)}
              onExploreMore={() => handleNavigate('about')}
              onMeetTeam={() => handleNavigate('our-team')}
            />

            {/* Curriculum Wings */}
            <CurriculumSection
              onSelectTier={(tierId) => {
                handleNavigate('academics');
              }}
            />

            {/* Core Services & Pillars */}
            <ServicesSection />

            {/* Bento Grid Gallery Section */}
            <GallerySection
              onImageClick={(item) => setSelectedGalleryItem(item)}
              onViewAllFacilities={() => handleNavigate('facilities')}
            />

            {/* 4-Step Admissions Guide, Interactive Fee Calculator & Inquiry Form */}
            <AdmissionsSection
              onNewInquirySubmitted={handleNewInquirySubmitted}
              onBookTourClick={() => setIsTourModalOpen(true)}
            />

            {/* Campus Visit & Contact Details */}
            <ContactSection />
          </>
        )}

        {currentScreen === 'our-team' && (
          <OurTeamView
            onBookTourClick={() => setIsTourModalOpen(true)}
            onApplyClick={() => handleNavigate('admissions', 'admissions-form')}
          />
        )}

        {currentScreen === 'academics' && (
          <AcademicsView
            onApplyClick={() => handleNavigate('admissions', 'admissions-form')}
            onBookTourClick={() => setIsTourModalOpen(true)}
          />
        )}

        {currentScreen === 'admissions' && (
          <AdmissionsView
            onNewInquirySubmitted={handleNewInquirySubmitted}
            onBookTourClick={() => setIsTourModalOpen(true)}
            onApplyClick={() => handleNavigate('admissions', 'admissions-form')}
          />
        )}

        {currentScreen === 'facilities' && (
          <FacilitiesView
            onImageClick={(item) => setSelectedGalleryItem(item)}
            onBookTourClick={() => setIsTourModalOpen(true)}
          />
        )}

        {currentScreen === 'about' && (
          <AboutView
            onBookTourClick={() => setIsTourModalOpen(true)}
            onApplyClick={() => handleNavigate('admissions', 'admissions-form')}
            onMeetTeamClick={() => handleNavigate('our-team')}
          />
        )}

        {currentScreen === 'contact' && (
          <div className="py-8">
            <ContactSection />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 pt-8 pb-16">
              <div className="bg-white p-8 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold font-serif text-[#021936]">
                    Plan Your Visit to Subhash Colony
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-xl">
                    Located in Ballabgarh with convenient access from Faridabad By-Pass and local transit routes. Visitor parking and counselor appointments available daily.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsTourModalOpen(true)}
                    className="py-3 px-5 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold transition-colors"
                  >
                    Schedule Campus Tour Pass
                  </button>
                  <a
                    href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-lg bg-[#25D366] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Institutional Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenPrivacyModal={() => setShowPrivacyModal(true)}
        onOpenTermsModal={() => setShowTermsModal(true)}
      />

      {/* 5. Persistent Floating Actions */}
      <FloatingActions onOpenTourModal={() => setIsTourModalOpen(true)} />

      {/* 6. Lightbox Full-Screen Modal */}
      <LightboxModal
        item={selectedGalleryItem}
        onClose={() => setSelectedGalleryItem(null)}
      />

      {/* 7. Book Campus Tour Modal */}
      <CampusTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
      />

      {/* 8. Admissions Office Inquiries Desk Drawer */}
      <InquiriesDrawer
        isOpen={isInquiriesDrawerOpen}
        onClose={() => setIsInquiriesDrawerOpen(false)}
        inquiries={inquiries}
      />

      {/* 9. Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold font-serif text-[#021936]">Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>{SCHOOL_INFO.name}</strong> is committed to preserving the privacy of every parent, student, and website visitor.
              </p>
              <p>
                Information collected via admission inquiry forms (including names, telephone numbers, student birth dates, and residential addresses) is utilized strictly for admission counseling, school communications, and statutory educational records.
              </p>
              <p>
                We do not sell, rent, or share personal contact data with third-party advertisers. All physical and digital records are protected under institutional data privacy safeguards.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 bg-[#021936] text-white rounded-lg text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 10. Terms of Admission Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold font-serif text-[#021936]">Terms of Admission</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                1. <strong>Session 2026-27 Enrollment:</strong> Admissions are granted subject to availability of seats in the requested class and verification of submitted documentation.
              </p>
              <p>
                2. <strong>Age Criteria:</strong> Age eligibility is evaluated according to state educational guidelines as on March 31, 2026.
              </p>
              <p>
                3. <strong>Fee Policy:</strong> Tuition and transport fees are payable on a quarterly schedule. Receipt of payment confirms child seat reservation.
              </p>
              <p>
                4. <strong>Conduct &amp; Community:</strong> Both parents and students agree to observe school community values of mutual respect, punctuality, and regular attendance.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 bg-[#021936] text-white rounded-lg text-xs font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
