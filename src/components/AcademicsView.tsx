import React, { useState } from 'react';
import { SCHOOL_INFO, CURRICULUM_TIERS, HOTLINK_IMAGES } from '../data/schoolData';

interface AcademicsViewProps {
  onApplyClick: () => void;
  onBookTourClick: () => void;
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({ onApplyClick, onBookTourClick }) => {
  const [activeTierId, setActiveTierId] = useState('pre-primary');

  const activeTier = CURRICULUM_TIERS.find((t) => t.id === activeTierId) || CURRICULUM_TIERS[0];

  const timetable = [
    { time: '08:00 AM – 08:30 AM', activity: 'Morning Assembly, National Anthem & Value Thought', type: 'Assembly' },
    { time: '08:30 AM – 10:00 AM', activity: 'Core Language, Phonics & Communication Skills', type: 'Core' },
    { time: '10:00 AM – 10:30 AM', activity: 'Healthy Snack Break & Supervised Social Play', type: 'Break' },
    { time: '10:30 AM – 12:00 PM', activity: 'Mathematics Lab & Exploratory STEM Science', type: 'STEM' },
    { time: '12:00 PM – 12:45 PM', activity: 'Expressive Arts, Music, Rhythm or Indoor Games', type: 'Activity' },
    { time: '12:45 PM – 01:45 PM', activity: 'Theme-Based Projects, Smart Board Quiz & Review', type: 'Smart Learning' },
    { time: '01:45 PM – 02:00 PM', activity: 'Daily Reflection & Safe Bus Departure', type: 'Departure' }
  ];

  const calendarEvents = [
    { month: 'April 2026', title: 'New Academic Session 2026-27 Commences', badge: 'Term 1' },
    { month: 'July 2026', title: 'Investiture Ceremony & Literary Week', badge: 'Leadership' },
    { month: 'September 2026', title: 'Mid-Term Formative Assessments & PTM', badge: 'Academics' },
    { month: 'November 2026', title: 'Annual Science & Art Exhibition (STEM Fair)', badge: 'Exhibition' },
    { month: 'December 2026', title: 'Annual Athletic Sports Meet & Field Games', badge: 'Sports' },
    { month: 'February 2027', title: 'Annual Cultural Fest & Stage Performances', badge: 'Celebration' },
  ];

  return (
    <div className="py-12 bg-[#f7f9ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-16">
        {/* Screen Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Academics &amp; Pedagogy
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936] leading-tight">
            Curriculum Engineered for Lifelong Curiosity &amp; Leadership
          </h1>
          <p className="text-sm sm:text-base text-[#44474e] leading-relaxed">
            At DWPS Ballabgarh, education transcends textbooks. We combine experiential inquiry, bilingual eloquence, and creative joy from foundational early childhood to senior grade school.
          </p>
        </div>

        {/* Wing Tabs Explorer */}
        <div className="bg-white rounded-2xl border border-[#dce3ec] custom-shadow-card overflow-hidden">
          <div className="grid grid-cols-3 border-b border-[#dce3ec] bg-[#F2F8FD]">
            {CURRICULUM_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTierId(tier.id)}
                className={`py-4 px-3 sm:px-6 text-center transition-all cursor-pointer ${
                  activeTierId === tier.id
                    ? 'bg-white text-[#904d00] font-bold border-b-2 border-[#904d00] shadow-xs'
                    : 'text-[#44474e] hover:text-[#021936] font-semibold'
                }`}
              >
                <span className="text-xs sm:text-sm block">{tier.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-normal hidden sm:inline">
                  {tier.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-3 rounded-xl bg-[#F2F8FD] text-[#904d00]">
                    <span className="material-symbols-outlined text-3xl">{activeTier.icon}</span>
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-[#021936]">
                      {activeTier.name}
                    </h2>
                    <span className="text-xs font-semibold text-[#904d00]">
                      {activeTier.ages} • Teacher-Student Ratio: {activeTier.ratio}
                    </span>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#44474e] leading-relaxed">
                  {activeTier.description}
                </p>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#021936] uppercase tracking-wider">
                    Core Learning Outcomes &amp; Activities:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTier.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec]/60">
                        <span className="material-symbols-outlined text-[#904d00] text-base mt-0.5">verified</span>
                        <span className="text-xs text-[#151c23] font-medium leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={onApplyClick}
                    className="py-3 px-6 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Enroll in {activeTier.name}
                  </button>
                  <button
                    onClick={onBookTourClick}
                    className="py-3 px-5 rounded-lg border border-[#dce3ec] text-[#021936] hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Schedule Classroom Visit
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl overflow-hidden bg-slate-100 border border-[#dce3ec] shadow-sm">
                  <img
                    src={
                      activeTierId === 'pre-primary'
                        ? HOTLINK_IMAGES.earlyChildhood
                        : activeTierId === 'primary'
                        ? HOTLINK_IMAGES.smartClassroom
                        : HOTLINK_IMAGES.scienceExhibition
                    }
                    alt={activeTier.name}
                    className="w-full h-72 object-cover"
                  />
                  <div className="p-4 bg-white border-t border-[#dce3ec]">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Daily Timings: <strong className="text-[#021936]">{activeTier.timings}</strong></span>
                      <span className="text-[#904d00] font-bold">Subhash Colony Campus</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Schedule Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              A Day at DWPS Ballabgarh
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#021936]">
              Structured Routine Built for Joy, Stamina &amp; Discovery
            </h2>
            <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
              Every day at Disney World Public School is carefully paced to combine concentrated academic focus with rejuvenating motor play, co-curricular arts, and peer collaboration.
            </p>
            <div className="p-4 rounded-xl bg-white border border-[#dce3ec] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#021936] font-bold">
                <span className="material-symbols-outlined text-[#904d00]">schedule</span>
                Campus Reporting Timings
              </div>
              <p className="text-slate-600">
                School gates open at 7:45 AM. Assembly begins promptly at 8:00 AM with campus safety marshals on duty.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce3ec] p-6 custom-shadow-card">
            <h3 className="text-base font-bold text-[#021936] mb-4 font-serif">
              Indicative Primary &amp; Grade School Timetable
            </h3>
            <div className="divide-y divide-slate-100 space-y-2">
              {timetable.map((item, idx) => (
                <div key={idx} className="pt-2.5 pb-2 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#904d00] block">
                      {item.time}
                    </span>
                    <span className="text-xs font-medium text-[#151c23]">
                      {item.activity}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2F8FD] text-[#021936] border border-[#dce3ec] whitespace-nowrap">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Calendar 2026-27 */}
        <div className="bg-white rounded-2xl p-8 border border-[#dce3ec] custom-shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Session Roadmap
              </span>
              <h2 className="text-2xl font-bold font-serif text-[#021936]">
                Academic Session {SCHOOL_INFO.academicYear} Calendar Highlights
              </h2>
            </div>
            <a
              href={`mailto:${SCHOOL_INFO.email}?subject=Requesting%20Full%20Academic%20Calendar%202026-27`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#904d00] hover:underline"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Request Full Syllabus Prospectus
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarEvents.map((evt, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec]/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#021936] font-mono">{evt.month}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-[#904d00] border border-[#dce3ec]">
                      {evt.badge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#151c23]">{evt.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
