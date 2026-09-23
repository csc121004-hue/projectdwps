import React from 'react';
import { CURRICULUM_TIERS } from '../data/schoolData';

interface CurriculumSectionProps {
  onSelectTier: (tierId: string) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({ onSelectTier }) => {
  return (
    <section id="academics" className="py-20 bg-[#F2F8FD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Foundational to Grade School
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-serif text-[#021936]">
            Curriculum Tailored for Every Developmental Phase
          </h2>
          <p className="text-sm sm:text-base text-[#44474e]">
            From sensory play in early childhood to conceptual mastery in grade school, DWPS Ballabgarh empowers children with critical thinking and confident communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CURRICULUM_TIERS.map((tier) => {
            const isMilestone = !!tier.tag;
            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl p-7 flex flex-col justify-between custom-shadow-card custom-shadow-hover transition-all duration-300 relative ${
                  isMilestone ? 'border-2 border-[#904d00]/40 ring-1 ring-[#904d00]/10' : 'border border-[#dce3ec]'
                }`}
              >
                {tier.tag && (
                  <div className="absolute -top-3 right-6 bg-[#904d00] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-xs">
                    {tier.tag}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="p-3 rounded-xl bg-[#F2F8FD] text-[#904d00]">
                      <span className="material-symbols-outlined text-3xl">{tier.icon}</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#eef4fd] text-[#021936] text-xs font-bold uppercase tracking-wider">
                      {tier.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#021936] mb-3">
                    {tier.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#44474e] mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  <ul className="space-y-2.5 text-xs text-[#151c23] mb-6">
                    {tier.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#904d00] text-sm mt-0.5">check</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectTier(tier.id)}
                  className="inline-flex items-center text-sm font-bold text-[#904d00] hover:text-[#B45309] pt-4 border-t border-[#dce3ec]/60 gap-1 text-left w-full cursor-pointer group"
                >
                  <span>Explore Curriculum &amp; Enroll</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
