import React, { useState, useMemo } from 'react';
import { GradeFeeStructure, SCHOOL_INFO } from '../data/schoolData';
import { FeeCalculator } from './FeeCalculator';

interface FeeManagerProps {
  feeStructures: GradeFeeStructure[];
  onSaveFees: (updatedFees: GradeFeeStructure[]) => Promise<boolean>;
  onResetFees: () => Promise<boolean>;
  dbConnected?: boolean;
}

export const FeeManager: React.FC<FeeManagerProps> = ({
  feeStructures,
  onSaveFees,
  onResetFees,
  dbConnected = true,
}) => {
  // Local working copy of fee structures for editing
  const [localFees, setLocalFees] = useState<GradeFeeStructure[]>(() =>
    JSON.parse(JSON.stringify(feeStructures))
  );

  // Sync if prop updates externally
  React.useEffect(() => {
    setLocalFees(JSON.parse(JSON.stringify(feeStructures)));
  }, [feeStructures]);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'livePreview'>('table');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Save & Status states
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    return localStorage.getItem('dwps_fees_last_saved') || null;
  });

  // Modal states
  const [editingGrade, setEditingGrade] = useState<GradeFeeStructure | null>(null);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRevisionToolOpen, setIsRevisionToolOpen] = useState(false);
  const [revisionPercent, setRevisionPercent] = useState<number>(5);

  // Form state for adding new grade
  const [newGradeForm, setNewGradeForm] = useState<Omit<GradeFeeStructure, 'id'>>({
    gradeName: '',
    category: 'Primary Wing',
    ageGroup: '',
    monthlyTuition: 3500,
    annualCharges: 4500,
    activitySmartClass: 500,
    admissionFee: 5000,
    securityDeposit: 2000,
    description: '',
    features: ['Smart Classroom Digitization', 'CBSE Aligned Curriculum', 'Individual Student Mentorship']
  });

  // Filtered fee list
  const filteredFees = useMemo(() => {
    return localFees.filter((f) => {
      const matchesWing = selectedWing === 'all' || f.category === selectedWing;
      const matchesSearch =
        f.gradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ageGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesWing && matchesSearch;
    });
  }, [localFees, selectedWing, searchTerm]);

  // Statistical summary
  const stats = useMemo(() => {
    if (localFees.length === 0) return { avgTuition: 0, minTuition: 0, maxTuition: 0, avgAnnual: 0 };
    const tuitions = localFees.map((f) => f.monthlyTuition);
    const avgTuition = Math.round(tuitions.reduce((a, b) => a + b, 0) / tuitions.length);
    const minTuition = Math.min(...tuitions);
    const maxTuition = Math.max(...tuitions);
    const avgAnnual = Math.round(
      localFees.map((f) => f.annualCharges).reduce((a, b) => a + b, 0) / localFees.length
    );
    return { avgTuition, minTuition, maxTuition, avgAnnual };
  }, [localFees]);

  // Update a single numeric or string field inline
  const handleFieldChange = (id: string, field: keyof GradeFeeStructure, value: any) => {
    setLocalFees((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const ok = await onSaveFees(localFees);
      if (ok) {
        setHasUnsavedChanges(false);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(timeStr);
        localStorage.setItem('dwps_fees_last_saved', timeStr);
        showToast('🎉 Fees successfully updated! All changes are now LIVE on the website and saved to the database.');
      } else {
        showToast('⚠️ Changes applied to current session. Ensure database is connected for cloud persistence.');
      }
    } catch {
      showToast('❌ Failed to save fees. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset fees to defaults
  const handleConfirmReset = async () => {
    setIsSaving(true);
    setIsResetConfirmOpen(false);
    try {
      await onResetFees();
      setHasUnsavedChanges(false);
      showToast('🔄 Fee structure has been reset to default CBSE institutional rates.');
    } catch {
      showToast('❌ Failed to reset fees.');
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk percentage revision tool (+5%, +8%, etc.)
  const handleApplyRevision = () => {
    const factor = 1 + revisionPercent / 100;
    setLocalFees((prev) =>
      prev.map((g) => ({
        ...g,
        monthlyTuition: Math.round((g.monthlyTuition * factor) / 50) * 50, // rounded to nearest 50
        annualCharges: Math.round((g.annualCharges * factor) / 100) * 100, // rounded to nearest 100
      }))
    );
    setHasUnsavedChanges(true);
    setIsRevisionToolOpen(false);
    showToast(`📈 Applied +${revisionPercent}% revision across all grade tuitions & annual charges. Click "Save All Changes" to make it live.`);
  };

  // Add new grade level
  const handleAddGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeForm.gradeName) return;

    const id = newGradeForm.gradeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newGrade: GradeFeeStructure = {
      ...newGradeForm,
      id,
      features: newGradeForm.features.filter((f) => f.trim().length > 0)
    };

    setLocalFees((prev) => [...prev, newGrade]);
    setHasUnsavedChanges(true);
    setIsAddGradeOpen(false);
    // Reset form
    setNewGradeForm({
      gradeName: '',
      category: 'Primary Wing',
      ageGroup: '',
      monthlyTuition: 3500,
      annualCharges: 4500,
      activitySmartClass: 500,
      admissionFee: 5000,
      securityDeposit: 2000,
      description: '',
      features: ['Smart Classroom Digitization', 'CBSE Aligned Curriculum']
    });
    showToast(`✨ Grade "${newGrade.gradeName}" added! Click "Save All Changes" to publish it live.`);
  };

  // Delete grade level
  const handleDeleteGrade = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the institutional fee structure?`)) {
      setLocalFees((prev) => prev.filter((g) => g.id !== id));
      setHasUnsavedChanges(true);
      showToast(`Removed "${name}". Don't forget to save changes.`);
    }
  };

  // Save edited modal details
  const handleSaveModalEdit = () => {
    if (!editingGrade) return;
    setLocalFees((prev) =>
      prev.map((g) => (g.id === editingGrade.id ? editingGrade : g))
    );
    setHasUnsavedChanges(true);
    setEditingGrade(null);
    showToast(`Updated details for "${editingGrade.gradeName}".`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#021936] text-white px-5 py-4 rounded-2xl shadow-2xl border-2 border-[#904d00] flex items-center gap-3 transition-all animate-fade-in">
          <span className="material-symbols-outlined text-[#FDE68A] text-2xl flex-shrink-0">
            campaign
          </span>
          <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 1. Header Banner & Live Status */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] p-6 sm:p-8 custom-shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#021936] text-[#FDE68A] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#FDE68A]">payments</span>
                Fee Master &amp; Tuition Manager
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Website Sync Active
              </span>
              {dbConnected && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold flex items-center gap-1 border border-blue-200">
                  <span className="material-symbols-outlined text-sm text-blue-600">database</span>
                  Neon DB Table: dwps_fee_structures
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#021936]">
              School Tuition &amp; Grade Fee Administration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Configure official tuition rates, annual charges, admission dues, and smart class fees. 
              Any modifications saved here reflect <strong>in real time</strong> on the public website, parent fee calculator, and comparison matrix.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRevisionToolOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-[#dce3ec] hover:border-[#904d00] hover:bg-amber-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Apply percentage adjustment across all grades"
            >
              <span className="material-symbols-outlined text-base text-[#904d00]">trending_up</span>
              % Annual Revision
            </button>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Reset Defaults
            </button>

            <button
              onClick={() => setIsAddGradeOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Grade Level
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-[#904d00] hover:bg-[#B45309] text-white ring-4 ring-amber-300/40 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Publishing Live...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">
                    {hasUnsavedChanges ? 'cloud_upload' : 'check_circle'}
                  </span>
                  {hasUnsavedChanges ? 'Save Changes Live' : 'All Changes Live'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unsaved indicator banner */}
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs text-amber-900 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-base">warning</span>
              <span className="font-semibold">
                You have unsaved fee changes in your workspace!
              </span>
              <span className="hidden sm:inline text-amber-700">
                Click "Save Changes Live" to immediately update the parent portal.
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              className="px-3 py-1 bg-[#904d00] text-white rounded-lg font-bold hover:bg-[#B45309] cursor-pointer"
            >
              Save Now
            </button>
          </div>
        )}

        {/* Last saved note */}
        {lastSavedTime && (
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>Last published to live website at {lastSavedTime}</span>
          </div>
        )}
      </div>

      {/* 2. Statistical Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#dce3ec] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Grade Slabs
          </div>
          <div className="text-2xl font-bold font-serif text-[#021936] mt-1">
            {localFees.length} Levels
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            Playgroup to Grade 8 (4 Pre-Primary Levels)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dce3ec] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Average Monthly Tuition
          </div>
          <div className="text-2xl font-mono font-bold text-[#904d00] mt-1">
            ₹{stats.avgTuition.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Per student / month
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dce3ec] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tuition Fee Band
          </div>
          <div className="text-2xl font-mono font-bold text-slate-800 mt-1">
            ₹{stats.minTuition} – ₹{stats.maxTuition}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Min to max across tiers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#dce3ec] shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Average Annual Charges
          </div>
          <div className="text-2xl font-mono font-bold text-slate-800 mt-1">
            ₹{stats.avgAnnual.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Apportioned yearly/quarterly
          </div>
        </div>
      </div>

      {/* 3. Toolbar: View Mode, Wing Filter, Search */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#F2F8FD] p-1 rounded-xl border border-[#dce3ec] self-start md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#021936] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">table_chart</span>
            Quick Table Editor
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#021936] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">view_agenda</span>
            Detailed Cards
          </button>
          <button
            onClick={() => setViewMode('livePreview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'livePreview'
                ? 'bg-[#904d00] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">preview</span>
            Live Website Preview
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Wing Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-[#dce3ec] text-xs">
            <span className="text-slate-400 px-2 font-medium">Wing:</span>
            {['all', 'Early Years', 'Primary Wing', 'Middle Wing'].map((wing) => (
              <button
                key={wing}
                onClick={() => setSelectedWing(wing)}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  selectedWing === wing
                    ? 'bg-[#021936] text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {wing === 'all' ? 'All Wings' : wing}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search grade or age..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#dce3ec] focus:outline-none focus:border-[#904d00] w-48"
            />
          </div>
        </div>
      </div>

      {/* 4. Main Content Area */}
      {viewMode === 'livePreview' ? (
        /* Live Parent Preview */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700">visibility</span>
              <span>
                <strong>Live Parent Viewport:</strong> This is the exact interactive fee calculator as parents see it on the website right now.
              </span>
            </div>
            <button
              onClick={() => setViewMode('table')}
              className="font-bold text-[#904d00] hover:underline cursor-pointer"
            >
              ← Back to Editor
            </button>
          </div>
          <FeeCalculator feeStructures={localFees} />
        </div>
      ) : viewMode === 'table' ? (
        /* Quick Inline Editable Table */
        <div className="bg-white rounded-2xl border border-[#dce3ec] overflow-hidden custom-shadow-card">
          <div className="p-4 bg-slate-50 border-b border-[#dce3ec] flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-slate-500 text-sm">edit_note</span>
              <span>Inline Editing Active — modify any number directly below and click "Save Changes Live".</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Showing {filteredFees.length} of {localFees.length} Grade Slabs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              <thead>
                <tr className="bg-[#F2F8FD] border-b border-[#dce3ec] text-[#021936]">
                  <th className="py-3 px-4 font-bold">Grade Level &amp; Category</th>
                  <th className="py-3 px-3 font-bold">Age Bracket</th>
                  <th className="py-3 px-3 font-bold text-[#904d00]">Monthly Tuition (₹)</th>
                  <th className="py-3 px-3 font-bold">Smart Class / Mo. (₹)</th>
                  <th className="py-3 px-3 font-bold">Annual Charges (₹)</th>
                  <th className="py-3 px-3 font-bold">Admission Fee (₹)</th>
                  <th className="py-3 px-3 font-bold">Security (₹)</th>
                  <th className="py-3 px-3 font-bold bg-amber-50/60">Est. Quarter Total</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce3ec]">
                {filteredFees.map((grade) => {
                  // Calculate quarter estimate for instant preview: (tuition + smartClass) * 3 + (annual / 4)
                  const quarterEst =
                    (Number(grade.monthlyTuition) + Number(grade.activitySmartClass)) * 3 +
                    Math.round(Number(grade.annualCharges) / 4);

                  return (
                    <tr key={grade.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Grade Name & Category */}
                      <td className="py-3.5 px-4 text-[#021936]">
                        <div className="font-bold text-sm text-[#021936]">{grade.gradeName}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {grade.category}
                        </span>
                      </td>

                      {/* Age Bracket */}
                      <td className="py-3.5 px-3">
                        <input
                          type="text"
                          value={grade.ageGroup}
                          onChange={(e) => handleFieldChange(grade.id, 'ageGroup', e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-[#dce3ec] focus:outline-none focus:border-[#904d00] text-xs"
                        />
                      </td>

                      {/* Monthly Tuition */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={grade.monthlyTuition}
                            onChange={(e) =>
                              handleFieldChange(grade.id, 'monthlyTuition', Number(e.target.value))
                            }
                            className="w-24 pl-5 pr-2 py-1 rounded border-2 border-amber-200 focus:border-[#904d00] focus:outline-none font-mono font-bold text-[#904d00] text-xs bg-amber-50/30"
                          />
                        </div>
                      </td>

                      {/* Smart Class */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={grade.activitySmartClass}
                            onChange={(e) =>
                              handleFieldChange(grade.id, 'activitySmartClass', Number(e.target.value))
                            }
                            className="w-20 pl-5 pr-2 py-1 rounded border border-[#dce3ec] focus:outline-none focus:border-[#904d00] font-mono text-xs text-slate-700"
                          />
                        </div>
                      </td>

                      {/* Annual Charges */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={grade.annualCharges}
                            onChange={(e) =>
                              handleFieldChange(grade.id, 'annualCharges', Number(e.target.value))
                            }
                            className="w-24 pl-5 pr-2 py-1 rounded border border-[#dce3ec] focus:outline-none focus:border-[#904d00] font-mono text-xs text-slate-700"
                          />
                        </div>
                      </td>

                      {/* Admission Fee */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={grade.admissionFee}
                            onChange={(e) =>
                              handleFieldChange(grade.id, 'admissionFee', Number(e.target.value))
                            }
                            className="w-24 pl-5 pr-2 py-1 rounded border border-[#dce3ec] focus:outline-none focus:border-[#904d00] font-mono text-xs text-slate-700"
                          />
                        </div>
                      </td>

                      {/* Security Deposit */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={grade.securityDeposit}
                            onChange={(e) =>
                              handleFieldChange(grade.id, 'securityDeposit', Number(e.target.value))
                            }
                            className="w-20 pl-5 pr-2 py-1 rounded border border-[#dce3ec] focus:outline-none focus:border-[#904d00] font-mono text-xs text-slate-700"
                          />
                        </div>
                      </td>

                      {/* Est Quarter Total */}
                      <td className="py-3.5 px-3 bg-amber-50/60 font-mono font-bold text-[#021936]">
                        ₹{quarterEst.toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingGrade(grade)}
                          className="p-1.5 text-slate-600 hover:text-[#904d00] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-1"
                          title="Edit Description and Features"
                        >
                          <span className="material-symbols-outlined text-base">tune</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.id, grade.gradeName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Grade Slab"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFees.map((grade) => {
            const quarterEst =
              (Number(grade.monthlyTuition) + Number(grade.activitySmartClass)) * 3 +
              Math.round(Number(grade.annualCharges) / 4);

            return (
              <div
                key={grade.id}
                className="bg-white rounded-2xl border border-[#dce3ec] p-6 custom-shadow-card flex flex-col justify-between hover:border-[#904d00] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {grade.category}
                      </span>
                      <h4 className="text-lg font-bold font-serif text-[#021936] mt-1">
                        {grade.gradeName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Age Group: {grade.ageGroup}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditingGrade(grade)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-[#904d00] transition-colors cursor-pointer"
                      title="Edit Grade Full Details"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Monthly Tuition:</span>
                      <span className="font-mono font-bold text-[#904d00] text-sm">
                        ₹{grade.monthlyTuition.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Smart Class / Activity:</span>
                      <span className="font-mono text-slate-800">
                        ₹{grade.activitySmartClass}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Annual Charges:</span>
                      <span className="font-mono text-slate-800">
                        ₹{grade.annualCharges.toLocaleString('en-IN')}/yr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">One-Time Admission Fee:</span>
                      <span className="font-mono text-slate-800">
                        ₹{grade.admissionFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Refundable Security:</span>
                      <span className="font-mono text-slate-800">
                        ₹{grade.securityDeposit.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#dce3ec] flex justify-between items-center font-bold text-[#021936]">
                      <span>Quarterly Payable (Est):</span>
                      <span className="font-mono text-[#904d00]">
                        ₹{quarterEst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Description & Features */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {grade.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {grade.features.slice(0, 3).map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-200 text-slate-700"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                    {grade.features.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-semibold">
                        +{grade.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#dce3ec] flex items-center justify-between">
                  <button
                    onClick={() => setEditingGrade(grade)}
                    className="text-xs font-bold text-[#904d00] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    Edit Parameters
                  </button>
                  <button
                    onClick={() => handleDeleteGrade(grade.id, grade.gradeName)}
                    className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Annual Percentage Revision Popover Modal */}
      {isRevisionToolOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dce3ec] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#904d00] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">trending_up</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-[#021936]">
                  Annual Fee Revision Multiplier
                </h3>
                <p className="text-xs text-slate-500">
                  Quickly apply an approved CBSE percentage increment across all grades.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[#021936] uppercase tracking-wider block">
                Select Increment Percentage:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 8, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRevisionPercent(pct)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      revisionPercent === pct
                        ? 'border-[#904d00] bg-amber-50 text-[#904d00] ring-2 ring-[#904d00]/30'
                        : 'border-[#dce3ec] hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-slate-600">Custom %:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={revisionPercent}
                  onChange={(e) => setRevisionPercent(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 rounded-lg border border-[#dce3ec] text-xs font-bold text-[#904d00]"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Example Impact (Grade 1 &amp; 2):</p>
                <div className="flex justify-between text-[11px]">
                  <span>Current Tuition: ₹3,300/mo</span>
                  <span className="font-bold text-[#904d00]">
                    → ₹{Math.round((3300 * (1 + revisionPercent / 100)) / 50) * 50}/mo
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={handleApplyRevision}
                className="flex-1 py-2.5 bg-[#904d00] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply +{revisionPercent}% to All Grades
              </button>
              <button
                type="button"
                onClick={() => setIsRevisionToolOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Grade Details Modal */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#dce3ec] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#021936]">
                  Edit Grade: {editingGrade.gradeName}
                </h3>
                <p className="text-xs text-slate-500">
                  Update syllabus features, description, and fee allocations.
                </p>
              </div>
              <button
                onClick={() => setEditingGrade(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Name</label>
                  <input
                    type="text"
                    value={editingGrade.gradeName}
                    onChange={(e) =>
                      setEditingGrade({ ...editingGrade, gradeName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category Wing</label>
                  <select
                    value={editingGrade.category}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        category: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] bg-white"
                  >
                    <option value="Early Years">Early Years</option>
                    <option value="Primary Wing">Primary Wing</option>
                    <option value="Middle Wing">Middle Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Age Group Bracket</label>
                <input
                  type="text"
                  value={editingGrade.ageGroup}
                  onChange={(e) =>
                    setEditingGrade({ ...editingGrade, ageGroup: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Tuition (₹)</label>
                  <input
                    type="number"
                    value={editingGrade.monthlyTuition}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        monthlyTuition: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono font-bold text-[#904d00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Smart Class / Month (₹)</label>
                  <input
                    type="number"
                    value={editingGrade.activitySmartClass}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        activitySmartClass: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Charges (₹)</label>
                  <input
                    type="number"
                    value={editingGrade.annualCharges}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        annualCharges: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    value={editingGrade.admissionFee}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        admissionFee: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={editingGrade.securityDeposit}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        securityDeposit: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingGrade.description}
                  onChange={(e) =>
                    setEditingGrade({ ...editingGrade, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Features &amp; Highlights (Comma separated)
                </label>
                <input
                  type="text"
                  value={editingGrade.features.join(', ')}
                  onChange={(e) =>
                    setEditingGrade({
                      ...editingGrade,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                  placeholder="e.g. Smart Audiovisual, Math Lab, Weekly Sports"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex gap-3">
              <button
                type="button"
                onClick={handleSaveModalEdit}
                className="flex-1 py-2.5 bg-[#021936] hover:bg-[#904d00] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply to Working Slabs
              </button>
              <button
                type="button"
                onClick={() => setEditingGrade(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add New Grade Slab Modal */}
      {isAddGradeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddGradeSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#dce3ec] space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#021936]">
                  Add New Grade Fee Level
                </h3>
                <p className="text-xs text-slate-500">
                  Introduce a new grade or wing slab to the school fee matrix.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGradeOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Level Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 9 (Secondary)"
                    value={newGradeForm.gradeName}
                    onChange={(e) =>
                      setNewGradeForm({ ...newGradeForm, gradeName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wing Category *</label>
                  <select
                    value={newGradeForm.category}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        category: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] bg-white"
                  >
                    <option value="Early Years">Early Years</option>
                    <option value="Primary Wing">Primary Wing</option>
                    <option value="Middle Wing">Middle Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Age Group Bracket</label>
                <input
                  type="text"
                  placeholder="e.g. 14 – 15 Years"
                  value={newGradeForm.ageGroup}
                  onChange={(e) =>
                    setNewGradeForm({ ...newGradeForm, ageGroup: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Tuition (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newGradeForm.monthlyTuition}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        monthlyTuition: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono font-bold text-[#904d00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Smart Class / Mo. (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newGradeForm.activitySmartClass}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        activitySmartClass: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newGradeForm.annualCharges}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        annualCharges: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newGradeForm.admissionFee}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        admissionFee: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newGradeForm.securityDeposit}
                    onChange={(e) =>
                      setNewGradeForm({
                        ...newGradeForm,
                        securityDeposit: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dce3ec] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pedagogy Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline syllabus highlights, lab resources, etc."
                  value={newGradeForm.description}
                  onChange={(e) =>
                    setNewGradeForm({ ...newGradeForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dce3ec]"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#904d00] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Grade Level
              </button>
              <button
                type="button"
                onClick={() => setIsAddGradeOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#dce3ec] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#021936]">
                  Reset All Fee Slabs?
                </h3>
                <p className="text-xs text-slate-500">
                  This will restore all grade tuition and fee rates back to initial CBSE institutional defaults for Session {SCHOOL_INFO.academicYear}.
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, Reset Defaults
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
