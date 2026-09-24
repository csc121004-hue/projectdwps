import React, { useState, useEffect } from 'react';
import { SCHOOL_ANNOUNCEMENTS, SchoolAnnouncement } from '../data/schoolData';

interface NewsTickerProps {
  announcements?: SchoolAnnouncement[];
  onOpenInquiry?: () => void;
  onOpenTourModal?: () => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  announcements,
  onOpenInquiry,
  onOpenTourModal,
}) => {
  const list = announcements && announcements.length > 0 ? announcements : SCHOOL_ANNOUNCEMENTS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Keep index within bounds if list size changes
  useEffect(() => {
    if (currentIndex >= list.length) {
      setCurrentIndex(0);
    }
  }, [list.length, currentIndex]);

  // Auto-advance ticker every 4.5 seconds if not paused
  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, list.length]);

  const activeNotice = list[currentIndex] || list[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  const getCategoryColor = (cat: SchoolAnnouncement['category']) => {
    switch (cat) {
      case 'Admissions':
        return 'bg-[#904d00] text-white';
      case 'Events':
        return 'bg-[#021936] text-[#FDE68A]';
      case 'Academic':
        return 'bg-blue-700 text-white';
      case 'Sports':
        return 'bg-emerald-700 text-white';
      case 'Achievement':
        return 'bg-amber-600 text-white';
      case 'Notice':
        return 'bg-purple-700 text-white';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  if (!activeNotice) return null;

  return (
    <>
      <div
        className="bg-white border-b border-[#dce3ec] shadow-xs relative z-30 transition-colors"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-16 py-2.5 flex items-center justify-between gap-3 text-xs">
          {/* Ticker Lead Tag */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#021936] text-white font-bold text-[11px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="material-symbols-outlined text-[13px] text-[#FDE68A]">campaign</span>
              <span className="hidden sm:inline">Latest Notices</span>
              <span className="sm:hidden">News</span>
            </div>
            <span className="text-[11px] font-mono text-slate-600 hidden md:inline">
              [{currentIndex + 1}/{list.length}]
            </span>
          </div>

          {/* Current Scrolling / Fading Notice Item */}
          <div className="flex-1 overflow-hidden min-w-0 flex items-center">
            <div
              key={activeNotice.id}
              className="flex items-center gap-2.5 truncate animate-fadeIn cursor-pointer"
              onClick={() => setSelectedAnnouncement(activeNotice)}
            >
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${getCategoryColor(
                  activeNotice.category
                )}`}
              >
                {activeNotice.badge}
              </span>

              {activeNotice.isUrgent && (
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse flex-shrink-0">
                  Urgent
                </span>
              )}

              <span className="font-semibold text-[#021936] truncate hover:text-[#904d00] transition-colors">
                {activeNotice.title}
              </span>

              <span className="hidden lg:inline text-[#44474e] truncate text-slate-500">
                — {activeNotice.summary}
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#904d00] flex-shrink-0">
                <span className="material-symbols-outlined text-xs">event</span>
                {activeNotice.date}
              </span>
            </div>
          </div>

          {/* Controls: Prev, Pause/Play, Next, Details View */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setSelectedAnnouncement(activeNotice)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2F8FD] hover:bg-[#dce3ec] text-[#021936] font-semibold text-[11px] transition-colors border border-[#dce3ec] cursor-pointer"
            >
              <span>View Notice</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </button>

            <button
              onClick={handlePrev}
              aria-label="Previous announcement"
              className="w-7 h-7 rounded hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              className="w-7 h-7 rounded hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>

            <button
              onClick={handleNext}
              aria-label="Next announcement"
              className="w-7 h-7 rounded hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Continuous Marquee Rail on hover or secondary sub-bar */}
        <div className="bg-[#F2F8FD] py-1 border-t border-[#dce3ec]/50 overflow-hidden text-[11px] text-[#44474e]">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 whitespace-nowrap overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#904d00] flex-shrink-0">
              Upcoming Dates:
            </span>
            {list.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="inline-flex items-center gap-1.5 hover:text-[#021936] hover:underline cursor-pointer flex-shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span>
                <span className="font-semibold text-[#021936]">{item.date}:</span>
                <span>{item.title}</span>
                {item.isUrgent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#021936] text-white p-6 relative">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(
                    selectedAnnouncement.category
                  )}`}
                >
                  {selectedAnnouncement.category}
                </span>
                <span className="text-xs text-[#FDE68A] font-semibold">
                  {selectedAnnouncement.date}
                </span>
              </div>

              <h3 className="text-xl font-bold font-serif text-white leading-snug">
                {selectedAnnouncement.title}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#021936] uppercase tracking-wider mb-1.5">
                  Notice Details
                </h4>
                <p className="text-sm text-[#44474e] leading-relaxed">
                  {selectedAnnouncement.summary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="font-bold text-[#021936]">2026-27</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-[#021936]">Subhash Colony Campus, Ballabgarh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact Desk:</span>
                  <span className="font-bold text-[#904d00]">+91-9899638676</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {selectedAnnouncement.category === 'Admissions' && onOpenInquiry && (
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(null);
                      onOpenInquiry();
                    }}
                    className="flex-1 py-3 bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Submit Admission Inquiry
                  </button>
                )}

                {selectedAnnouncement.category === 'Events' && onOpenTourModal && (
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(null);
                      onOpenTourModal();
                    }}
                    className="flex-1 py-3 bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Schedule Campus Visit
                  </button>
                )}

                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
