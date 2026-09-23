import React, { useState } from 'react';
import { TEAM_MEMBERS, TeamMember, SCHOOL_INFO } from '../data/schoolData';

interface OurTeamViewProps {
  onBookTourClick: () => void;
  onApplyClick: () => void;
}

export const OurTeamView: React.FC<OurTeamViewProps> = ({ onBookTourClick, onApplyClick }) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Leadership' | 'Faculty'>('All');
  const [activeMemberModal, setActiveMemberModal] = useState<TeamMember | null>(null);

  const filteredMembers = selectedFilter === 'All'
    ? TEAM_MEMBERS
    : TEAM_MEMBERS.filter((m) => m.category === selectedFilter);

  const leadershipMembers = TEAM_MEMBERS.filter((m) => m.category === 'Leadership');
  const facultyMembers = TEAM_MEMBERS.filter((m) => m.category === 'Faculty');

  return (
    <div className="py-12 bg-[#f7f9ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-16">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Meet Our Mentors
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936] leading-tight">
            Our Dedicated Team of Educators &amp; Leaders
          </h1>
          <p className="text-sm sm:text-base text-[#44474e] leading-relaxed">
            At <strong>{SCHOOL_INFO.name}</strong>, we believe that a school is only as good as its teachers. Our team consists of highly qualified, experienced, and passionate educators who are dedicated to the holistic development of every child.
          </p>
        </div>

        {/* Faculty Strength Highlight Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#dce3ec] custom-shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                Our Faculty Strength
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#021936]">
                Empowering the Next Generation with Heart &amp; Expertise
              </h2>
              <p className="text-sm text-[#44474e] leading-relaxed">
                We pride ourselves on having a team of dedicated professionals who share a common vision: to empower the next generation. Our teachers are selected not just for their academic qualifications, but for their ability to connect with students. With regular training workshops and a focus on continuous improvement, our staff ensures that {SCHOOL_INFO.name} remains a center of excellence in Ballabgarh.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                onClick={onBookTourClick}
                className="w-full py-3.5 px-5 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                Meet Teachers in Person
              </button>
              <button
                onClick={onApplyClick}
                className="w-full py-3.5 px-5 rounded-lg bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                Apply for Admission 2026-27
              </button>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce3ec] pb-4">
          <div className="flex items-center gap-2">
            {(['All', 'Leadership', 'Faculty'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-[#021936] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#dce3ec]'
                }`}
              >
                {filter === 'All' ? 'All Team Members' : filter} ({
                  filter === 'All'
                    ? TEAM_MEMBERS.length
                    : filter === 'Leadership'
                    ? leadershipMembers.length
                    : facultyMembers.length
                })
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Subhash Colony Campus Faculty Directory
          </span>
        </div>

        {/* Section 1: Leadership Grid (Shown if All or Leadership) */}
        {(selectedFilter === 'All' || selectedFilter === 'Leadership') && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-[#904d00]">military_tech</span>
              <h2 className="text-2xl font-bold font-serif text-[#021936]">
                Institutional Leadership &amp; Direction
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {leadershipMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border-2 border-[#dce3ec] hover:border-[#904d00]/50 custom-shadow-card overflow-hidden transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-72 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#021936]/80 via-transparent to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-[#021936]/80 backdrop-blur-md text-[#FDE68A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                        {member.category}
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider block">
                          {member.role}
                        </span>
                        <h3 className="text-xl font-bold font-serif text-white">
                          {member.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
                        {member.description}
                      </p>

                      {member.qualifications && (
                        <div className="pt-2 border-t border-[#dce3ec]/60 flex items-center gap-2 text-xs text-[#021936]">
                          <span className="material-symbols-outlined text-[#904d00] text-sm">school</span>
                          <span className="font-semibold">{member.qualifications}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setActiveMemberModal(member)}
                      className="w-full py-2 px-3 rounded-lg bg-[#F2F8FD] hover:bg-[#e8eef7] text-[#021936] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View Profile &amp; Mentorship Philosophy</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Faculty Members (Shown if All or Faculty) */}
        {(selectedFilter === 'All' || selectedFilter === 'Faculty') && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-[#904d00]">school</span>
              <h2 className="text-2xl font-bold font-serif text-[#021936]">
                Our Passionate Teaching Faculty
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-[#dce3ec] hover:border-[#904d00]/40 custom-shadow-card overflow-hidden transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#021936]/75 via-transparent to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#021936] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                        {member.role}
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="text-lg font-bold font-serif text-white">
                          {member.name}
                        </h3>
                        <span className="text-[11px] font-medium text-[#FDE68A]">
                          Disney World Public School Faculty
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs text-[#44474e] leading-relaxed">
                        {member.description}
                      </p>

                      {member.subjects && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {member.subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#F2F8FD] text-[#021936] text-[10px] font-semibold border border-[#dce3ec]"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#dce3ec]/50 mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Subhash Colony Campus</span>
                      <button
                        onClick={() => setActiveMemberModal(member)}
                        className="text-[#904d00] font-bold hover:underline"
                      >
                        Read More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pillars of Educator Excellence */}
        <div className="bg-[#021936] text-white rounded-2xl p-8 sm:p-12 border border-[#1a2e4c]">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider">
              Mentorship Standards
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1">
              Why Parents Trust Our Teachers at DWPS Ballabgarh
            </h3>
            <p className="text-xs sm:text-sm text-[#8396b9] mt-2">
              Every educator at Disney World Public School undergoes regular training in child psychology, innovative instructional design, and empathetic classroom governance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#1a2e4c]/70 border border-[#8396b9]/20 space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#FDE68A]">psychology</span>
              <h4 className="text-sm font-bold text-white">Continuous Workshops</h4>
              <p className="text-xs text-[#8396b9] leading-relaxed">
                Ongoing pedagogical training programs ensuring mastery of modern interactive tools.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#1a2e4c]/70 border border-[#8396b9]/20 space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#FDE68A]">diversity_1</span>
              <h4 className="text-sm font-bold text-white">Low Student Ratios</h4>
              <p className="text-xs text-[#8396b9] leading-relaxed">
                1:15 in Pre-Primary and 1:25 in Grade School for dedicated individualized attention.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#1a2e4c]/70 border border-[#8396b9]/20 space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#FDE68A]">sentiment_satisfied</span>
              <h4 className="text-sm font-bold text-white">Empathetic Care</h4>
              <p className="text-xs text-[#8396b9] leading-relaxed">
                Safe, inclusive classrooms where every question is welcomed and every small win celebrated.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#1a2e4c]/70 border border-[#8396b9]/20 space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#FDE68A]">forum</span>
              <h4 className="text-sm font-bold text-white">Parent Partnership</h4>
              <p className="text-xs text-[#8396b9] leading-relaxed">
                Frequent open-door consultations and regular progress tracking updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {activeMemberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setActiveMemberModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce3ec] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 bg-slate-900">
              <img
                src={activeMemberModal.imageUrl}
                alt={activeMemberModal.name}
                className="w-full h-full object-cover object-top"
              />
              <button
                onClick={() => setActiveMemberModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FDE68A] block">
                  {activeMemberModal.role}
                </span>
                <h3 className="text-xl font-bold font-serif">{activeMemberModal.name}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#021936] uppercase tracking-wider mb-1">
                  About &amp; Role at {SCHOOL_INFO.name}
                </h4>
                <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
                  {activeMemberModal.description}
                </p>
              </div>

              {activeMemberModal.qualifications && (
                <div className="p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs">
                  <span className="font-bold text-[#021936] block">Credentials:</span>
                  <span className="text-slate-600">{activeMemberModal.qualifications}</span>
                </div>
              )}

              {activeMemberModal.subjects && (
                <div>
                  <span className="text-xs font-bold text-[#021936] uppercase tracking-wider block mb-1.5">
                    Areas of Instruction:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMemberModal.subjects.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setActiveMemberModal(null);
                    onBookTourClick();
                  }}
                  className="flex-1 py-2.5 bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors text-center"
                >
                  Schedule Campus Consultation
                </button>
                <button
                  onClick={() => setActiveMemberModal(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
