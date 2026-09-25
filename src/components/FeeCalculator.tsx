import React, { useState } from 'react';
import { GRADE_FEE_STRUCTURES, GradeFeeStructure, SCHOOL_INFO } from '../data/schoolData';

interface FeeCalculatorProps {
  onApplyForGrade?: (gradeName: string) => void;
  onBookTourClick?: () => void;
  feeStructures?: GradeFeeStructure[];
}

export const FeeCalculator: React.FC<FeeCalculatorProps> = ({
  onApplyForGrade,
  onBookTourClick,
  feeStructures,
}) => {
  const activeStructures =
    feeStructures && feeStructures.length > 0 ? feeStructures : GRADE_FEE_STRUCTURES;

  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    () => activeStructures[3]?.id || activeStructures[0]?.id || 'grade-1-2'
  );
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  const [transportZone, setTransportZone] = useState<'none' | 'zone1' | 'zone2' | 'zone3'>('zone1');
  const [hasSibling, setHasSibling] = useState<boolean>(false);
  const [includeExtendedCare, setIncludeExtendedCare] = useState<boolean>(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'calculator' | 'comparisonTable'>('calculator');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'Early Years' | 'Primary Wing' | 'Middle Wing'>('all');

  const selectedStructure: GradeFeeStructure =
    activeStructures.find((g) => g.id === selectedGradeId) || activeStructures[0] || GRADE_FEE_STRUCTURES[0];

  // Transport rates per month
  const getMonthlyTransportFee = () => {
    switch (transportZone) {
      case 'zone1':
        return 1100; // Subhash Colony, Chawla Colony, Sector 2 Market
      case 'zone2':
        return 1400; // Adarsh Nagar, Sector 3, Tigaon Road
      case 'zone3':
        return 1800; // Faridabad By-Pass, YMCA Chowk, Railway Link
      default:
        return 0;
    }
  };

  const monthlyTuition = selectedStructure.monthlyTuition;
  const monthlyActivity = selectedStructure.activitySmartClass;
  const monthlyTransport = getMonthlyTransportFee();
  const monthlyExtended = includeExtendedCare ? 1200 : 0;

  // Sibling discount: 10% off tuition
  const monthlySiblingDiscount = hasSibling ? Math.round(monthlyTuition * 0.1) : 0;

  // Multiplier for billing period
  const monthsMultiplier = billingPeriod === 'monthly' ? 1 : billingPeriod === 'quarterly' ? 3 : 12;

  // Annual charges apportioned
  // e.g., if quarterly, 1/4 of annual charges, if annual all, if monthly 1/12
  const periodAnnualCharges =
    billingPeriod === 'annual'
      ? selectedStructure.annualCharges
      : billingPeriod === 'quarterly'
      ? Math.round(selectedStructure.annualCharges / 4)
      : Math.round(selectedStructure.annualCharges / 12);

  // Billing period discounts (e.g. 5% on quarterly tuition, 10% on annual tuition)
  const billingPeriodDiscountPercent = billingPeriod === 'annual' ? 0.1 : billingPeriod === 'quarterly' ? 0.03 : 0;
  const periodTuitionGross = monthlyTuition * monthsMultiplier;
  const periodPeriodDiscount = Math.round(periodTuitionGross * billingPeriodDiscountPercent);

  const periodTuitionNet = periodTuitionGross - periodPeriodDiscount - monthlySiblingDiscount * monthsMultiplier;
  const periodActivity = monthlyActivity * monthsMultiplier;
  const periodTransport = monthlyTransport * monthsMultiplier;
  const periodExtended = monthlyExtended * monthsMultiplier;

  // Total recurring for the period
  const totalRecurringForPeriod = periodTuitionNet + periodActivity + periodTransport + periodExtended + periodAnnualCharges;

  // One-time fees (new admissions only)
  const oneTimeAdmissionFee = selectedStructure.admissionFee;
  const refundableSecurity = selectedStructure.securityDeposit;
  const totalOneTime = oneTimeAdmissionFee + refundableSecurity;

  return (
    <div className="bg-white rounded-2xl border-2 border-[#dce3ec] custom-shadow-card overflow-hidden">
      {/* Top Header & Switcher */}
      <div className="bg-[#021936] text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#904d00] text-white text-[10px] font-bold uppercase tracking-wider">
                Transparent Fee Structure
              </span>
              <span className="text-xs text-[#FDE68A] font-semibold">
                Session {SCHOOL_INFO.academicYear}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              Interactive Fee Estimator
            </h3>
            <p className="text-xs sm:text-sm text-[#8396b9] mt-1 max-w-xl">
              Calculate exact tuition, transport, smart classroom, and sibling concessions for your child's grade level.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#1a2e4c] p-1 rounded-xl self-start md:self-auto border border-[#8396b9]/30">
            <button
              onClick={() => setViewMode('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calculator'
                  ? 'bg-[#904d00] text-white shadow-xs'
                  : 'text-[#8396b9] hover:text-white'
              }`}
            >
              Calculator View
            </button>
            <button
              onClick={() => setViewMode('comparisonTable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'comparisonTable'
                  ? 'bg-[#904d00] text-white shadow-xs'
                  : 'text-[#8396b9] hover:text-white'
              }`}
            >
              All Grades Comparison
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'comparisonTable' ? (
        /* Comparative Fee Matrix */
        <div className="p-6 sm:p-8 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#021936] uppercase tracking-wider">
              Complete Grade-Wise Fee Matrix (Session {SCHOOL_INFO.academicYear})
            </h4>
            <span className="text-xs text-slate-500">* All amounts in Indian Rupees (₹)</span>
          </div>

          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-[#F2F8FD] border-b border-[#dce3ec] text-[#021936]">
                <th className="py-3 px-4 font-bold">Grade Level</th>
                <th className="py-3 px-3 font-bold">Age Group</th>
                <th className="py-3 px-3 font-bold">Monthly Tuition</th>
                <th className="py-3 px-3 font-bold">Smart Class / Mo.</th>
                <th className="py-3 px-3 font-bold">Annual Charges</th>
                <th className="py-3 px-3 font-bold">One-Time Adm.</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dce3ec]">
              {activeStructures.map((g) => (
                <tr
                  key={g.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedGradeId === g.id ? 'bg-amber-50/50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-[#021936]">
                    <div className="font-bold">{g.gradeName}</div>
                    <span className="text-[10px] text-slate-500 uppercase">{g.category}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{g.ageGroup}</td>
                  <td className="py-3.5 px-3 font-mono font-bold text-[#904d00]">₹{g.monthlyTuition.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-700">₹{g.activitySmartClass}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-700">₹{g.annualCharges.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">₹{g.admissionFee.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedGradeId(g.id);
                        setViewMode('calculator');
                      }}
                      className="px-3 py-1 bg-[#021936] hover:bg-[#904d00] text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Calculate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#904d00] text-base">verified</span>
              <span>No hidden deposits. Uniform &amp; book sets are available at subsidized council rates.</span>
            </div>
            <button
              onClick={() => setViewMode('calculator')}
              className="text-[#904d00] font-bold hover:underline cursor-pointer"
            >
              ← Back to Custom Calculator
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Step-by-Step Calculator */
        <div className="p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Step 1: Grade Level Selector Tabs */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-[#021936] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#021936] text-[#FDE68A] text-[11px] font-serif flex items-center justify-center">
                  1
                </span>
                <span>Select Child's Grade Level</span>
              </label>

              {/* Wing Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-[#F2F8FD] p-1 rounded-lg border border-[#dce3ec] text-[11px]">
                {[
                  { id: 'all', label: 'All Classes (7)' },
                  { id: 'Early Years', label: 'Pre-Primary (4 Classes)' },
                  { id: 'Primary Wing', label: 'Primary Wing (Grades 1-5)' },
                  { id: 'Middle Wing', label: 'Middle Wing (Class 6-8)' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveCategoryFilter(w.id as any)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      activeCategoryFilter === w.id
                        ? 'bg-[#021936] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#021936] hover:bg-slate-100'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Grade Headline */}
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#904d00] text-sm">school</span>
                <span className="text-slate-700">Currently Calculating: <strong className="text-[#021936]">{selectedStructure.gradeName}</strong></span>
              </div>
              <span className="font-semibold text-[#904d00]">
                {selectedStructure.category} • Age {selectedStructure.ageGroup}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {activeStructures
                .filter((g) => activeCategoryFilter === 'all' || g.category === activeCategoryFilter)
                .map((grade) => {
                  const isSelected = selectedGradeId === grade.id;
                  return (
                    <button
                      key={grade.id}
                      onClick={() => setSelectedGradeId(grade.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-[#904d00] bg-amber-50/70 text-[#021936] shadow-xs ring-2 ring-[#904d00]/30'
                          : 'border-[#dce3ec] bg-[#F2F8FD] hover:bg-slate-100 text-[#44474e]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {grade.category === 'Early Years' ? 'Pre-Primary' : grade.category.replace(' Wing', '')}
                        </span>
                      </div>
                      <div className="text-xs font-bold truncate mt-0.5" title={grade.gradeName}>
                        {grade.gradeName}
                      </div>
                      <div className="text-[10px] font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]/60"></span>
                        <span>{grade.ageGroup}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-[#904d00] mt-1.5">
                        ₹{grade.monthlyTuition.toLocaleString('en-IN')}/mo
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Step 2: Customization Grid: Billing Period, Transport, Concessions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 2A: Payment Cycle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#021936] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#021936] text-[#FDE68A] text-[11px] font-serif flex items-center justify-center">
                  2
                </span>
                <span>Billing Period</span>
              </label>

              <div className="space-y-1.5">
                {[
                  { id: 'monthly', label: 'Monthly Billing', note: 'Standard cycle' },
                  { id: 'quarterly', label: 'Quarterly (3 Months)', note: '3% Tuition Waiver', popular: true },
                  { id: 'annual', label: 'Annual Advance', note: '10% Tuition Concession' },
                ].map((cycle) => (
                  <div
                    key={cycle.id}
                    onClick={() => setBillingPeriod(cycle.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      billingPeriod === cycle.id
                        ? 'border-[#021936] bg-[#021936] text-white shadow-xs'
                        : 'border-[#dce3ec] bg-white hover:bg-slate-50 text-[#021936]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{cycle.label}</span>
                        {cycle.popular && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            billingPeriod === cycle.id ? 'bg-[#fe932c] text-[#021936]' : 'bg-[#ffdcc3] text-[#2f1500]'
                          }`}>
                            Popular
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] ${billingPeriod === cycle.id ? 'text-[#8396b9]' : 'text-slate-500'}`}>
                        {cycle.note}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      billingPeriod === cycle.id ? 'border-white bg-[#fe932c]' : 'border-slate-300'
                    }`}>
                      {billingPeriod === cycle.id && <span className="w-1.5 h-1.5 bg-[#021936] rounded-full"></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2B: Transport Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#021936] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#021936] text-[#FDE68A] text-[11px] font-serif flex items-center justify-center">
                  3
                </span>
                <span>Bus Transport Route</span>
              </label>

              <select
                value={transportZone}
                onChange={(e) => setTransportZone(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] focus:border-[#904d00] outline-none"
              >
                <option value="none">No School Bus (Self Drop/Pickup) — ₹0</option>
                <option value="zone1">Zone 1: Subhash / Chawla Colony (within 3km) — ₹1,100/mo</option>
                <option value="zone2">Zone 2: Sector 2, Sector 3, Adarsh Nagar — ₹1,400/mo</option>
                <option value="zone3">Zone 3: Faridabad By-Pass, YMCA, Station — ₹1,800/mo</option>
              </select>

              <div className="p-3 rounded-xl bg-slate-50 border border-[#dce3ec] text-[11px] text-slate-600 leading-snug">
                <span className="font-bold text-[#021936] block mb-0.5">Fleet Safety Features:</span>
                GPS bus tracking app for parents, speed governors, CCTV cameras, and trained lady attendant on all routes.
              </div>
            </div>

            {/* 2C: Special Concessions & Add-ons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#021936] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#021936] text-[#FDE68A] text-[11px] font-serif flex items-center justify-center">
                  4
                </span>
                <span>Special Concessions</span>
              </label>

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#dce3ec] bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSibling}
                    onChange={(e) => setHasSibling(e.target.checked)}
                    className="mt-0.5 accent-[#904d00] w-4 h-4 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#021936] block">
                      Sibling Concession (10% Off)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Applied on monthly tuition for second child currently studying at DWPS.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#dce3ec] bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExtendedCare}
                    onChange={(e) => setIncludeExtendedCare(e.target.checked)}
                    className="mt-0.5 accent-[#904d00] w-4 h-4 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#021936] block">
                      Extended Day Boarding (+₹1,200/mo)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supervised post-school activity &amp; homework room until 4:30 PM.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Step 3: Estimated Summary Card with Breakdown */}
          <div className="rounded-2xl bg-[#F2F8FD] border-2 border-[#dce3ec] p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Details Breakdown */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2">
                  <span className="text-xs text-slate-600">
                    Tuition Fee ({monthsMultiplier} {monthsMultiplier === 1 ? 'Month' : 'Months'} @ ₹{monthlyTuition}/mo):
                  </span>
                  <span className="text-xs font-mono font-bold text-[#021936]">
                    ₹{periodTuitionGross.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2">
                  <span className="text-xs text-slate-600">
                    Smart Classroom &amp; Activity Charges:
                  </span>
                  <span className="text-xs font-mono font-bold text-[#021936]">
                    ₹{periodActivity.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2">
                  <span className="text-xs text-slate-600">
                    Annual Curriculum &amp; Examination Charges ({billingPeriod}):
                  </span>
                  <span className="text-xs font-mono font-bold text-[#021936]">
                    ₹{periodAnnualCharges.toLocaleString('en-IN')}
                  </span>
                </div>

                {monthlyTransport > 0 && (
                  <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2 text-blue-900">
                    <span className="text-xs">
                      School Bus Transport ({monthsMultiplier} Months):
                    </span>
                    <span className="text-xs font-mono font-bold">
                      +₹{periodTransport.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {includeExtendedCare && (
                  <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2 text-indigo-900">
                    <span className="text-xs">
                      Extended Day Boarding Support ({monthsMultiplier} Months):
                    </span>
                    <span className="text-xs font-mono font-bold">
                      +₹{periodExtended.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {periodPeriodDiscount > 0 && (
                  <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2 text-emerald-700">
                    <span className="text-xs">
                      {billingPeriod === 'annual' ? 'Annual Advance 10% Concession' : 'Quarterly 3% Advance Concession'}:
                    </span>
                    <span className="text-xs font-mono font-bold">
                      -₹{periodPeriodDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {hasSibling && (
                  <div className="flex items-center justify-between border-b border-[#dce3ec] pb-2 text-emerald-700">
                    <span className="text-xs">
                      Sibling Discount (10% on Tuition):
                    </span>
                    <span className="text-xs font-mono font-bold">
                      -₹{(monthlySiblingDiscount * monthsMultiplier).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>* One-time Registration &amp; Security (New Admission only):</span>
                  <span className="font-mono font-semibold text-slate-700">₹{totalOneTime.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Right Big Estimated Payable Amount */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#dce3ec] text-center space-y-4 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00] block">
                    Estimated {billingPeriod.toUpperCase()} Payable
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold font-serif text-[#021936] mt-1">
                    ₹{totalRecurringForPeriod.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Equivalent to approx. <strong className="text-[#021936]">₹{Math.round(totalRecurringForPeriod / monthsMultiplier).toLocaleString('en-IN')} / month</strong>
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      if (onApplyForGrade) {
                        onApplyForGrade(selectedStructure.gradeName);
                      }
                      const el = document.getElementById('admissions-form');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full py-3 px-4 bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Apply for {selectedStructure.gradeName}</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBreakdownModal(true)}
                      className="flex-1 py-2 px-3 border border-[#dce3ec] bg-[#F2F8FD] hover:bg-slate-100 text-[#021936] text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      <span>Print Summary</span>
                    </button>

                    {onBookTourClick && (
                      <button
                        onClick={onBookTourClick}
                        className="flex-1 py-2 px-3 border border-[#dce3ec] bg-[#F2F8FD] hover:bg-slate-100 text-[#021936] text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Visit Desk</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Downloadable Fee Estimate Modal */}
      {showBreakdownModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowBreakdownModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#021936] text-white p-6 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold font-serif text-white">
                  {SCHOOL_INFO.name}
                </h4>
                <p className="text-xs text-[#FDE68A]">
                  Official Fee Estimate Slip • Session {SCHOOL_INFO.academicYear}
                </p>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Candidate Grade:</span>
                  <span className="font-bold text-[#021936]">{selectedStructure.gradeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Age Bracket:</span>
                  <span className="font-bold text-[#021936]">{selectedStructure.ageGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Term:</span>
                  <span className="font-bold text-[#904d00] capitalize">{billingPeriod} ({monthsMultiplier} Months)</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-[#dce3ec] py-3">
                <div className="flex justify-between">
                  <span>Tuition Charges:</span>
                  <span className="font-mono">₹{periodTuitionGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Smart Classroom &amp; Activity:</span>
                  <span className="font-mono">₹{periodActivity.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual School Development Charges:</span>
                  <span className="font-mono">₹{periodAnnualCharges.toLocaleString('en-IN')}</span>
                </div>
                {monthlyTransport > 0 && (
                  <div className="flex justify-between">
                    <span>School Bus Transport Service:</span>
                    <span className="font-mono">+₹{periodTransport.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {periodPeriodDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Term Advance Concession:</span>
                    <span className="font-mono">-₹{periodPeriodDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {hasSibling && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Sibling Concession (10%):</span>
                    <span className="font-mono">-₹{(monthlySiblingDiscount * monthsMultiplier).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#021936] pt-2 border-t">
                  <span>Total Recurring Payable:</span>
                  <span className="font-mono text-[#904d00]">₹{totalRecurringForPeriod.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                * Note: Estimates are calculated based on approved session guidelines. Admission confirmation requires document verification at the Subhash Colony office.
              </p>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#021936] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Print Slip
                </button>
                <button
                  onClick={() => setShowBreakdownModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
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
