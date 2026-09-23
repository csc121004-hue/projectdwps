import React from 'react';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: 'psychology',
      title: 'Academic Excellence',
      desc: 'Engaging lessons that inspire curiosity and critical thinking, taught by certified, compassionate mentors.'
    },
    {
      icon: 'favorite',
      title: 'Holistic Growth',
      desc: 'Programs fostering character, discipline, creativity, and modern values that prepare children for a dynamic world.'
    },
    {
      icon: 'sports_soccer',
      title: 'Sports & Fitness',
      desc: 'Encouraging teamwork, motor coordination, physical stamina, and lifelong healthy habits through daily active play.'
    },
    {
      icon: 'shield',
      title: 'Smart Safety Infrastructure',
      desc: 'Child-safe campus architecture, constant monitoring, clean sanitization, and vetted school staff members.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              Our Services &amp; Core Pillars
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-serif text-[#021936] max-w-2xl">
              Empowering Young Minds with Care &amp; Commitment Every Day
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44474e] max-w-md">
            Every aspect of the DWPS Ballabgarh educational ecosystem is engineered to support emotional well-being and academic mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-[#F2F8FD] border border-[#dce3ec] hover:border-[#904d00] hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#021936] text-[#FDE68A] flex items-center justify-center mb-5 group-hover:bg-[#904d00] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-[#021936] mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
