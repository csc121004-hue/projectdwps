import React, { useState, useMemo } from 'react';
import { SCHOOL_INFO, BUS_ROUTES } from '../data/schoolData';

export interface FAQItem {
  id: string;
  category: 'documentation' | 'transport' | 'uniforms' | 'admissions';
  question: string;
  answer: string;
  highlightPoints?: string[];
  badge?: string;
}

export const FAQ_DATA: FAQItem[] = [
  // Documentation
  {
    id: 'doc-1',
    category: 'documentation',
    question: 'What mandatory documents are required for admission confirmation?',
    badge: 'Essential',
    answer: 'To ensure smooth enrollment and statutory compliance with the Directorate of Education Haryana, parents must submit self-attested photocopies along with original documents for verification at our Subhash Colony campus office.',
    highlightPoints: [
      'Original & photocopy of Child’s Municipal Birth Certificate',
      'Aadhar Card copies of the child and both parents / guardian',
      '4 recent passport-sized color photographs of the child',
      '2 passport-sized photographs of each parent',
      'Transfer Certificate (TC) from the previous recognized school (Mandatory for Grade 2 and above)',
      'Previous class report card / mark sheet (if applicable)',
      'Proof of residential address (Voter ID, Electricity bill, or registered Rent Deed)'
    ]
  },
  {
    id: 'doc-2',
    category: 'documentation',
    question: 'Is there a formal entrance examination for Nursery, KG, or Grade 1?',
    badge: 'Early Years',
    answer: 'No written academic tests are conducted for Pre-Primary admissions (Playgroup, Nursery, and KG). Instead, we conduct a pleasant, conversational interaction with parents and child in a child-friendly environment to gauge socio-emotional comfort, linguistic readiness, and developmental milestones.',
    highlightPoints: [
      'Zero test anxiety: Purely joyful observation in our activity playroom',
      'Informal interaction to understand child habits, food preferences, and allergies',
      'For Grade 2 to 8, a basic diagnostic assessment in English and Mathematics is conducted to identify the student’s learning baseline'
    ]
  },
  {
    id: 'doc-3',
    category: 'documentation',
    question: 'What if our Transfer Certificate (TC) is delayed from our previous school?',
    answer: 'We understand that transfer certificates often take time when shifting between cities or educational boards. Parents may secure provisional admission by submitting the previous report card along with an undertaking letter granting a 30-day grace period to provide the original counter-signed TC.'
  },
  {
    id: 'doc-4',
    category: 'documentation',
    question: 'What is the strict age criteria for Session 2026-27?',
    answer: `In accordance with the National Education Policy (NEP 2020) and Haryana Education Board guidelines, child age is calculated as on March 31, 2026:`,
    highlightPoints: [
      'Playgroup: 2.5 Years to 3.5 Years',
      'Nursery: 3.5 Years to 4.5 Years',
      'Kindergarten (KG / Prep): 4.5 Years to 5.5 Years',
      'Grade 1: 5.5 Years to 6.5 Years',
      'A grace window of up to 30 days can be reviewed on merit upon formal request to the Principal'
    ]
  },

  // Bus Routes & Transport
  {
    id: 'trans-1',
    category: 'transport',
    question: 'Which specific localities in Ballabgarh and Faridabad are covered by school buses?',
    badge: 'Coverage',
    answer: 'Our dedicated, air-cooled fleet operates across four comprehensive morning and afternoon transport corridors designed for minimum transit time and maximum punctuality.',
    highlightPoints: [
      'Route 1: Subhash Colony, Chawla Colony, Sector 2 Market, Ballabgarh Bus Stand',
      'Route 2: Adarsh Nagar, Sector 3, Tigaon Road, and DWPS Campus link',
      'Route 3: Faridabad By-Pass, YMCA Chowk, and Subhash Colony Main Road',
      'Route 4: Jharsethli, Badrola, Ballabgarh Railway Station arterial link'
    ]
  },
  {
    id: 'trans-2',
    category: 'transport',
    question: 'What safety precautions and staff are present on board the school transport?',
    badge: 'Child Safety',
    answer: 'Student transit safety is non-negotiable at Disney World Public School. Every authorized bus and van strictly adheres to Supreme Court and CBSE school bus transport safety mandates.',
    highlightPoints: [
      'Live GPS telemetry tracking with mobile app link for parents',
      'Front and interior CCTV surveillance recording all journeys',
      'Trained female caregiver / female attendant present on every route throughout pick-up and drop-off',
      'Speed governors capped strictly at statutory limits',
      'Onboard first-aid kit, certified fire extinguishers, and emergency window exits',
      'Direct radio/cell connection between campus control desk and verified bus drivers'
    ]
  },
  {
    id: 'trans-3',
    category: 'transport',
    question: 'How are bus fees structured and can pickup stops be customized?',
    answer: 'Transport fees are slabbed by geographical distance (Zone 1: ₹1,100/mo, Zone 2: ₹1,400/mo, Zone 3: ₹1,800/mo). While buses follow standardized safe main-road boarding points, our transport coordinator works closely with families to establish secure curbside stops within comfortable walking distance (100–200m) of their homes.'
  },

  // Uniforms & Books
  {
    id: 'uni-1',
    category: 'uniforms',
    question: 'Where can parents procure the official DWPS uniform and book kits?',
    badge: 'Availability',
    answer: 'To guarantee standard color-fast fabric quality and authorized textbook editions, complete school uniform sets, winter blazers, and CBSE/NCERT curriculum kits are made available through authorized vendor counters in Ballabgarh market as well as during on-campus Orientation & Distribution Weeks at regulated, fair council prices.'
  },
  {
    id: 'uni-2',
    category: 'uniforms',
    question: 'What is the standard Summer and Winter dress code for students?',
    badge: 'Dress Code',
    answer: 'Our student uniform inspires dignity, equality, and pride:',
    highlightPoints: [
      'Summer Boys: Smart navy & white checked half-sleeve shirt with crest, navy blue trousers/shorts, school belt, navy socks with gold stripes, and black leather shoes.',
      'Summer Girls: Navy & white checked collared blouse/tunic, school tie, hair ribbons/bands (navy blue), and black buckled leather shoes.',
      'Winter Attire: Full-sleeve shirts, customized navy blue pullover with V-neck school trim, and deep navy blazer with embroidered institutional crest.',
      'Pre-Primary Toddlers: Extra-soft, stretch-waist polo tracksuits for freedom of motor movement and joyful floor play.'
    ]
  },
  {
    id: 'uni-3',
    category: 'uniforms',
    question: 'Is there a separate sports / House uniform?',
    answer: 'Yes. Every Wednesday and Saturday (Activity & Physical Fitness Days), students wear their assigned House polo t-shirt (Red, Blue, Green, or Gold) paired with white sports track pants and white rubber-soled athletic running sneakers.'
  },

  // Admissions & Financials
  {
    id: 'adm-1',
    category: 'admissions',
    question: 'What payment modes are accepted and are there sibling discounts?',
    badge: 'Discounts',
    answer: 'We provide full digital and offline payment convenience. Fees can be paid through NetBanking, UPI (Google Pay, PhonePe, Paytm), debit/credit card swipe, or bank demand draft/cheque at the campus desk.',
    highlightPoints: [
      '10% Sibling Concession: Granted on monthly tuition fees for the younger sibling',
      'Annual Advance Waiver: 10% concession on tuition fees if annual fee is settled at the start of the session',
      'Quarterly Advance Waiver: 3% concession on tuition fees',
      'Transparent schedule with zero hidden maintenance levies'
    ]
  },
  {
    id: 'adm-2',
    category: 'admissions',
    question: 'Can parents schedule an in-person walkthrough of the campus before taking admission?',
    answer: 'Absolutely. We actively encourage prospective families to tour our Subhash Colony campus, inspect our smart interactive classrooms, library, activity courtyard, and sports arena, and interact directly with our teachers and academic leadership. Campus walkthroughs are hosted Monday through Saturday from 9:00 AM to 2:30 PM.'
  }
];

