import React from 'react';
import { SCHOOL_INFO } from '../data/schoolData';

interface AboutSectionProps {
  onScheduleTour: () => void;
  onExploreMore: () => void;
  onMeetTeam?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onScheduleTour, onExploreMore, onMeetTeam }) => {
  return (
    <section id="about" className="py-20 bg-white border-y border-[#dce3ec]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Message Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative bg-[#F2F8FD] rounded-2xl p-8 border border-[#dce3ec] custom-shadow-card">
              <div className="text-[#904d00] text-6xl font-serif leading-none select-none -mb-3">“</div>
              <blockquote className="text-xl sm:text-2xl font-bold font-serif text-[#021936] italic leading-snug">
                {SCHOOL_INFO.director.quote}
              </blockquote>

              <div className="mt-6 pt-6 border-t border-[#dce3ec] flex items-center gap-4">
                <img
                  src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/img_20250521_080047-TBvk3l0f6rlrIpn9.jpg"
                  alt={SCHOOL_INFO.director.name}
                  className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#904d00] shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h3 className="text-sm font-bold text-[#021936]">{SCHOOL_INFO.director.name}</h3>
                  <p className="text-xs text-[#904d00] font-medium">{SCHOOL_INFO.director.title} • {SCHOOL_INFO.director.school}</p>
                </div>
              </div>

              <div className="mt-6 bg-white p-4 rounded-xl border border-[#dce3ec]/80">
                <div className="flex items-center gap-2 text-xs font-bold text-[#021936] uppercase tracking-wider mb-2.5">
                  <span className="material-symbols-outlined text-[#904d00] text-base">lightbulb</span>
                  Our Core Values
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#44474e]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span> Empathy &amp; Kindness
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span> Strong Discipline
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span> Academic Rigor
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span> Modern Human Values
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F8FD] text-[#904d00] text-xs font-bold uppercase tracking-wider">
              About Our School
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-serif text-[#021936] leading-tight">
              Dedicated to the holistic growth of every child.
            </h2>

            <div className="space-y-4 text-base text-[#44474e] leading-relaxed">
              <p>
                Located in the heart of <strong className="text-[#021936]">{SCHOOL_INFO.locationTag}</strong>, Disney World Public School is more than just a building; it is a community dedicated to the holistic growth of every child. We believe in nurturing curiosity, building character, and achieving academic excellence.
              </p>
              <p>
                Our mission is to provide a safe, inclusive, and stimulating environment where students from Playgroup to Grade School can explore their potential and prepare for a bright future. Through structured inquiry, joyful play, and progressive pedagogy, our educators guide each learner with patience and heartfelt mentorship.
              </p>
            </div>

            {/* Bulleted Highlights */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#904d00] mt-0.5 text-lg">check_circle</span>
                <span className="text-sm text-[#151c23] font-medium">Individual attention with balanced student-teacher ratios</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#904d00] mt-0.5 text-lg">check_circle</span>
                <span className="text-sm text-[#151c23] font-medium">Integrated digital learning &amp; hands-on activity centers</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#904d00] mt-0.5 text-lg">check_circle</span>
                <span className="text-sm text-[#151c23] font-medium">Continuous parent-teacher collaboration &amp; transparent updates</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#904d00] mt-0.5 text-lg">check_circle</span>
                <span className="text-sm text-[#151c23] font-medium">Vibrant cultural, physical fitness, and co-curricular calendar</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onScheduleTour}
                className="inline-flex items-center text-sm font-bold text-[#904d00] hover:text-[#B45309] transition-colors gap-1.5 group cursor-pointer"
              >
                <span>Schedule a Campus Tour with our Admissions Counselor</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              {onMeetTeam && (
                <button
                  onClick={onMeetTeam}
                  className="inline-flex items-center text-xs font-bold text-[#021936] hover:text-[#904d00] bg-[#F2F8FD] px-3.5 py-2 rounded-lg border border-[#dce3ec] transition-colors gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-[#904d00]">groups</span>
                  <span>Meet Our Faculty &amp; Leadership Team →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
