import React from 'react';
import { SCHOOL_INFO, HOTLINK_IMAGES } from '../data/schoolData';

interface AboutViewProps {
  onBookTourClick: () => void;
  onApplyClick: () => void;
  onMeetTeamClick?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBookTourClick, onApplyClick, onMeetTeamClick }) => {
  return (
    <div className="py-12 bg-[#f7f9ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-16">
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Our Legacy &amp; Vision
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936]">
            Knowledge is Our Magic
          </h1>
          <p className="text-sm sm:text-base text-[#44474e]">
            {SCHOOL_INFO.name} was founded on the conviction that every child carries immense potential when surrounded by genuine care, moral clarity, and academic encouragement.
          </p>
        </div>

        {/* Director's Detailed Desk Message */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#dce3ec] custom-shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-[#F2F8FD] border border-[#dce3ec]">
              <img
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/img_20250521_080047-TBvk3l0f6rlrIpn9.jpg"
                alt={SCHOOL_INFO.director.name}
                className="w-28 h-28 rounded-full object-cover object-top border-4 border-[#904d00] shadow-md mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h3 className="text-xl font-bold font-serif text-[#021936]">
                {SCHOOL_INFO.director.name}
              </h3>
              <p className="text-xs font-bold text-[#904d00] uppercase tracking-wider mt-1">
                {SCHOOL_INFO.director.title}
              </p>
              <p className="text-xs text-slate-500 mt-1">{SCHOOL_INFO.name}</p>

              <div className="mt-5 w-full pt-4 border-t border-[#dce3ec] text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#904d00] text-base">location_on</span>
                  <span>Subhash Colony Campus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#904d00] text-base">verified</span>
                  <span>Playgroup to Grade School</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Leadership Message
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#021936]">
                "{SCHOOL_INFO.director.quote}"
              </h2>

              <div className="space-y-3.5 text-sm text-[#44474e] leading-relaxed">
                <p>
                  Welcome to {SCHOOL_INFO.name}, Ballabgarh. In today's fast-evolving world, true education is not merely the transmission of facts from teacher to textbook; it is the ignition of an inquisitive spirit, ethical fortitude, and resilient self-confidence.
                </p>
                <p>
                  Nestled in Subhash Colony, our school provides children with a safe, joy-filled sanctuary where they are listened to, respected, and challenged to grow. Our faculty is chosen not just for academic credentials, but for emotional intelligence and patient mentorship.
                </p>
                <p>
                  Whether your child is taking their very first tentative steps in our Playgroup or preparing for advanced project challenges in Grade School, we partner closely with parents every step of the journey.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                {onMeetTeamClick && (
                  <button
                    onClick={onMeetTeamClick}
                    className="py-3 px-6 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">groups</span>
                    View Full Leadership &amp; Faculty Team
                  </button>
                )}
                <button
                  onClick={onBookTourClick}
                  className="py-3 px-5 rounded-lg border border-[#dce3ec] text-[#021936] hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Schedule Campus Walkthrough
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Detail */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              Guiding Ethos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#021936] mt-1">
              Four Pillars of Character at DWPS Ballabgarh
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#dce3ec] custom-shadow-card">
              <span className="material-symbols-outlined text-3xl text-[#904d00] mb-3">favorite</span>
              <h3 className="text-base font-bold text-[#021936] mb-1">Empathy &amp; Kindness</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Nurturing compassionate listeners who respect classmates, elders, animals, and diverse perspectives.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#dce3ec] custom-shadow-card">
              <span className="material-symbols-outlined text-3xl text-[#904d00] mb-3">gavel</span>
              <h3 className="text-base font-bold text-[#021936] mb-1">Strong Discipline</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Instilling self-regulation, punctuality, academic integrity, and graceful manners through positive reinforcement.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#dce3ec] custom-shadow-card">
              <span className="material-symbols-outlined text-3xl text-[#904d00] mb-3">school</span>
              <h3 className="text-base font-bold text-[#021936] mb-1">Academic Rigor</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Deep conceptual understanding in mathematics, languages, and natural sciences without burdensome cramming.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#dce3ec] custom-shadow-card">
              <span className="material-symbols-outlined text-3xl text-[#904d00] mb-3">public</span>
              <h3 className="text-base font-bold text-[#021936] mb-1">Modern Human Values</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Balancing cultural heritage and Indian traditions with global perspective, scientific temper, and digital fluency.
              </p>
            </div>
          </div>
        </div>

        {/* School Overview & Location Callout */}
        <div className="bg-[#F2F8FD] rounded-2xl p-8 border border-[#dce3ec] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#021936]">
              Subhash Colony Campus Facility
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              1008, Gali no-11, Subhash Colony, Ballabgarh, Faridabad - 121004. Conveniently located with peaceful surroundings and dedicated school buses.
            </p>
          </div>
          <a
            href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
            className="py-3 px-6 bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">call</span>
            Call Office ({SCHOOL_INFO.phone})
          </a>
        </div>
      </div>
    </div>
  );
};