interface AdmissionsFAQProps {
  onScheduleTourClick?: () => void;
  onApplyClick?: () => void;
}

export const AdmissionsFAQ: React.FC<AdmissionsFAQProps> = ({
  onScheduleTourClick,
  onApplyClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'doc-1': true, // Keep first essential question open by default
    'trans-1': true,
  });

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    FAQ_DATA.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedItems(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedItems({});
  };

  // Filter FAQ items by category and search query
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.highlightPoints &&
          item.highlightPoints.some((p) => p.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Questions', icon: 'quiz', count: FAQ_DATA.length },
    {
      id: 'documentation',
      label: 'Documentation & Age',
      icon: 'description',
      count: FAQ_DATA.filter((i) => i.category === 'documentation').length,
    },
    {
      id: 'transport',
      label: 'Bus Routes & Safety',
      icon: 'directions_bus',
      count: FAQ_DATA.filter((i) => i.category === 'transport').length,
    },
    {
      id: 'uniforms',
      label: 'Uniforms & Books',
      icon: 'apparel',
      count: FAQ_DATA.filter((i) => i.category === 'uniforms').length,
    },
    {
      id: 'admissions',
      label: 'Fees & Policies',
      icon: 'payments',
      count: FAQ_DATA.filter((i) => i.category === 'admissions').length,
    },
  ];

  return (
    <div id="admissions-faq" className="space-y-8">
      {/* FAQ Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">help</span>
            Admissions Knowledge Base
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#021936] mt-1.5">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#44474e] mt-1 max-w-2xl">
            Clear, transparent answers regarding verification documentation, safe GPS bus corridors, school uniforms, and admission policies.
          </p>
        </div>

        {/* Global Expand / Collapse All Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExpandAll}
            className="text-xs font-semibold text-[#021936] hover:text-[#904d00] bg-white border border-[#dce3ec] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="text-xs font-semibold text-[#44474e] hover:text-[#021936] bg-white border border-[#dce3ec] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search Bar & Category Filter Pills */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card space-y-4">
        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by topic (e.g. 'TC', 'birth certificate', 'bus route', 'winter uniform', 'age limit')..."
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs sm:text-sm text-[#021936] placeholder:text-slate-400 focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#021936] text-white shadow-xs'
                    : 'bg-[#F2F8FD] text-[#44474e] hover:bg-slate-200 border border-[#dce3ec]'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#FDE68A]' : 'text-[#904d00]'}`}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-[#dce3ec]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion List Container */}
      <div className="space-y-3.5">
        {filteredFAQs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#dce3ec] space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              sentiment_dissatisfied
            </span>
            <p className="text-sm font-semibold text-[#021936]">
              No questions found matching "{searchQuery}"
            </p>
            <p className="text-xs text-slate-500">
              Try searching with another keyword or reach out directly to our Subhash Colony admissions office.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-bold text-[#904d00] hover:underline"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          filteredFAQs.map((item, idx) => {
            const isExpanded = !!expandedItems[item.id];
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-[#904d00]/40 shadow-sm ring-1 ring-[#904d00]/20'
                    : 'border-[#dce3ec] hover:border-slate-300'
                }`}
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#F2F8FD] text-[#904d00] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#dce3ec]">
                      Q{idx + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#021936] font-serif leading-snug">
                        {item.question}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ffdcc3] text-[#2f1500]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 flex-shrink-0 ${
                      isExpanded
                        ? 'bg-[#904d00] text-white rotate-180'
                        : 'bg-[#F2F8FD] text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Accordion Expanded Body */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#44474e] border-t border-slate-100 animate-fadeIn">
                    <p className="leading-relaxed mb-3">{item.answer}</p>

                    {item.highlightPoints && item.highlightPoints.length > 0 && (
                      <div className="mt-3 p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2">
                        <span className="text-[11px] font-bold text-[#904d00] uppercase tracking-wider block">
                          Key Details &amp; Checklist:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {item.highlightPoints.map((point, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-sm text-[#904d00] flex-shrink-0 mt-0.5">
                                check_circle
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helpful Still Have Questions CTA Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#021936] to-[#1a2e4c] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#904d00] text-white text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Dedicated Admissions Counselor</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Have a question specific to your child's case?
          </h3>
          <p className="text-xs sm:text-sm text-[#8396b9] max-w-xl">
            Our principal counselors in Subhash Colony are available to answer queries regarding transport corridors, sibling admissions, and academic transitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
            className="py-3 px-5 bg-white hover:bg-slate-100 text-[#021936] text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base text-[#904d00]">call</span>
            <span>{SCHOOL_INFO.phone}</span>
          </a>

          {onScheduleTourClick && (
            <button
              onClick={onScheduleTourClick}
              className="py-3 px-5 bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              <span>Schedule Campus Visit</span>
            </button>
          )}

          {onApplyClick && (
            <button
              onClick={onApplyClick}
              className="py-3 px-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              <span>Apply Online</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
