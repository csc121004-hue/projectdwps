import React, { useState } from 'react';
import { SCHOOL_INFO, InquiryRecord } from '../data/schoolData';
import { api } from '../services/api';

interface CampusTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourBooked?: (inquiry: InquiryRecord) => void;
}

export const CampusTourModal: React.FC<CampusTourModalProps> = ({ isOpen, onClose, onTourBooked }) => {
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    grade: 'Nursery',
    date: '2026-03-25',
    timeSlot: '10:00 AM – 11:30 AM (Morning Batch)',
    interests: 'Classroom & Sports ground walkthrough'
  });

  const [confirmedPass, setConfirmedPass] = useState<{
    passId: string;
    parentName: string;
    date: string;
    timeSlot: string;
    grade: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const passId = `DWPS-TOUR-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedPass({
      passId,
      parentName: formData.parentName,
      date: formData.date,
      timeSlot: formData.timeSlot,
      grade: formData.grade,
    });

    const newInquiry: InquiryRecord = {
      id: passId,
      studentName: formData.parentName,
      phone: formData.phone,
      email: '',
      grade: formData.grade,
      message: `🏫 School Campus Tour Appointment for ${formData.date} (${formData.timeSlot}). Focus areas: ${formData.interests}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Tour Scheduled',
      priority: 'High',
      notes: `Tour Pass ID: ${passId} | Slot: ${formData.timeSlot} | Date: ${formData.date} | Interests: ${formData.interests}`,
      followUpDate: formData.date
    };

    if (onTourBooked) {
      onTourBooked(newInquiry);
    }

    // Save to Neon database tour bookings
    api.saveTourBooking({
      id: passId,
      parentName: formData.parentName,
      phone: formData.phone,
      preferredDate: formData.date,
      preferredSlot: formData.timeSlot,
      gradeInterested: formData.grade,
      notes: formData.interests
    }).catch(console.warn);

    // Also persist as an inquiry so it syncs immediately with all lead endpoints
    api.saveInquiry(newInquiry).catch(console.warn);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#dce3ec] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {confirmedPass ? (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider block">
                Confirmed Appointment
              </span>
              <h3 className="text-2xl font-bold font-serif text-[#021936] mt-1">
                Campus Tour Pass Generated
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Please show this digital pass at the security reception in Subhash Colony.
              </p>
            </div>

            {/* Digital Pass Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#021936] to-[#1a2e4c] text-white text-left space-y-4 shadow-lg border border-[#8396b9]/30">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div>
                  <p className="text-[10px] text-[#FDE68A] uppercase font-bold tracking-wider">
                    {SCHOOL_INFO.name}
                  </p>
                  <p className="text-xs text-slate-300">Visitor Pass ID: <span className="font-mono text-white font-bold">{confirmedPass.passId}</span></p>
                </div>
                <span className="material-symbols-outlined text-2xl text-[#FDE68A]">badge</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Visitor / Guardian</span>
                  <span className="font-semibold text-white">{confirmedPass.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Prospective Grade</span>
                  <span className="font-semibold text-white">{confirmedPass.grade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Tour Date</span>
                  <span className="font-semibold text-[#FDE68A]">{confirmedPass.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Allocated Slot</span>
                  <span className="font-semibold text-white">{confirmedPass.timeSlot.split(' ')[0]} {confirmedPass.timeSlot.split(' ')[1]}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Location: Subhash Colony, Ballabgarh</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Confirmed
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/${SCHOOL_INFO.whatsappNumber}?text=Hello%20DWPS%20Ballabgarh,%20I%20have%20booked%20tour%20pass%20${confirmedPass.passId}%20for%20${confirmedPass.date}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                Share on WhatsApp
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <span className="text-xs font-bold text-[#904d00] uppercase tracking-wider block">
                Schedule a Visit
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#021936] mt-1">
                Book an In-Person Campus Tour
              </h3>
              <p className="text-xs text-[#44474e] mt-1">
                Experience our joyful classrooms, meet the faculty, and review admission procedures.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#021936] uppercase mb-1">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smt. Neha Gupta"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-sm focus:border-[#904d00] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#021936] uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98996 38676"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-sm focus:border-[#904d00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#021936] uppercase mb-1">
                    Child's Class
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-sm focus:border-[#904d00] outline-none"
                  >
                    <option value="Playgroup">Playgroup (Age 2.5–3)</option>
                    <option value="Nursery">Nursery (Age 3–4)</option>
                    <option value="L.KG">L.KG (Lower KG, Age 4–5)</option>
                    <option value="U.KG">U.KG (Upper KG, Age 5–6)</option>
                    <option value="Grade 1">Grade 1 (Age 6+)</option>
                    <option value="Grade 2 to 5">Grade 2 to 5 (Primary Wing)</option>
                    <option value="Class 6">Class 6 (Middle Wing, Age 11–12)</option>
                    <option value="Class 7">Class 7 (Middle Wing, Age 12–13)</option>
                    <option value="Class 8">Class 8 (Middle Wing, Age 13–14)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#021936] uppercase mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-sm focus:border-[#904d00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#021936] uppercase mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-sm focus:border-[#904d00] outline-none"
                  >
                    <option value="9:00 AM – 10:30 AM (Early Morning)">9:00 AM – 10:30 AM</option>
                    <option value="10:30 AM – 12:00 PM (Mid Morning)">10:30 AM – 12:00 PM</option>
                    <option value="12:00 PM – 1:30 PM (Afternoon)">12:00 PM – 1:30 PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full h-12 bg-[#904d00] hover:bg-[#B45309] text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">confirmation_number</span>
                Confirm &amp; Generate Visitor Pass
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Campus visiting hours: Monday to Saturday (8:00 AM to 2:00 PM).
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
