import React, { useState } from 'react';
import { SCHOOL_INFO, InquiryRecord } from '../data/schoolData';
import { FeeCalculator } from './FeeCalculator';

interface AdmissionsSectionProps {
  onNewInquirySubmitted: (inquiry: InquiryRecord) => void;
  onBookTourClick?: () => void;
}

export const AdmissionsSection: React.FC<AdmissionsSectionProps> = ({
  onNewInquirySubmitted,
  onBookTourClick,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'procedure'>('calculator');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    grade: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<InquiryRecord | null>(null);

  const handleApplyFromFeeCalculator = (gradeName: string) => {
    // Map grade name to form grade options
    let targetGrade = 'Grade 1';
    if (gradeName.toLowerCase().includes('playgroup')) targetGrade = 'Playgroup';
    else if (gradeName.toLowerCase().includes('nursery')) targetGrade = 'Nursery';
    else if (gradeName.toLowerCase().includes('kg') || gradeName.toLowerCase().includes('prep')) targetGrade = 'KG / Prep';
    else if (gradeName.toLowerCase().includes('grade 1')) targetGrade = 'Grade 1';
    else if (gradeName.toLowerCase().includes('grade 2')) targetGrade = 'Grade 2';
    else if (gradeName.toLowerCase().includes('grade 3')) targetGrade = 'Grade 3';
    else if (gradeName.toLowerCase().includes('grade 4')) targetGrade = 'Grade 4';
    else if (gradeName.toLowerCase().includes('middle') || gradeName.toLowerCase().includes('6') || gradeName.toLowerCase().includes('5')) targetGrade = 'Grade 5+';

    setFormData((prev) => ({
      ...prev,
      grade: targetGrade,
      message: prev.message || `Inquiry for ${gradeName} admission session ${SCHOOL_INFO.academicYear}. Estimated fee reviewed.`
    }));

    setActiveTab('procedure');

    setTimeout(() => {
      const el = document.getElementById('admissions-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.email || !formData.grade) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newRecord: InquiryRecord = {
        id: `INQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        studentName: formData.fullName,
        phone: formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`,
        email: formData.email,
        grade: formData.grade,
        message: formData.message,
        date: new Date().toISOString().split('T')[0],
        status: 'New',
      };

      onNewInquirySubmitted(newRecord);
      setSubmittedInquiry(newRecord);
      setIsSubmitting(false);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        grade: '',
        message: '',
      });
    }, 700);
  };

  return (
    <section id="admissions" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Admissions Hub {SCHOOL_INFO.academicYear}
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936]">
            Admissions &amp; Transparent Fee Structure
          </h2>
          <p className="text-sm sm:text-base text-[#44474e]">
            Calculate transparent fee estimates by grade level or complete our 4-step enrollment registration.
          </p>

          {/* Section Navigation Tabs */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'calculator'
                  ? 'bg-[#904d00] text-white shadow-md'
                  : 'bg-[#F2F8FD] text-[#021936] hover:bg-[#dce3ec] border border-[#dce3ec]'
              }`}
            >
              <span className="material-symbols-outlined text-base">calculate</span>
              <span>Interactive Fee Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('procedure')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'procedure'
                  ? 'bg-[#021936] text-white shadow-md'
                  : 'bg-[#F2F8FD] text-[#021936] hover:bg-[#dce3ec] border border-[#dce3ec]'
              }`}
            >
              <span className="material-symbols-outlined text-base">how_to_reg</span>
              <span>4-Step Process &amp; Inquiry Form</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Fee Calculator */}
        {activeTab === 'calculator' && (
          <div className="animate-fadeIn space-y-8">
            <FeeCalculator
              onApplyForGrade={handleApplyFromFeeCalculator}
              onBookTourClick={onBookTourClick}
            />

            <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#904d00]">verified_user</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#021936]">
                    Ready to proceed with admissions?
                  </h4>
                  <p className="text-xs text-slate-600">
                    Switch to the inquiry form to register your seat reservation or visit our Subhash Colony campus desk.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('procedure')}
                className="py-2.5 px-5 bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <span>Go to Admission Form</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: 4-Step Process & Form */}
        {activeTab === 'procedure' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fadeIn">
            {/* Left: 4-Step Process Guide */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                  Admissions {SCHOOL_INFO.academicYear} Procedure
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold font-serif text-[#021936] mt-2">
                  Join the DWPS Family in 4 Simple Steps
                </h3>
                <p className="text-sm sm:text-base text-[#44474e] mt-3 leading-relaxed">
                  We make the enrollment process stress-free and transparent for every family. Our admissions team is dedicated to guiding you through every step.
                </p>
              </div>

              {/* Steps List */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ffdcc3] text-[#2f1500] font-bold text-base flex items-center justify-center flex-shrink-0 font-serif">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#021936]">Inquiry &amp; Registration</h4>
                    <p className="text-xs sm:text-sm text-[#44474e] mt-0.5">
                      Fill out the quick online inquiry form or visit our school reception directly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ffdcc3] text-[#2f1500] font-bold text-base flex items-center justify-center flex-shrink-0 font-serif">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#021936]">Campus Visit &amp; Interaction</h4>
                    <p className="text-xs sm:text-sm text-[#44474e] mt-0.5">
                      Tour our Subhash Colony campus, meet our teachers, and experience our classrooms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ffdcc3] text-[#2f1500] font-bold text-base flex items-center justify-center flex-shrink-0 font-serif">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#021936]">Simple Documentation</h4>
                    <p className="text-xs sm:text-sm text-[#44474e] mt-0.5">
                      Submit child’s birth certificate, photographs, and basic residential proofs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#021936] text-[#FDE68A] font-bold text-base flex items-center justify-center flex-shrink-0 font-serif shadow-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#021936]">Welcome to DWPS</h4>
                    <p className="text-xs sm:text-sm text-[#44474e] mt-0.5">
                      Confirm admission and receive your starter kit, booklist, and uniform details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Hotline Callout */}
              <div className="p-5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
                    Have Urgent Questions?
                  </p>
                  <p className="text-xs sm:text-sm text-[#021936] font-semibold mt-0.5">
                    Call our Admissions Desk:
                  </p>
                  <p className="text-lg sm:text-xl font-bold font-serif text-[#021936]">
                    {SCHOOL_INFO.phone}
                  </p>
                </div>
                <a
                  className="p-3 bg-[#904d00] text-white rounded-full hover:bg-[#B45309] transition-colors shadow-md flex items-center justify-center"
                  href={`tel:${SCHOOL_INFO.phone.replace(/[^0-9+]/g, '')}`}
                  aria-label="Call Admissions Desk"
                >
                  <span className="material-symbols-outlined text-2xl">phone_in_talk</span>
                </a>
              </div>
            </div>

            {/* Right: Interactive Admission Form */}
            <div className="lg:col-span-7" id="admissions-form">
              <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl border-2 border-[#dce3ec] custom-shadow-card">
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#021936] font-serif">
                    Admissions Inquiry Form ({SCHOOL_INFO.academicYear})
                  </h3>
                  <p className="text-xs sm:text-sm text-[#44474e] mt-1">
                    Fill in your details below and our academic counselor will connect with you.
                  </p>
                  {formData.grade && (
                    <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#904d00]">check_circle</span>
                      <span>Selected Grade from Fee Calculator: <strong>{formData.grade}</strong></span>
                    </div>
                  )}
                </div>

                {submittedInquiry ? (
                  <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-green-900 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                      <div>
                        <h4 className="text-base font-bold">Inquiry Successfully Registered!</h4>
                        <p className="text-xs text-green-700">Application Reference ID: <strong className="font-mono">{submittedInquiry.id}</strong></p>
                      </div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg text-xs space-y-1 text-slate-700">
                      <p><strong>Candidate:</strong> {submittedInquiry.studentName}</p>
                      <p><strong>Grade:</strong> {submittedInquiry.grade}</p>
                      <p><strong>Contact:</strong> {submittedInquiry.phone} ({submittedInquiry.email})</p>
                      <p className="text-slate-500 pt-1">Our admissions desk in Subhash Colony will reach out within 24 business hours.</p>
                    </div>
                    <button
                      onClick={() => setSubmittedInquiry(null)}
                      className="w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#021936] mb-1.5 uppercase tracking-wider" htmlFor="fullName">
                          Student / Parent Full Name *
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full h-[50px] px-4 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#151c23] text-sm focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#021936] mb-1.5 uppercase tracking-wider" htmlFor="contactNumber">
                          Contact Phone (+91) *
                        </label>
                        <input
                          id="contactNumber"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98996 38676"
                          className="w-full h-[50px] px-4 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#151c23] text-sm focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#021936] mb-1.5 uppercase tracking-wider" htmlFor="emailAddress">
                          Email Address *
                        </label>
                        <input
                          id="emailAddress"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@domain.com"
                          className="w-full h-[50px] px-4 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#151c23] text-sm focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#021936] mb-1.5 uppercase tracking-wider" htmlFor="gradeClass">
                          Applying For Class / Grade *
                        </label>
                        <select
                          id="gradeClass"
                          required
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                          className="w-full h-[50px] px-4 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#151c23] text-sm focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 transition-all outline-none"
                        >
                          <option value="" disabled>Select Grade</option>
                          <option value="Playgroup">Playgroup (Age 2-3)</option>
                          <option value="Nursery">Nursery (Age 3-4)</option>
                          <option value="KG / Prep">KG / Prep (Age 4-5)</option>
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5+">Grade 5 &amp; Middle School</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#021936] mb-1.5 uppercase tracking-wider" htmlFor="messageText">
                        Your Questions / Specific Needs
                      </label>
                      <textarea
                        id="messageText"
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your child's interests or any questions regarding school transport, fee structure, or timings..."
                        className="w-full p-4 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#151c23] text-sm focus:border-[#904d00] focus:ring-2 focus:ring-[#904d00]/20 transition-all outline-none resize-none"
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#904d00] hover:bg-[#B45309] disabled:opacity-75 text-white font-bold rounded-lg shadow-md hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">send</span>
                            <span>Submit Admission Inquiry</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#44474e] text-center pt-1">
                      We respect your privacy. Inquiries are handled strictly by DWPS Ballabgarh administration.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
