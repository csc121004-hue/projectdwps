import React, { useState } from 'react';
import {
  SCHOOL_INFO,
  InquiryRecord,
  GradeFeeStructure,
  GRADE_FEE_STRUCTURES
} from '../data/schoolData';
import { AdmissionsSection } from './AdmissionsSection';
import { AdmissionsFAQ } from './AdmissionsFAQ';

interface AdmissionsViewProps {
  onNewInquirySubmitted: (inquiry: InquiryRecord) => void;
  onBookTourClick: () => void;
  onApplyClick?: () => void;
  feeStructures?: GradeFeeStructure[];
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({
  onNewInquirySubmitted,
  onBookTourClick,
  onApplyClick,
  feeStructures,
}) => {
  // Age Eligibility Calculator State
  const [childAge, setChildAge] = useState<number>(4);
  const [eligibilityResult, setEligibilityResult] = useState<string>('L.KG (Lower KG, Age 4 – 5 Years)');

  const checkEligibility = (age: number) => {
    setChildAge(age);
    if (age < 2.5) {
      setEligibilityResult('Too young for 2026-27 session (Minimum age: 2.5 years for Playgroup)');
    } else if (age < 3) {
      setEligibilityResult('Eligible for Playgroup (Pre-Primary, Age 2.5 – 3 Years)');
    } else if (age < 4) {
      setEligibilityResult('Eligible for Nursery (Pre-Primary, Age 3 – 4 Years)');
    } else if (age < 5) {
      setEligibilityResult('Eligible for L.KG (Lower Kindergarten, Age 4 – 5 Years)');
    } else if (age < 6) {
      setEligibilityResult('Eligible for U.KG (Upper Kindergarten, Age 5 – 6 Years)');
    } else if (age <= 7.5) {
      setEligibilityResult('Eligible for Grade 1 (Formal Primary Wing, Age 6+ Years)');
    } else if (age <= 10.5) {
      const g = Math.min(5, Math.max(2, Math.floor(age - 5)));
      setEligibilityResult(`Eligible for Primary Wing: Grade ${g} (Age 7.5 – 10.5 Years)`);
    } else if (age <= 14) {
      const g = Math.min(8, Math.max(6, Math.floor(age - 5)));
      setEligibilityResult(`Eligible for Middle Wing: Class 6 to 8 (Grade ${g}, Age 11 – 14 Years - Subject to previous school TC)`);
    } else {
      setEligibilityResult('Please contact Admissions Office for Secondary evaluation');
    }
  };

  // Fee Calculator State (dynamically derived from live feeStructures)
  const activeStructures: GradeFeeStructure[] =
    feeStructures && feeStructures.length > 0 ? feeStructures : GRADE_FEE_STRUCTURES;
  const [selectedFeeGradeId, setSelectedFeeGradeId] = useState<string>('playgroup');
  const [includeTransport, setIncludeTransport] = useState(true);
  const [isSibling, setIsSibling] = useState(false);

  const selectedFeeGrade = activeStructures.find((s) => s.id === selectedFeeGradeId) || activeStructures[0];
  const tuition = selectedFeeGrade.monthlyTuition;
  const smartClass = selectedFeeGrade.activitySmartClass;
  const getTransport = () => (includeTransport ? 1200 : 0);
  const transport = getTransport();
  const siblingDiscount = isSibling ? Math.round(tuition * 0.1) : 0;
  const netMonthly = tuition + smartClass + transport - siblingDiscount;
  const quarterlyEst = netMonthly * 3;

  const [checklist, setChecklist] = useState({
    birthCert: true,
    photos: true,
    aadhar: true,
    tc: false,
    addressProof: true,
    medicalFitness: false
  });

  return (
    <div className="py-12 bg-[#f7f9ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 space-y-16">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdcc3] text-[#2f1500] text-xs font-bold uppercase tracking-wider inline-block">
            Admissions Hub {SCHOOL_INFO.academicYear}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#021936]">
            Transparent Admissions, Warm Beginnings
          </h1>
          <p className="text-sm sm:text-base text-[#44474e]">
            Everything parents in Ballabgarh need: Age criteria, fee structure estimator, required documents, FAQ knowledge base, and immediate counselor assistance.
          </p>

          {/* Quick Jump Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <a
              href="#age-checker"
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#021936] font-semibold border border-[#dce3ec] transition-colors shadow-2xs"
            >
              Age Criteria
            </a>
            <a
              href="#admissions-faq"
              className="px-3 py-1.5 rounded-full bg-[#021936] hover:bg-[#1a2e4c] text-white font-semibold transition-colors shadow-2xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm text-[#FDE68A]">help</span>
              <span>Admissions FAQ</span>
            </a>
            <a
              href="#documents"
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#021936] font-semibold border border-[#dce3ec] transition-colors shadow-2xs"
            >
              Document Checklist
            </a>
            <a
              href="#admissions"
              className="px-3 py-1.5 rounded-full bg-[#904d00] hover:bg-[#B45309] text-white font-semibold transition-colors shadow-2xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">calculate</span>
              <span>Fee Calculator &amp; Form</span>
            </a>
          </div>
        </div>

        {/* 2-Column Tools: Age Eligibility & Fee Estimator */}
        <div id="age-checker" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-24">
          {/* Tool 1: Age Eligibility Checker */}
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="p-2.5 rounded-lg bg-[#F2F8FD] text-[#904d00]">
                  <span className="material-symbols-outlined text-2xl">child_care</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#021936]">
                    Age Eligibility Checker
                  </h3>
                  <p className="text-xs text-slate-500">As on March 31, 2026</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#44474e] mb-6">
                Slide to select your child’s age to check the government and CBSE aligned grade placement at DWPS Ballabgarh.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#021936]">Child's Age:</span>
                  <span className="text-xl font-bold text-[#904d00] font-mono">
                    {childAge} Years
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={childAge}
                  onChange={(e) => checkEligibility(parseFloat(e.target.value))}
                  className="w-full accent-[#904d00] cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>2.5 Yrs (Playgroup)</span>
                  <span>3 Yrs (Nursery)</span>
                  <span>4 Yrs (L.KG)</span>
                  <span>5 Yrs (U.KG)</span>
                  <span>6+ Yrs (Grade 1)</span>
                </div>

                <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] mt-4">
                  <span className="text-[11px] font-bold text-[#904d00] uppercase tracking-wider block">
                    Recommended Placement
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#021936] mt-1">
                    {eligibilityResult}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Relaxation up to 30 days can be considered per Haryana Directorate guidelines.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need personal counseling?</span>
              <button
                onClick={onBookTourClick}
                className="text-xs font-bold text-[#904d00] hover:underline"
              >
                Meet Principal Counselor →
              </button>
            </div>
          </div>

          {/* Tool 2: Fee Structure Estimator */}
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="p-2.5 rounded-lg bg-[#F2F8FD] text-[#904d00]">
                  <span className="material-symbols-outlined text-2xl">calculate</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#021936]">
                    Fee Structure Estimator
                  </h3>
                  <p className="text-xs text-slate-500">Session 2026-27 • Transparent &amp; Affordable</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#021936] uppercase">
                      Select Class / Grade
                    </label>
                    <span className="text-[11px] font-semibold text-[#904d00]">
                      {selectedFeeGrade.gradeName} • Age {selectedFeeGrade.ageGroup}
                    </span>
                  </div>

                  {/* Pre-Primary Section (4 Classes) */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Pre-Primary Section (4 Classes):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {activeStructures.filter(s => s.category === 'Early Years').map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedFeeGradeId(cls.id)}
                          className={`p-2 text-left rounded-xl border transition-all cursor-pointer ${
                            selectedFeeGradeId === cls.id
                              ? 'bg-[#021936] text-white border-[#021936] shadow-xs ring-2 ring-[#904d00]/30'
                              : 'bg-white text-slate-700 border-[#dce3ec] hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{cls.gradeName.split(' ')[0]}</div>
                          <div className={`text-[10px] font-medium mt-0.5 ${selectedFeeGradeId === cls.id ? 'text-[#FDE68A]' : 'text-slate-500'}`}>
                            {cls.ageGroup}
                          </div>
                          <div className={`text-[11px] font-mono font-bold mt-1 ${selectedFeeGradeId === cls.id ? 'text-[#fe932c]' : 'text-[#904d00]'}`}>
                            ₹{cls.monthlyTuition}/mo
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Wing (Grades 1 to 5) */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Primary Wing (Age 6 – 10.5 Years):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {activeStructures.filter(s => s.category === 'Primary Wing').map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedFeeGradeId(cls.id)}
                          className={`p-2 text-left rounded-xl border transition-all cursor-pointer ${
                            selectedFeeGradeId === cls.id
                              ? 'bg-[#021936] text-white border-[#021936] shadow-xs ring-2 ring-[#904d00]/30'
                              : 'bg-white text-slate-700 border-[#dce3ec] hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{cls.gradeName}</div>
                          <div className={`text-[10px] font-medium mt-0.5 ${selectedFeeGradeId === cls.id ? 'text-[#FDE68A]' : 'text-slate-500'}`}>
                            {cls.ageGroup}
                          </div>
                          <div className={`text-[11px] font-mono font-bold mt-1 ${selectedFeeGradeId === cls.id ? 'text-[#fe932c]' : 'text-[#904d00]'}`}>
                            ₹{cls.monthlyTuition}/mo
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Middle Wing (Class 6 to 8 • Age 11 to 14) */}
                  <div>
                    <span className="text-[10px] font-bold text-[#904d00] uppercase tracking-wider block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]"></span>
                        Middle Wing (Class 6 to 8)
                      </span>
                      <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        Age 11 – 14 Years
                      </span>
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {activeStructures.filter(s => s.category === 'Middle Wing').map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedFeeGradeId(cls.id)}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedFeeGradeId === cls.id
                              ? 'bg-[#021936] text-white border-[#021936] shadow-xs ring-2 ring-[#904d00]/30'
                              : 'bg-white text-slate-700 border-[#dce3ec] hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold flex items-center gap-2">
                              <span>Class 6 to 8 (Middle Wing)</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${selectedFeeGradeId === cls.id ? 'bg-[#904d00] text-white' : 'bg-slate-100 text-slate-700'}`}>
                                Grades 6, 7 &amp; 8
                              </span>
                            </div>
                            <div className={`text-[10px] font-medium mt-0.5 ${selectedFeeGradeId === cls.id ? 'text-[#FDE68A]' : 'text-slate-500'}`}>
                              Age 11 – 14 Years • CBSE Middle Curriculum, STEM Science Labs &amp; Sports
                            </div>
                          </div>
                          <div className="text-right pl-3 shrink-0">
                            <div className={`text-xs sm:text-sm font-mono font-bold ${selectedFeeGradeId === cls.id ? 'text-[#fe932c]' : 'text-[#904d00]'}`}>
                              ₹{cls.monthlyTuition.toLocaleString('en-IN')}/mo
                            </div>
                            <div className="text-[9px] text-slate-400">Monthly Tuition</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-[#021936] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTransport}
                      onChange={(e) => setIncludeTransport(e.target.checked)}
                      className="rounded accent-[#904d00]"
                    />
                    <span>Include Safe School Bus Transport (Subhash Colony / Ballabgarh)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-[#021936] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSibling}
                      onChange={(e) => setIsSibling(e.target.checked)}
                      className="rounded accent-[#904d00]"
                    />
                    <span>Sibling Concession (10% rebate on monthly tuition fee)</span>
                  </label>
                </div>

                {/* Calculation Summary Card */}
                <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Class:</span>
                    <span className="font-bold text-[#021936]">{selectedFeeGrade.gradeName} ({selectedFeeGrade.ageGroup})</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Tuition Fee:</span>
                    <span className="font-semibold text-[#021936]">₹{tuition.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Smart Classroom &amp; Activity:</span>
                    <span className="font-semibold text-[#021936]">₹{smartClass.toLocaleString('en-IN')}</span>
                  </div>
                  {includeTransport && (
                    <div className="flex justify-between text-slate-600">
                      <span>Transport &amp; GPS Bus Service:</span>
                      <span className="font-semibold text-[#021936]">₹{transport.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {isSibling && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Sibling Discount Applied:</span>
                      <span>-₹{siblingDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#dce3ec] flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#021936] uppercase">Est. Monthly:</span>
                    <span className="text-lg font-bold text-[#904d00] font-mono">
                      ₹{netMonthly.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Quarterly Payment (3 Months):</span>
                    <span className="font-semibold text-slate-700">₹{quarterlyEst.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              * Note: One-time admission registration fee and security deposit apply at the time of final confirmation.
            </p>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div id="documents" className="bg-white p-8 rounded-2xl border border-[#dce3ec] custom-shadow-card scroll-mt-24">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider">
              Document Checklist
            </span>
            <h3 className="text-2xl font-bold font-serif text-[#021936] mt-1">
              Documents Required for Admission Verification
            </h3>
            <p className="text-xs sm:text-sm text-[#44474e] mt-1">
              Keep these ready in self-attested photocopies when visiting the campus office in Subhash Colony.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.birthCert}
                onChange={(e) => setChecklist({ ...checklist, birthCert: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                Municipal Birth Certificate (Self-attested)
              </span>
            </label>

            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.photos}
                onChange={(e) => setChecklist({ ...checklist, photos: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                4 Passport-sized Color Photographs of Child
              </span>
            </label>

            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.aadhar}
                onChange={(e) => setChecklist({ ...checklist, aadhar: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                Child &amp; Parents’ Aadhar Card Copies
              </span>
            </label>

            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.tc}
                onChange={(e) => setChecklist({ ...checklist, tc: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                Transfer Certificate (TC) (Grade 1 &amp; above)
              </span>
            </label>

            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.addressProof}
                onChange={(e) => setChecklist({ ...checklist, addressProof: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                Residence Proof (Electricity bill / Voter ID / Rent agreement)
              </span>
            </label>

            <label className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.medicalFitness}
                onChange={(e) => setChecklist({ ...checklist, medicalFitness: e.target.checked })}
                className="accent-[#904d00] w-4 h-4"
              />
              <span className="font-semibold text-[#021936]">
                Medical Fitness &amp; Blood Group Certificate
              </span>
            </label>
          </div>
        </div>

        {/* Accordion-Style Admissions FAQ Section */}
        <AdmissionsFAQ
          onScheduleTourClick={onBookTourClick}
          onApplyClick={
            onApplyClick ||
            (() => {
              const el = document.getElementById('admissions-form');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            })
          }
        />

        {/* Reusable Core Admissions Inquiry Form with Interactive Fee Calculator */}
        <AdmissionsSection
          feeStructures={feeStructures}
          onNewInquirySubmitted={onNewInquirySubmitted}
          onBookTourClick={onBookTourClick}
        />
      </div>
    </div>
  );
};
