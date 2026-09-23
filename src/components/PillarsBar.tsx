import React from 'react';

export const PillarsBar: React.FC = () => {
  const pillars = [
    {
      icon: 'security',
      title: 'Safe, Inclusive Spaces',
      desc: 'Child-first infrastructure with dedicated safety protocols.',
    },
    {
      icon: 'palette',
      title: 'Beyond Academics',
      desc: 'Holistic growth through arts, sports, and life skills.',
    },
    {
      icon: 'supervised_user_circle',
      title: 'Experienced Mentors',
      desc: 'Passionate educators guiding continuous student growth.',
    },
    {
      icon: 'menu_book',
      title: 'Playgroup to Grade School',
      desc: 'Seamless developmental transitions across all stages.',
    },
  ];

  return (
    <section className="bg-[#f7f9ff] pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-4 rounded-xl bg-white border border-[#dce3ec] custom-shadow-card flex items-start gap-3.5 hover:border-[#904d00]/40 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-[#F2F8FD] text-[#904d00] flex-shrink-0">
                <span className="material-symbols-outlined text-xl">{pillar.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#021936]">{pillar.title}</p>
                <p className="text-xs text-[#44474e] mt-0.5 leading-snug">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
