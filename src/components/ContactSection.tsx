import React from 'react';
import { SCHOOL_INFO } from '../data/schoolData';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-[#F2F8FD] border-t border-[#dce3ec]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
            Visit Our Campus
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold font-serif text-[#021936]">
            We Welcome You to Ballabgarh Campus
          </h2>
          <p className="text-sm sm:text-base text-[#44474e]">
            Reach out for admissions, queries, or to arrange an in-person tour of our school facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Address Card */}
          <div className="bg-white p-7 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F8FD] text-[#904d00] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">location_on</span>
              </div>
              <h3 className="text-lg font-bold text-[#021936] mb-2 font-serif">School Address</h3>
              <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
                1008, Gali no-11, Subhash Colony,<br />
                Ballabgarh, Faridabad - 121004,<br />
                Haryana, India.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-[#dce3ec]/60">
              <span className="text-xs text-[#904d00] font-bold">Landmark: Subhash Colony Hub</span>
            </div>
          </div>

          {/* Contact Numbers & Email */}
          <div className="bg-white p-7 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F8FD] text-[#904d00] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <h3 className="text-lg font-bold text-[#021936] mb-2 font-serif">Contact &amp; Inquiries</h3>
              <div className="space-y-2 text-xs sm:text-sm text-[#44474e]">
                <p>
                  <strong className="text-[#021936] font-semibold">Helpline:</strong><br />
                  <a
                    className="text-[#904d00] hover:underline font-bold text-base"
                    href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
                  >
                    {SCHOOL_INFO.phone}
                  </a>
                </p>
                <p>
                  <strong className="text-[#021936] font-semibold">Email Desk:</strong><br />
                  <a className="hover:underline hover:text-[#904d00]" href={`mailto:${SCHOOL_INFO.email}`}>
                    {SCHOOL_INFO.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-[#dce3ec]/60">
              <span className="text-xs text-[#904d00] font-bold">Visiting Hours: {SCHOOL_INFO.officeHours}</span>
            </div>
          </div>

          {/* Social & Community Connection */}
          <div className="bg-white p-7 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F8FD] text-[#904d00] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">public</span>
              </div>
              <h3 className="text-lg font-bold text-[#021936] mb-2 font-serif">Connect With Us</h3>
              <p className="text-xs sm:text-sm text-[#44474e] mb-4 leading-relaxed">
                Stay updated with latest school events, student achievements, and academic announcements.
              </p>
              <div className="flex items-center gap-3">
                <a
                  className="w-10 h-10 rounded-full bg-[#F2F8FD] hover:bg-[#904d00] hover:text-white text-[#021936] flex items-center justify-center transition-colors shadow-xs font-bold text-sm"
                  href={SCHOOL_INFO.social.facebook}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Facebook"
                >
                  fb
                </a>
                <a
                  className="w-10 h-10 rounded-full bg-[#F2F8FD] hover:bg-[#904d00] hover:text-white text-[#021936] flex items-center justify-center transition-colors shadow-xs font-bold text-sm"
                  href={SCHOOL_INFO.social.instagram}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Instagram"
                >
                  ig
                </a>
                <a
                  className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs hover:brightness-110 transition-all"
                  href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="WhatsApp Chat"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                </a>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-[#dce3ec]/60">
              <span className="text-xs text-[#904d00] font-bold">Social: {SCHOOL_INFO.social.handle}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
