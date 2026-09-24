import React, { useState, useEffect } from 'react';
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
import { NewsletterView } from './components/NewsletterView';
import { SchoolAdminDashboard } from './components/SchoolAdminDashboard';
import { SchoolAdminLoginModal } from './components/SchoolAdminLoginModal';
import { NeonDbStatusModal } from './components/NeonDbStatusModal';
import { api } from './services/api';
import {
  GalleryItem,
  InquiryRecord,
  NewsletterItem,
  SchoolAnnouncement,
  INITIAL_INQUIRIES,
  INITIAL_NEWSLETTERS,
  SCHOOL_ANNOUNCEMENTS,
  SCHOOL_INFO
} from './data/schoolData';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isInquiriesDrawerOpen, setIsInquiriesDrawerOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);

  // Persistent Inquiries State
  const [inquiries, setInquiries] = useState<InquiryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('dwps_inquiries');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse inquiries from localStorage', e);
    }
    return INITIAL_INQUIRIES;
  });

  // Persistent Newsletters State (Updates go live immediately!)
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>(() => {
    try {
      const saved = localStorage.getItem('dwps_newsletters');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse newsletters from localStorage', e);
    }
    return INITIAL_NEWSLETTERS;
  });

  // Persistent Announcements & Upcoming Updates State (Live on website immediately!)
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('dwps_announcements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse announcements from localStorage', e);
    }
    return SCHOOL_ANNOUNCEMENTS;
  });

  // Admin User Session State
  const [adminUser, setAdminUser] = useState<{ name: string; role: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('dwps_admin_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse admin session', e);
    }
    return null;
  });

  // Sync with Neon DB on startup if connected
  useEffect(() => {
    let isMounted = true;
    async function syncWithDatabase() {
      try {
        const [dbInquiries, dbAnnouncements] = await Promise.all([
          api.getInquiries(),
          api.getAnnouncements()
        ]);
        if (!isMounted) return;
        if (dbInquiries && dbInquiries.length > 0) {
          setInquiries(dbInquiries);
        }
        if (dbAnnouncements && dbAnnouncements.length > 0) {
          setAnnouncements(dbAnnouncements);
        }
      } catch (err) {
        console.warn('Database initial sync note:', err);
      }
    }
    syncWithDatabase();
    return () => { isMounted = false; };
  }, []);

  const handleNavigate = (screen: ScreenType, sectionId?: string) => {
    if (screen === 'admin-dashboard' && !adminUser) {
      setIsAdminLoginOpen(true);
      return;
    }

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

  const handleUpdateInquiries = (updated: InquiryRecord[]) => {
    setInquiries(updated);
    try {
      localStorage.setItem('dwps_inquiries', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save inquiries to localStorage', e);
    }
  };

  const handleNewInquirySubmitted = (newInquiry: InquiryRecord) => {
    const updated = [newInquiry, ...inquiries];
    handleUpdateInquiries(updated);
    // Persist to Neon DB
    api.saveInquiry(newInquiry).catch((err) => {
      console.warn('Inquiry DB sync note:', err);
    });
  };

  const handleUpdateNewsletters = (updated: NewsletterItem[]) => {
    setNewsletters(updated);
    try {
      localStorage.setItem('dwps_newsletters', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save newsletters to localStorage', e);
    }
  };

  const handleUpdateAnnouncements = (updated: SchoolAnnouncement[]) => {
    setAnnouncements(updated);
    try {
      localStorage.setItem('dwps_announcements', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save announcements to localStorage', e);
    }
    if (updated[0]) {
      api.saveAnnouncement(updated[0]).catch(console.warn);
    }
  };

  const handleAdminLoginSuccess = (user: { name: string; role: string; email: string }) => {
    setAdminUser(user);
    setIsAdminLoginOpen(false);
    setCurrentScreen('admin-dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('dwps_admin_session');
    setAdminUser(null);
    setCurrentScreen('home');
  };

  // If in School Admin Dashboard mode, render full-screen Admin Suite
  if (currentScreen === 'admin-dashboard' && adminUser) {
    return (
      <>
        <SchoolAdminDashboard
          currentUser={adminUser}
          inquiries={inquiries}
          newsletters={newsletters}
          announcements={announcements}
          onUpdateInquiries={handleUpdateInquiries}
          onUpdateNewsletters={handleUpdateNewsletters}
          onUpdateAnnouncements={handleUpdateAnnouncements}
          onLogout={handleAdminLogout}
          onBackToWebsite={() => setCurrentScreen('home')}
        />
        <SchoolAdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      </>
    );
  }

  // Active live newsletters for display
  const latestLiveNewsletter = newsletters.find((n) => n.isLive) || newsletters[0];

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
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={!!adminUser}
        inquiryCount={inquiries.length}
      />

      {/* 3. Main Screen View Switcher */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          <>
            {/* Top of Homepage: Scrolling News Ticker for latest notices & event dates */}
            <NewsTicker
              announcements={announcements}
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

            {/* Live Newsletter & Gazette Highlight Card on Homepage */}
            {latestLiveNewsletter && (
              <section className="py-12 bg-white border-y border-[#dce3ec]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
                  <div className="bg-[#F2F8FD] rounded-3xl border border-[#dce3ec] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#021936] text-[#FDE68A] flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-2xl">auto_stories</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                            ● Live School Gazette
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {latestLiveNewsletter.edition}
                          </span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold font-serif text-[#021936]">
                          {latestLiveNewsletter.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-2xl">
                          {latestLiveNewsletter.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <button
                        onClick={() => handleNavigate('newsletters')}
                        className="w-full lg:w-auto py-3 px-6 rounded-xl bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                      >
                        <span>Read Gazette</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Campus Visit & Contact Details */}
            <ContactSection />
          </>
        )}

        {currentScreen === 'newsletters' && (
          <NewsletterView
            newsletters={newsletters}
            onBookTourClick={() => setIsTourModalOpen(true)}
            onApplyClick={() => handleNavigate('admissions', 'admissions-form')}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
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
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenDbStatus={() => setIsDbStatusModalOpen(true)}
      />

      {/* Neon Database Status & Inspector Modal */}
      <NeonDbStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
      />

      {/* 5. School Staff & Admin Login Modal */}
      <SchoolAdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
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
