import React, { useState } from 'react';
import { InquiryRecord } from '../data/schoolData';

interface InquiriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inquiries: InquiryRecord[];
  onUpdateStatus?: (id: string, newStatus: InquiryRecord['status']) => void;
}

export const InquiriesDrawer: React.FC<InquiriesDrawerProps> = ({
  isOpen,
  onClose,
  inquiries,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');

  if (!isOpen) return null;

  const filtered = inquiries.filter((inq) => {
    const matchesSearch =
      inq.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.phone.includes(searchQuery) ||
      inq.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || inq.grade.includes(selectedGrade);
    return matchesSearch && matchesGrade;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 bg-[#021936] text-white flex items-center justify-between border-b border-[#1a2e4c]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#1a2e4c] text-[#FDE68A]">
              <span className="material-symbols-outlined text-xl">folder_shared</span>
            </span>
            <div>
              <h3 className="text-lg font-bold font-serif">Admissions Desk Log</h3>
              <p className="text-xs text-[#8396b9]">
                Session 2026-27 Applications ({inquiries.length} recorded)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1a2e4c] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#F2F8FD] border-b border-[#dce3ec] space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by student, phone, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-white border border-[#dce3ec] text-xs text-[#151c23] outline-none focus:border-[#904d00]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#021936] font-semibold text-[11px] whitespace-nowrap">Filter Grade:</span>
            {['All', 'Playgroup', 'Nursery', 'KG', 'Grade 1', 'Grade'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-[#021936] text-white'
                    : 'bg-white text-slate-600 border border-[#dce3ec] hover:bg-slate-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
              <p className="text-sm">No applications found matching your criteria.</p>
            </div>
          ) : (
            filtered.map((inq) => (
              <div
                key={inq.id}
                className="p-4 rounded-xl bg-white border border-[#dce3ec] hover:border-[#904d00]/40 transition-colors shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#904d00] uppercase">
                      {inq.id}
                    </span>
                    <h4 className="text-sm font-bold text-[#021936]">{inq.studentName}</h4>
                    <p className="text-xs text-slate-500 font-medium">Applied for: <span className="text-[#021936] font-semibold">{inq.grade}</span></p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inq.status === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : inq.status === 'Tour Scheduled'
                        ? 'bg-amber-100 text-amber-900'
                        : inq.status === 'Admission Offered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>

                {inq.message && (
                  <p className="text-xs text-slate-600 bg-[#F2F8FD] p-2.5 rounded-lg border border-[#dce3ec]/50 italic">
                    "{inq.message}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${inq.phone.replace(/[^0-9+]/g, '')}`}
                      className="hover:text-[#904d00] font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">call</span>
                      {inq.phone}
                    </a>
                  </div>
                  <span className="text-[11px] text-slate-400">Received {inq.date}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#dce3ec] flex items-center justify-between text-xs text-slate-500">
          <span>Campus Office: Subhash Colony</span>
          <a
            href="tel:+919899638676"
            className="text-[#904d00] font-bold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">phone</span>
            Call Office (+91-9899638676)
          </a>
        </div>
      </div>
    </div>
  );
};
