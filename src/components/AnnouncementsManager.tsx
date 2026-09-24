import React, { useState } from 'react';
import { SchoolAnnouncement } from '../data/schoolData';

interface AnnouncementsManagerProps {
  announcements: SchoolAnnouncement[];
  onUpdateAnnouncements: (updated: SchoolAnnouncement[]) => void;
  onBackToWebsite: () => void;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  announcements,
  onUpdateAnnouncements,
  onBackToWebsite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<Omit<SchoolAnnouncement, 'id'>>({
    title: '',
    category: 'Events',
    date: '',
    badge: 'Upcoming',
    summary: '',
    linkText: 'View Details',
    isUrgent: false,
  });

  // Category badges color map
  const getCategoryBadgeClass = (category: SchoolAnnouncement['category']) => {
    switch (category) {
      case 'Admissions':
        return 'bg-[#904d00] text-white';
      case 'Events':
        return 'bg-[#021936] text-[#FDE68A]';
      case 'Academic':
        return 'bg-blue-700 text-white';
      case 'Sports':
        return 'bg-emerald-700 text-white';
      case 'Achievement':
        return 'bg-amber-600 text-white';
      case 'Notice':
        return 'bg-purple-700 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  // Quick Preset Templates for Easy Creation
  const handleApplyTemplate = (type: 'ptm' | 'sports' | 'admissions' | 'exam' | 'holiday') => {
    if (type === 'ptm') {
      setFormData({
        title: 'Interactive Parent-Teacher Meeting (PTM)',
        category: 'Events',
        date: 'First Saturday of Next Month',
        badge: 'Important PTM',
        summary: 'Discussion regarding student academic progress, extracurricular development, and upcoming term evaluations.',
        linkText: 'Schedule Slot',
        isUrgent: true,
      });
    } else if (type === 'sports') {
      setFormData({
        title: 'Inter-House Annual Sports & Athletics Meet 2026',
        category: 'Sports',
        date: 'April 2026',
        badge: 'Upcoming',
        summary: 'Sprint races, martial arts displays, relay challenges, and award ceremonies on the school sports arena.',
        linkText: 'Event Details',
        isUrgent: false,
      });
    } else if (type === 'admissions') {
      setFormData({
        title: 'Admissions Open 2026-27: Nursery to Grade 8',
        category: 'Admissions',
        date: 'Active Session',
        badge: 'Open Now',
        summary: 'Registration open for new academic session with modern STEM labs, smart classes, and qualified faculty.',
        linkText: 'Apply Online',
        isUrgent: true,
      });
    } else if (type === 'exam') {
      setFormData({
        title: 'Term Assessment & Unit Test Schedule Released',
        category: 'Academic',
        date: 'Next Week',
        badge: 'Exam Notice',
        summary: 'Detailed timetable and syllabus guidelines for upcoming evaluations are available on the school desk.',
        linkText: 'Check Syllabus',
        isUrgent: true,
      });
    } else if (type === 'holiday') {
      setFormData({
        title: 'School Closed on Gazetted Public Holiday',
        category: 'Notice',
        date: 'Upcoming Holiday',
        badge: 'Circular',
        summary: 'The school campus will remain closed on account of public holiday. Regular classes will resume next working day.',
        linkText: 'View Circular',
        isUrgent: false,
      });
    }
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Events',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: 'Upcoming',
      summary: '',
      linkText: 'View Details',
      isUrgent: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SchoolAnnouncement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      date: item.date,
      badge: item.badge,
      summary: item.summary,
      linkText: item.linkText || 'View Details',
      isUrgent: !!item.isUrgent,
    });
    setIsModalOpen(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('Please fill out the announcement title and summary description.');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = announcements.map((item) =>
        item.id === editingId ? { ...item, ...formData } : item
      );
      onUpdateAnnouncements(updated);
      setSaveSuccessMsg('Update saved and published live to website! (अपडेट सफलतापूर्वक लाइव हो गया)');
    } else {
      // Create new
      const newItem: SchoolAnnouncement = {
        id: `ann-${Date.now()}`,
        ...formData,
      };
      onUpdateAnnouncements([newItem, ...announcements]);
      setSaveSuccessMsg('New upcoming update added and live on website! (नया अपडेट वेबसाइट पर लाइव हो गया)');
    }

    setIsModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Are you sure you want to remove this update from the website? (क्या आप वाकई इसे हटाना चाहते हैं?)')) {
      const updated = announcements.filter((item) => item.id !== id);
      onUpdateAnnouncements(updated);
      setSaveSuccessMsg('Update removed from website ticker.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  const handleToggleUrgent = (id: string) => {
    const updated = announcements.map((item) =>
      item.id === id ? { ...item, isUrgent: !item.isUrgent } : item
    );
    onUpdateAnnouncements(updated);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;
    const newItems = [...announcements];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    onUpdateAnnouncements(newItems);
  };

  // Filtered List
  const filteredList = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalCount = announcements.length;
  const urgentCount = announcements.filter((a) => a.isUrgent).length;
  const eventsCount = announcements.filter((a) => a.category === 'Events').length;
  const admissionsCount = announcements.filter((a) => a.category === 'Admissions').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Notice */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={onBackToWebsite}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View on Live Homepage</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Active Live Updates
          </span>
          <div className="text-3xl font-extrabold font-serif text-[#021936] mt-1">
            {totalCount}
          </div>
          <span className="text-[11px] text-[#904d00] font-semibold mt-1 block">
            Rotating on Live Ticker
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
          <span className="text-xs text-red-600 font-bold uppercase tracking-wider block">
            Urgent / High Priority
          </span>
          <div className="text-3xl font-extrabold font-serif text-red-600 mt-1">
            {urgentCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Blinking ticker pulse active
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
          <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">
            Upcoming Events
          </span>
          <div className="text-3xl font-extrabold font-serif text-blue-900 mt-1">
            {eventsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Campus schedules &amp; meets
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
          <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block">
            Admissions Circulars
          </span>
          <div className="text-3xl font-extrabold font-serif text-amber-700 mt-1">
            {admissionsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Session 2026-27 alerts
          </span>
        </div>
      </div>

      {/* Real-Time Live Ticker Simulation Preview */}
      <div className="bg-white rounded-2xl border border-[#dce3ec] overflow-hidden custom-shadow-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-[#021936] uppercase tracking-wider">
              Website Live Ticker Preview (वेबसाइट पर लाइव प्रदर्शन)
            </span>
          </div>
          <button
            onClick={onBackToWebsite}
            className="text-[11px] font-bold text-[#904d00] hover:text-[#021936] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Website Homepage</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </button>
        </div>

        <div className="p-3 bg-[#F2F8FD] rounded-xl border border-[#dce3ec] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="px-2 py-0.5 rounded bg-[#021936] text-[#FDE68A] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">campaign</span>
              <span>Ticker Notice</span>
            </span>

            {announcements[0] && (
              <>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(announcements[0].category)}`}>
                  {announcements[0].badge}
                </span>

                {announcements[0].isUrgent && (
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                    Urgent
                  </span>
                )}

                <span className="font-bold text-[#021936] truncate">
                  {announcements[0].title}
                </span>

                <span className="text-slate-500 hidden md:inline truncate max-w-xs">
                  — {announcements[0].summary}
                </span>

                <span className="text-[11px] font-bold text-[#904d00]">
                  • {announcements[0].date}
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            1 of {announcements.length}
          </span>
        </div>
      </div>

      {/* Action Toolbar & Preset Templates */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search updates, circulars, or dates..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-medium text-[#021936] focus:border-[#904d00] focus:bg-white outline-none transition-all"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] focus:border-[#904d00] outline-none cursor-pointer"
            >
              <option value="all">All Categories ({announcements.length})</option>
              <option value="Events">Events</option>
              <option value="Admissions">Admissions</option>
              <option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Achievement">Achievement</option>
              <option value="Notice">School Notices</option>
            </select>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Add Upcoming Update (नया अपडेट जोड़ें)</span>
          </button>
        </div>

        {/* Quick One-Click Template Shortcuts */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            ⚡ Quick Templates:
          </span>
          <button
            type="button"
            onClick={() => handleApplyTemplate('ptm')}
            className="px-2.5 py-1 rounded-md bg-[#F2F8FD] hover:bg-[#e2eaf4] border border-[#dce3ec] text-[11px] font-semibold text-[#021936] cursor-pointer transition-colors"
          >
            + PTM Notice (बैठक)
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('sports')}
            className="px-2.5 py-1 rounded-md bg-[#F2F8FD] hover:bg-[#e2eaf4] border border-[#dce3ec] text-[11px] font-semibold text-[#021936] cursor-pointer transition-colors"
          >
            + Sports Meet (खेल दिवस)
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('admissions')}
            className="px-2.5 py-1 rounded-md bg-[#F2F8FD] hover:bg-[#e2eaf4] border border-[#dce3ec] text-[11px] font-semibold text-[#021936] cursor-pointer transition-colors"
          >
            + Admissions 2026-27
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('exam')}
            className="px-2.5 py-1 rounded-md bg-[#F2F8FD] hover:bg-[#e2eaf4] border border-[#dce3ec] text-[11px] font-semibold text-[#021936] cursor-pointer transition-colors"
          >
            + Exam Date-Sheet (परीक्षा)
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('holiday')}
            className="px-2.5 py-1 rounded-md bg-[#F2F8FD] hover:bg-[#e2eaf4] border border-[#dce3ec] text-[11px] font-semibold text-[#021936] cursor-pointer transition-colors"
          >
            + School Holiday (अवकाश)
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#dce3ec] text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-300">campaign</span>
            <h4 className="text-base font-bold text-[#021936]">No updates found matching your filter</h4>
            <p className="text-xs text-slate-500">
              Clear your search or click "+ Add Upcoming Update" to create a new circular.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="px-4 py-2 bg-[#F2F8FD] hover:bg-slate-200 text-xs font-bold text-[#021936] rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredList.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white p-5 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.isUrgent
                  ? 'border-red-300 shadow-xs bg-gradient-to-r from-red-50/20 via-white to-white'
                  : 'border-[#dce3ec] hover:border-[#904d00]/40'
              }`}
            >
              {/* Left Content Column */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(item.category)}`}>
                    {item.badge}
                  </span>

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>

                  {item.isUrgent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                      <span className="material-symbols-outlined text-xs">error</span>
                      Urgent Alert
                    </span>
                  )}

                  <span className="text-xs font-bold text-[#904d00] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event</span>
                    {item.date}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#021936] leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>

                {item.linkText && (
                  <div className="text-[11px] font-bold text-[#904d00] flex items-center gap-1 pt-1">
                    <span>Action Button: "{item.linkText}"</span>
                  </div>
                )}
              </div>

              {/* Right Action Column */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                {/* Move Up/Down Order */}
                <div className="flex items-center bg-[#F2F8FD] rounded-lg border border-[#dce3ec] p-0.5">
                  <button
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    title="Move up in ticker rotation"
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-[#021936] hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === announcements.length - 1}
                    title="Move down in ticker rotation"
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-[#021936] hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                  </button>
                </div>

                {/* Quick Toggle Urgent */}
                <button
                  type="button"
                  onClick={() => handleToggleUrgent(item.id)}
                  title={item.isUrgent ? 'Remove urgent flag' : 'Mark as urgent alert'}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                    item.isUrgent
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {item.isUrgent ? 'notifications_active' : 'notifications'}
                  </span>
                  <span className="hidden sm:inline">{item.isUrgent ? 'Urgent' : 'Normal'}</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="py-2 px-3 rounded-lg bg-[#021936] hover:bg-[#1a2e4c] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit (संशोधित करें)</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(item.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                  title="Delete Update"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#021936] text-white p-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#904d00] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">campaign</span>
                </span>
                <div>
                  <h3 className="text-base font-bold font-serif">
                    {editingId ? 'Edit Upcoming Update (अपडेट संशोधित करें)' : 'Add New Upcoming Update (नया अपडेट जोड़ें)'}
                  </h3>
                  <p className="text-[11px] text-[#8396b9]">
                    Updates display live in the website header ticker &amp; upcoming dates marquee.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4 text-xs text-[#021936]">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Update / Event Title (शीर्षक) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Annual Sports Meet 2026 / Parent Teacher Meeting"
                  className="w-full h-11 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold focus:border-[#904d00] focus:bg-white outline-none transition-all"
                />
              </div>

              {/* Date & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Event Date / Timeline (तारीख) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. April 18, 2026 or Coming Monday"
                    className="w-full h-11 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold focus:border-[#904d00] focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Category (श्रेणी) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SchoolAnnouncement['category'] })}
                    className="w-full h-11 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold focus:border-[#904d00] focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="Events">Events (कार्यक्रम)</option>
                    <option value="Admissions">Admissions (दाखिला)</option>
                    <option value="Academic">Academic (शैक्षणिक)</option>
                    <option value="Sports">Sports (खेल-कूद)</option>
                    <option value="Achievement">Achievement (उपलब्धि)</option>
                    <option value="Notice">School Notice (सूचना)</option>
                  </select>
                </div>
              </div>

              {/* Badge & Action Button Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Status Badge Tag (बैज)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Upcoming, Important, Open Now, Notice"
                    className="w-full h-11 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold focus:border-[#904d00] focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Button Action Text (वैकल्पिक बटन)
                  </label>
                  <input
                    type="text"
                    value={formData.linkText || ''}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    placeholder="e.g. View Schedule, Apply Now, Read More"
                    className="w-full h-11 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold focus:border-[#904d00] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Summary Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Full Notice / Summary Details (पूर्ण विवरण) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Provide comprehensive details about the upcoming event, timing, venue, dress code, instructions for parents/students..."
                  className="w-full p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-medium focus:border-[#904d00] focus:bg-white outline-none transition-all"
                />
              </div>

              {/* Urgent Priority Checkbox */}
              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                    className="accent-red-600 w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-red-900 block text-xs">
                      Mark as High Priority / Urgent Alert (ब्लिंक अलर्ट टैग)
                    </span>
                    <span className="text-[11px] text-red-700 block">
                      Displays a pulsing red alert tag on the live website header ticker.
                    </span>
                  </div>
                </label>
              </div>

              {/* Live Card Preview Inside Modal */}
              <div className="p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Preview in Ticker:
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(formData.category)}`}>
                    {formData.badge || 'Upcoming'}
                  </span>
                  {formData.isUrgent && (
                    <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                      Urgent
                    </span>
                  )}
                  <span className="font-bold text-[#021936]">
                    {formData.title || 'Your Announcement Title'}
                  </span>
                  <span className="text-[#904d00] font-semibold text-[11px]">
                    • {formData.date || 'Event Date'}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#904d00] hover:bg-[#B45309] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-1.5 text-xs"
                >
                  <span className="material-symbols-outlined text-base">cloud_done</span>
                  <span>{editingId ? 'Save & Update on Website' : 'Publish Live to Website (लाइव करें)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
