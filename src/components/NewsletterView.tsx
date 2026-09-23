import React, { useState, useMemo } from 'react';
import { NewsletterItem, SCHOOL_INFO, HOTLINK_IMAGES } from '../data/schoolData';
import { SchoolLogo } from './SchoolLogo';

interface NewsletterViewProps {
  newsletters: NewsletterItem[];
  onBookTourClick?: () => void;
  onApplyClick?: () => void;
  onOpenAdminLogin?: () => void;
}

export const NewsletterView: React.FC<NewsletterViewProps> = ({
  newsletters,
  onBookTourClick,
  onApplyClick,
  onOpenAdminLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReadingNewsletter, setActiveReadingNewsletter] = useState<NewsletterItem | null>(null);

  // Email Subscription State
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  // Filter only Live newsletters
  const liveNewsletters = useMemo(() => {
    return newsletters.filter((n) => n.isLive);
  }, [newsletters]);

  // Filtered newsletters based on category & search
  const filteredNewsletters = useMemo(() => {
    return liveNewsletters.filter((item) => {
      const matchesCat =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.edition.toLowerCase().includes(q) ||
        (item.highlights && item.highlights.some((h) => h.toLowerCase().includes(q)));

      return matchesCat && matchesSearch;
    });
  }, [liveNewsletters, selectedCategory, searchQuery]);

  const latestNewsletter = liveNewsletters[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subEmail.trim()) {
      setSubSuccess(true);
      setTimeout(() => {
        setSubEmail('');
        setSubPhone('');
      }, 3000);
    }
  };

  const categories = [
    'All',
    'Academics & STEM',
    'Sports & Athletics',
    'Campus Life & Arts',
    'Special Bulletin',
  ];

  return (
    <div className="bg-[#f8fafc] text-[#021936] py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#021936] via-[#0b2447] to-[#17375e] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#904d00]/20 blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold text-[#ffdcc3]">
              <span className="material-symbols-outlined text-sm text-[#fe932c]">auto_stories</span>
              <span>Official School Gazettes &amp; Announcements</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-tight">
              The DWPS Chronicle &amp; Live Bulletins
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Stay connected with academic milestones, student innovations, sports triumphs, and leadership dispatches from {SCHOOL_INFO.name}, Subhash Colony, Ballabgarh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#fe932c]">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Session 2026-27 Active</span>
              </span>
              <span className="text-white/40">•</span>
              <span className="text-slate-300">Updated in Real Time</span>
              <span className="text-white/40">•</span>
              <button
                onClick={onOpenAdminLogin}
                className="text-white/80 hover:text-white underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Staff Publishing Desk</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Latest Issue Spotlight */}
        {latestNewsletter && (
          <div className="bg-white rounded-3xl border border-[#dce3ec] custom-shadow-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[420px] bg-slate-900 overflow-hidden">
                <img
                  src={latestNewsletter.coverImageUrl}
                  alt={latestNewsletter.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#904d00] text-white shadow-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Current Featured Edition</span>
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold text-[#ffdcc3] block">
                    {latestNewsletter.edition} • Published {latestNewsletter.publishDate}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif leading-snug mt-1">
                    {latestNewsletter.title}
                  </h3>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="px-2.5 py-1 rounded bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] font-bold">
                      {latestNewsletter.category}
                    </span>
                    <span>By {latestNewsletter.author}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {latestNewsletter.summary}
                  </p>

                  {latestNewsletter.highlights && (
                    <div className="p-4 rounded-2xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00] block">
                        Issue Highlights:
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        {latestNewsletter.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-xs text-[#904d00] flex-shrink-0 mt-0.5">
                              check_circle
                            </span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveReadingNewsletter(latestNewsletter)}
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">menu_book</span>
                    <span>Read Full Gazette</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#F2F8FD] hover:bg-slate-200 border border-[#dce3ec] text-[#021936] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Print / Save PDF"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, keywords, dates..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs text-[#021936] focus:border-[#904d00] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#021936] text-white shadow-xs'
                      : 'bg-[#F2F8FD] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Archive Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#021936]">
              All Published Bulletins &amp; Editions
            </h2>
            <span className="text-xs text-slate-500">
              Showing {filteredNewsletters.length} edition{filteredNewsletters.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredNewsletters.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#dce3ec] text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2 block">
                search_off
              </span>
              <p className="font-semibold text-sm">
                No newsletters found matching "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-3 text-xs font-bold text-[#904d00] hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNewsletters.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#dce3ec] custom-shadow-card overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all group"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#021936]/80 text-white backdrop-blur-xs">
                          {item.category}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[11px] font-semibold text-amber-200">
                          {item.edition} • {item.publishDate}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <h3 className="text-base font-bold font-serif text-[#021936] leading-snug line-clamp-2 group-hover:text-[#904d00] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setActiveReadingNewsletter(item)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#F2F8FD] hover:bg-[#021936] text-[#021936] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">article</span>
                      <span>Read Publication</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Subscription Banner */}
        <div className="bg-white rounded-3xl border border-[#dce3ec] p-8 sm:p-10 custom-shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00]">
                Monthly School Gazette
              </span>
              <h3 className="text-2xl font-bold font-serif text-[#021936]">
                Never Miss a DWPS School Update
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Subscribe to receive upcoming circulars, exam dates, vacation schedules, and STEM project bulletins straight to your email.
              </p>
            </div>

            <div className="md:col-span-6">
              {subSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Thank you! You are now subscribed to the DWPS Ballabgarh monthly gazette.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="Enter parent email address..."
                      className="flex-1 h-11 px-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs text-[#021936] outline-none focus:border-[#904d00]"
                    />
                    <button
                      type="submit"
                      className="h-11 px-6 bg-[#904d00] hover:bg-[#B45309] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Subscribe Free
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Zero spam. Only official school circulars &amp; academic celebrations.
                  </span>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Newsletter Reading Modal */}
      {activeReadingNewsletter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setActiveReadingNewsletter(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-64 bg-slate-900">
              <img
                src={activeReadingNewsletter.coverImageUrl}
                alt={activeReadingNewsletter.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021936] via-[#021936]/40 to-transparent"></div>

              <button
                onClick={() => setActiveReadingNewsletter(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="absolute bottom-5 left-6 right-6 text-white space-y-1.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fe932c] text-[#021936] inline-block">
                  {activeReadingNewsletter.edition}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif leading-tight">
                  {activeReadingNewsletter.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#8396b9]">
                  <span>{activeReadingNewsletter.category}</span>
                  <span>•</span>
                  <span>Published on {activeReadingNewsletter.publishDate}</span>
                  <span>•</span>
                  <span>By {activeReadingNewsletter.author}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800">
              {/* Summary Lead Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F2F8FD] border-l-4 border-[#904d00] text-xs sm:text-sm font-medium leading-relaxed text-[#021936]">
                {activeReadingNewsletter.summary}
              </div>

              {/* Highlights */}
              {activeReadingNewsletter.highlights && activeReadingNewsletter.highlights.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#904d00] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">stars</span>
                    <span>Executive Highlights:</span>
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {activeReadingNewsletter.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-xs text-[#904d00] flex-shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Article Content */}
              <div className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 font-sans">
                {activeReadingNewsletter.content}
              </div>

              {/* Footer CTA & Actions */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#021936] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Print Edition</span>
                  </button>
                  {onApplyClick && (
                    <button
                      onClick={() => {
                        setActiveReadingNewsletter(null);
                        onApplyClick();
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Apply for 2026-27
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveReadingNewsletter(null)}
                  className="py-2.5 px-5 rounded-xl bg-[#021936] text-white text-xs font-bold hover:bg-[#1a2e4c] cursor-pointer"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
