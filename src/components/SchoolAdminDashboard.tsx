import React, { useState, useEffect, useRef } from 'react';
import {
  SCHOOL_INFO,
  InquiryRecord,
  NewsletterItem,
  SchoolAnnouncement,
  HOTLINK_IMAGES
} from '../data/schoolData';
import { SchoolLogo } from './SchoolLogo';
import { AnnouncementsManager } from './AnnouncementsManager';
import { NeonDbStatusModal } from './NeonDbStatusModal';
import { api } from '../services/api';
import {
  PeriodicBackupModal,
  BackupSettings,
  SchoolBackupPayload,
  BackupHistoryRecord
} from './PeriodicBackupModal';

interface SchoolAdminDashboardProps {
  currentUser: { name: string; role: string; email: string };
  inquiries: InquiryRecord[];
  newsletters: NewsletterItem[];
  announcements: SchoolAnnouncement[];
  onUpdateInquiries: (inquiries: InquiryRecord[]) => void;
  onUpdateNewsletters: (newsletters: NewsletterItem[]) => void;
  onUpdateAnnouncements: (announcements: SchoolAnnouncement[]) => void;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({
  currentUser,
  inquiries,
  newsletters,
  announcements,
  onUpdateInquiries,
  onUpdateNewsletters,
  onUpdateAnnouncements,
  onLogout,
  onBackToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'announcements' | 'newsletters'>('inquiries');

  // Inquiries Filters
  const [inquirySearch, setInquirySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [csvExportToast, setCsvExportToast] = useState<string>('');

  // Periodic Backup States
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupToast, setBackupToast] = useState<string>('');

  // Neon DB Connection State
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbHealth, setDbHealth] = useState<{ ok: boolean; configured: boolean; message: string; database?: string } | null>(null);

  useEffect(() => {
    api.getHealth().then((res) => {
      if (res?.database) {
        setDbHealth(res.database);
      }
    }).catch(console.warn);
  }, []);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(() => {
    try {
      const saved = localStorage.getItem('dwps_backup_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load backup settings', e);
    }
    return {
      enabled: true,
      intervalMinutes: 15,
      autoDownload: true,
      notifyOnAutoBackup: true,
    };
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('dwps_last_backup_time') || null;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return (backupSettings?.intervalMinutes || 15) * 60;
  });

  // Modal States
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [isAddInquiryOpen, setIsAddInquiryOpen] = useState(false);
  const [newInquiryData, setNewInquiryData] = useState({
    studentName: '',
    phone: '',
    email: '',
    grade: 'Grade 1',
    message: '',
    notes: 'Walk-in / Phone inquiry received at Subhash Colony office.',
    priority: 'Normal' as 'Normal' | 'High',
  });

  // Newsletter Management States
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterItem | null>(null);
  const [previewNewsletter, setPreviewNewsletter] = useState<NewsletterItem | null>(null);
  const [newsletterForm, setNewsletterForm] = useState<Omit<NewsletterItem, 'id'>>({
    title: '',
    edition: `Vol. ${newsletters.length + 1} • Session 2026-27`,
    publishDate: new Date().toISOString().split('T')[0],
    category: 'Academics & STEM',
    coverImageUrl: HOTLINK_IMAGES.smartClassroom,
    summary: '',
    content: '',
    author: 'Principal Desk & Editorial Team',
    isLive: true,
    highlights: ['Interactive smart classroom milestone', 'Admissions Session 2026-27 updates'],
    pdfDownloadUrl: '#',
    tags: ['Academic News', 'DWPS Ballabgarh']
  });

  // --- Inquiries Handlers ---
  const handleStatusChange = (id: string, newStatus: InquiryRecord['status']) => {
    const updated = inquiries.map((inq) =>
      inq.id === id ? { ...inq, status: newStatus } : inq
    );
    onUpdateInquiries(updated);
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({ ...selectedInquiry, status: newStatus });
    }
  };

  const handleSaveInquiryNotes = (id: string, notes: string) => {
    const updated = inquiries.map((inq) =>
      inq.id === id ? { ...inq, notes } : inq
    );
    onUpdateInquiries(updated);
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({ ...selectedInquiry, notes });
    }
  };

  const handleDeleteInquiry = (id: string) => {
    if (window.confirm('Are you sure you want to remove this inquiry record?')) {
      const updated = inquiries.filter((inq) => inq.id !== id);
      onUpdateInquiries(updated);
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    }
  };

  const handleAddWalkInInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryData.studentName || !newInquiryData.phone) return;

    const newRecord: InquiryRecord = {
      id: `INQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      studentName: newInquiryData.studentName,
      phone: newInquiryData.phone.startsWith('+91') ? newInquiryData.phone : `+91 ${newInquiryData.phone}`,
      email: newInquiryData.email || 'walkin.parent@dwps.local',
      grade: newInquiryData.grade,
      message: newInquiryData.message || 'Direct walk-in visit at Subhash Colony reception.',
      date: new Date().toISOString().split('T')[0],
      status: 'Tour Scheduled',
      notes: newInquiryData.notes,
      priority: newInquiryData.priority,
    };

    onUpdateInquiries([newRecord, ...inquiries]);
    setIsAddInquiryOpen(false);
    setNewInquiryData({
      studentName: '',
      phone: '',
      email: '',
      grade: 'Grade 1',
      message: '',
      notes: 'Walk-in / Phone inquiry received at Subhash Colony office.',
      priority: 'Normal',
    });
  };

  // --- Filtered Inquiries ---
  const filteredInquiries = inquiries.filter((inq) => {
    const q = inquirySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inq.studentName.toLowerCase().includes(q) ||
      inq.id.toLowerCase().includes(q) ||
      inq.phone.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.message && inq.message.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || inq.grade.toLowerCase().includes(gradeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesGrade;
  });

  // --- CSV Export Handler for Student Inquiries ---
  const exportInquiriesCSV = (scope: 'all' | 'filtered' | InquiryRecord[] = 'all', customLabel?: string) => {
    let listToExport: InquiryRecord[];
    let filePrefix = 'All';

    if (Array.isArray(scope)) {
      listToExport = scope;
      filePrefix = customLabel || 'Selected';
    } else if (scope === 'filtered') {
      listToExport = filteredInquiries;
      filePrefix = 'Filtered';
    } else {
      listToExport = inquiries;
      filePrefix = 'All';
    }

    if (listToExport.length === 0) {
      alert('No student inquiry records found to export for this selection.');
      return;
    }

    const headers = [
      'Application ID',
      'Student Name',
      'Grade Seeking',
      'Primary Contact Phone',
      'Email Address',
      'Inquiry Date',
      'Current Status',
      'Priority',
      'Parent Inquiry Message',
      'Staff Counselor Notes'
    ];

    const escapeCell = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const clean = String(val).replace(/"/g, '""').replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
      return `"${clean}"`;
    };

    const rows = listToExport.map((i) => [
      escapeCell(i.id),
      escapeCell(i.studentName),
      escapeCell(i.grade),
      escapeCell(i.phone),
      escapeCell(i.email),
      escapeCell(i.date),
      escapeCell(i.status),
      escapeCell(i.priority || 'Normal'),
      escapeCell(i.message || ''),
      escapeCell(i.notes || ''),
    ]);

    // Prepend UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `DWPS_Admissions_Inquiries_${filePrefix}_${dateStr}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportMenuOpen(false);
    setCsvExportToast(`Export Successful: Downloaded ${listToExport.length} student inquiry records as "${filename}".`);
    setTimeout(() => setCsvExportToast(''), 5000);
  };

  // --- Periodic Data Backup & Serialization Handler ---
  const executeBackup = (trigger: 'automatic_periodic' | 'manual_export' = 'manual_export') => {
    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.replace(/[:.]/g, '-').slice(0, 19);
    const prefix = trigger === 'automatic_periodic' ? 'Auto' : 'Manual';
    const filename = `DWPS_School_Backup_${prefix}_${dateFormatted}.json`;

    const payload: SchoolBackupPayload = {
      schema: 'DWPS_SCHOOL_SYSTEM_BACKUP',
      version: '1.0.0',
      timestamp,
      exportedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      institution: {
        name: SCHOOL_INFO.name,
        shortName: SCHOOL_INFO.shortName,
        address: SCHOOL_INFO.address,
        phone: SCHOOL_INFO.phone,
        email: SCHOOL_INFO.email,
        academicYear: SCHOOL_INFO.academicYear,
      },
      exportedBy: currentUser,
      summary: {
        totalInquiries: inquiries.length,
        totalAnnouncements: announcements.length,
        totalNewsletters: newsletters.length,
        backupTrigger: trigger,
      },
      data: {
        inquiries,
        announcements,
        newsletters,
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record last backup timestamp
    const nowIso = new Date().toISOString();
    setLastBackupTime(nowIso);
    try {
      localStorage.setItem('dwps_last_backup_time', nowIso);
    } catch (e) {
      console.warn('Failed to save last backup time', e);
    }

    // Save history entry
    try {
      const existingHistory: BackupHistoryRecord[] = JSON.parse(
        localStorage.getItem('dwps_backup_history') || '[]'
      );
      const newRecord: BackupHistoryRecord = {
        id: `BCK-${Date.now()}`,
        timestamp: nowIso,
        filename,
        trigger,
        inquiriesCount: inquiries.length,
        announcementsCount: announcements.length,
        newslettersCount: newsletters.length,
        fileSizeBytes: blob.size,
      };
      localStorage.setItem('dwps_backup_history', JSON.stringify([newRecord, ...existingHistory].slice(0, 30)));
    } catch (e) {
      console.warn('Failed to write backup history', e);
    }

    // Reset countdown
    setSecondsRemaining(backupSettings.intervalMinutes * 60);

    // Toast notification
    if (trigger === 'manual_export' || backupSettings.notifyOnAutoBackup) {
      setBackupToast(
        `${trigger === 'automatic_periodic' ? '⚡ Periodic Auto-Backup Completed' : '📥 School Backup Downloaded'}: Serialized ${inquiries.length} inquiries, ${announcements.length} updates & ${newsletters.length} newsletters to "${filename}".`
      );
      setTimeout(() => setBackupToast(''), 6000);
    }
  };

  const executeBackupRef = useRef(executeBackup);
  useEffect(() => {
    executeBackupRef.current = executeBackup;
  });

  // Periodic Timer Effect
  useEffect(() => {
    if (!backupSettings.enabled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (backupSettings.autoDownload) {
            executeBackupRef.current('automatic_periodic');
          } else {
            const nowIso = new Date().toISOString();
            setLastBackupTime(nowIso);
            try {
              localStorage.setItem('dwps_last_backup_time', nowIso);
            } catch (e) {}
          }
          return backupSettings.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [backupSettings.enabled, backupSettings.intervalMinutes, backupSettings.autoDownload]);

  const handleUpdateBackupSettings = (newSettings: BackupSettings) => {
    setBackupSettings(newSettings);
    setSecondsRemaining(newSettings.intervalMinutes * 60);
    try {
      localStorage.setItem('dwps_backup_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save backup settings', e);
    }
  };

  const handleRestoreBackupData = (
    restoredInquiries?: InquiryRecord[],
    restoredAnnouncements?: SchoolAnnouncement[],
    restoredNewsletters?: NewsletterItem[]
  ) => {
    if (restoredInquiries) onUpdateInquiries(restoredInquiries);
    if (restoredAnnouncements) onUpdateAnnouncements(restoredAnnouncements);
    if (restoredNewsletters) onUpdateNewsletters(restoredNewsletters);
    setBackupToast('Data Restore Complete: Database synchronized with uploaded backup JSON.');
    setTimeout(() => setBackupToast(''), 6000);
  };

  // --- Newsletter Handlers ---
  const handleOpenCreateNewsletter = () => {
    setEditingNewsletter(null);
    setNewsletterForm({
      title: '',
      edition: `Vol. ${newsletters.length + 1} • Session 2026-27`,
      publishDate: new Date().toISOString().split('T')[0],
      category: 'Academics & STEM',
      coverImageUrl: HOTLINK_IMAGES.smartClassroom,
      summary: '',
      content: '',
      author: `${currentUser.name} & Editorial Board`,
      isLive: true,
      highlights: ['Session 2026-27 updates', 'Student achievements highlight'],
      pdfDownloadUrl: '#',
      tags: ['DWPS Newsletter', 'Ballabgarh Campus']
    });
    setIsNewsletterModalOpen(true);
  };

  const handleOpenEditNewsletter = (nl: NewsletterItem) => {
    setEditingNewsletter(nl);
    setNewsletterForm({
      title: nl.title,
      edition: nl.edition,
      publishDate: nl.publishDate,
      category: nl.category,
      coverImageUrl: nl.coverImageUrl,
      summary: nl.summary,
      content: nl.content,
      author: nl.author,
      isLive: nl.isLive,
      highlights: nl.highlights || [],
      pdfDownloadUrl: nl.pdfDownloadUrl || '#',
      tags: nl.tags || []
    });
    setIsNewsletterModalOpen(true);
  };

  const handleToggleNewsletterLive = (id: string) => {
    const updated = newsletters.map((n) =>
      n.id === id ? { ...n, isLive: !n.isLive } : n
    );
    onUpdateNewsletters(updated);
  };

  const handleDeleteNewsletter = (id: string) => {
    if (window.confirm('Are you sure you want to delete this newsletter? It will immediately be removed from the live website.')) {
      const updated = newsletters.filter((n) => n.id !== id);
      onUpdateNewsletters(updated);
    }
  };

  const handleSaveNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterForm.title || !newsletterForm.summary) return;

    if (editingNewsletter) {
      const updated = newsletters.map((n) =>
        n.id === editingNewsletter.id
          ? { ...editingNewsletter, ...newsletterForm }
          : n
      );
      onUpdateNewsletters(updated);
    } else {
      const newNl: NewsletterItem = {
        id: `nl-${Date.now()}`,
        ...newsletterForm,
      };
      onUpdateNewsletters([newNl, ...newsletters]);
    }
    setIsNewsletterModalOpen(false);
    setEditingNewsletter(null);
  };

  // Inquiry Statistics
  const totalInquiries = inquiries.length;
  const newInquiries = inquiries.filter((i) => i.status === 'New').length;
  const toursScheduled = inquiries.filter((i) => i.status === 'Tour Scheduled').length;
  const enrolledStudents = inquiries.filter((i) => i.status === 'Enrolled').length;

  return (
    <div className="min-h-screen bg-[#F2F8FD] text-[#021936] flex flex-col font-sans">
      {/* Top Administration Nav Header */}
      <header className="bg-[#021936] text-white border-b border-[#1a2e4c] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
              <img
                src="/assets/dwps_logo.svg"
                alt="DWPS Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold font-serif text-white tracking-tight">
                  Disney World Public School
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#904d00] text-white text-[10px] font-bold uppercase tracking-wider">
                  Admin Suite
                </span>
              </div>
              <p className="text-xs text-[#8396b9]">
                {currentUser.name} • {currentUser.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Neon DB Cloud Connection Status Capsule */}
            <button
              onClick={() => setIsDbModalOpen(true)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-xs ${
                dbHealth?.ok
                  ? 'bg-[#003829] hover:bg-[#004d38] text-[#00E699] border-emerald-500/50'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
              }`}
              title="Neon Database Connection Status & Deployment Guide"
            >
              <span className="relative flex h-2 w-2">
                {dbHealth?.ok && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    dbHealth?.ok ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
              </span>
              <span className="font-mono text-xs hidden sm:inline">
                {dbHealth?.ok ? 'Neon DB: Connected' : 'DB: Local Mode'}
              </span>
              <span className="font-mono text-xs sm:hidden">
                {dbHealth?.ok ? 'Neon' : 'DB'}
              </span>
            </button>

            {/* Auto-Backup Status Capsule */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-xs ${
                backupSettings.enabled
                  ? 'bg-[#1a2e4c] hover:bg-[#253d63] text-white border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/10'
              }`}
              title="Open Periodic Data Backup & Archive Center"
            >
              <span className="relative flex h-2 w-2">
                {backupSettings.enabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backupSettings.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline font-mono">
                {backupSettings.enabled
                  ? `Auto-Backup: ${Math.floor(secondsRemaining / 60)}m ${(secondsRemaining % 60)
                      .toString()
                      .padStart(2, '0')}s`
                  : 'Backup: Paused'}
              </span>
              <span className="sm:hidden font-mono">
                {backupSettings.enabled ? `${Math.floor(secondsRemaining / 60)}m` : 'Off'}
              </span>
              <span className="material-symbols-outlined text-sm text-[#fe932c]">settings_backup_restore</span>
            </button>

            {/* Quick Instant Backup JSON button */}
            <button
              onClick={() => executeBackup('manual_export')}
              className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="Download fresh JSON backup of inquiries, announcements, and newsletters"
            >
              <span className="material-symbols-outlined text-sm">cloud_download</span>
              <span className="hidden md:inline">Backup (.JSON)</span>
            </button>

            <button
              onClick={onBackToWebsite}
              className="py-2 px-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">public</span>
              <span className="hidden sm:inline">View Live Website</span>
            </button>
            <button
              onClick={onLogout}
              className="py-2 px-3.5 rounded-lg bg-[#904d00] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'border-[#fe932c] text-[#fe932c]'
                : 'border-transparent text-[#8396b9] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">folder_shared</span>
            <span>Admissions Inquiries Desk</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono">
              {inquiries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-[#fe932c] text-[#fe932c]'
                : 'border-transparent text-[#8396b9] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            <span>Upcoming Updates &amp; Notices (आगामी अपडेट्स)</span>
            <span className="px-2 py-0.5 rounded-full bg-[#904d00]/30 text-[#fe932c] text-[10px] font-mono font-bold border border-[#fe932c]/30">
              {announcements.length} Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('newsletters')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'newsletters'
                ? 'border-[#fe932c] text-[#fe932c]'
                : 'border-transparent text-[#8396b9] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">newspaper</span>
            <span>Live Newsletter &amp; Bulletins Manager</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              {newsletters.filter((n) => n.isLive).length} Live
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Global Auto-Backup Toast Notification */}
        {backupToast && (
          <div className="p-4 rounded-xl bg-[#021936] text-white border border-[#1a2e4c] shadow-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">cloud_done</span>
              </div>
              <div>
                <div className="text-xs font-bold font-serif text-[#fe932c]">
                  Disney World Public School • Local Storage Backup
                </div>
                <div className="text-xs text-slate-200 mt-0.5">{backupToast}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="py-1 px-2.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-[#fe932c] cursor-pointer"
              >
                Open Archive
              </button>
              <button
                onClick={() => setBackupToast('')}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}
        {/* ===================== TAB 1: INQUIRIES MANAGEMENT ===================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6 animate-fadeIn">
            {/* CSV Export Success Toast */}
            {csvExportToast && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                  <span>{csvExportToast}</span>
                </div>
                <button
                  onClick={() => setCsvExportToast('')}
                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  Total Leads / Inquiries
                </span>
                <div className="text-3xl font-extrabold font-serif text-[#021936] mt-1">
                  {totalInquiries}
                </div>
                <span className="text-[11px] text-[#904d00] font-semibold mt-1 block">
                  Session 2026-27
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
                <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block">
                  New / Action Required
                </span>
                <div className="text-3xl font-extrabold font-serif text-amber-600 mt-1">
                  {newInquiries}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Needs initial parent contact
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
                <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">
                  Campus Tours Fixed
                </span>
                <div className="text-3xl font-extrabold font-serif text-blue-900 mt-1">
                  {toursScheduled}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Walkthrough scheduled
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card">
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block">
                  Enrolled Students
                </span>
                <div className="text-3xl font-extrabold font-serif text-emerald-700 mt-1">
                  {enrolledStudents}
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
                  Documents &amp; Seat Confirmed
                </span>
              </div>
            </div>

            {/* Inquiries Action & Filter Toolbar */}
            <div className="bg-white p-5 rounded-2xl border border-[#dce3ec] custom-shadow-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    placeholder="Search by student name, phone (+91), email, or application ID..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs sm:text-sm text-[#021936] focus:border-[#904d00] outline-none"
                  />
                  {inquirySearch && (
                    <button
                      onClick={() => setInquirySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsAddInquiryOpen(true)}
                    className="py-2.5 px-4 bg-[#904d00] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>Record Walk-In / Lead</span>
                  </button>

                  {/* Enhanced CSV Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className="py-2.5 px-3.5 bg-[#021936] hover:bg-[#1a2e4c] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                      title="Export student inquiries to CSV"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-400">table_view</span>
                      <span>Export CSV</span>
                      <span className="material-symbols-outlined text-sm">
                        {isExportMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                    </button>

                    {isExportMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#dce3ec] py-2 z-30 animate-fadeIn text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Export Inquiries Dataset (.CSV)
                        </div>

                        <button
                          onClick={() => exportInquiriesCSV('all')}
                          className="w-full px-3 py-2 text-left hover:bg-[#F2F8FD] flex items-center justify-between gap-2 text-[#021936] font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 text-base">dataset</span>
                            <span>Export All Records</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] text-slate-600">
                            {inquiries.length}
                          </span>
                        </button>

                        <button
                          onClick={() => exportInquiriesCSV('filtered')}
                          className="w-full px-3 py-2 text-left hover:bg-[#F2F8FD] flex items-center justify-between gap-2 text-[#021936] font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base">filter_list</span>
                            <span>Export Filtered Results</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] text-slate-600">
                            {filteredInquiries.length}
                          </span>
                        </button>

                        <div className="px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-500 italic">
                          Formatted with UTF-8 BOM for Microsoft Excel &amp; Google Sheets compatibility.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Grade Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold uppercase text-[11px]">Filters:</span>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses ({inquiries.length})</option>
                  <option value="New">New Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Tour Scheduled">Tour Scheduled</option>
                  <option value="Admission Offered">Admission Offered</option>
                  <option value="Enrolled">Enrolled</option>
                </select>

                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] outline-none cursor-pointer"
                >
                  <option value="all">All Grades</option>
                  <option value="playgroup">Playgroup</option>
                  <option value="nursery">Nursery</option>
                  <option value="kg">KG / Prep</option>
                  <option value="grade 1">Grade 1</option>
                  <option value="grade 2">Grade 2</option>
                  <option value="grade 3">Grade 3</option>
                  <option value="grade 4">Grade 4</option>
                  <option value="grade 5">Grade 5 &amp; Middle</option>
                </select>

                {(statusFilter !== 'all' || gradeFilter !== 'all' || inquirySearch) && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setGradeFilter('all');
                      setInquirySearch('');
                    }}
                    className="text-xs text-[#904d00] font-bold hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}

                <div className="ml-auto flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">
                    Showing <strong>{filteredInquiries.length}</strong> of {inquiries.length} records
                  </span>
                  <button
                    onClick={() => exportInquiriesCSV('filtered')}
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                    title="Export currently filtered inquiries to CSV"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Export CSV ({filteredInquiries.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-2xl border border-[#dce3ec] custom-shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#F2F8FD] border-b border-[#dce3ec] text-[#021936]">
                      <th className="py-3 px-4 font-bold">App ID</th>
                      <th className="py-3 px-4 font-bold">Candidate &amp; Grade</th>
                      <th className="py-3 px-4 font-bold">Parent Contact</th>
                      <th className="py-3 px-4 font-bold">Date</th>
                      <th className="py-3 px-4 font-bold">Current Status</th>
                      <th className="py-3 px-4 font-bold">Staff Follow-Up</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce3ec]">
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">
                            inbox
                          </span>
                          No inquiries found matching the selected search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => {
                        const statusColors: Record<string, string> = {
                          New: 'bg-amber-100 text-amber-900 border-amber-300',
                          Contacted: 'bg-blue-100 text-blue-900 border-blue-300',
                          'Under Review': 'bg-purple-100 text-purple-900 border-purple-300',
                          'Tour Scheduled': 'bg-indigo-100 text-indigo-900 border-indigo-300',
                          'Admission Offered': 'bg-teal-100 text-teal-900 border-teal-300',
                          Enrolled: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                        };

                        return (
                          <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                            {/* App ID */}
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                              {inq.id}
                            </td>

                            {/* Candidate */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#021936]">{inq.studentName}</div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ffdcc3] text-[#2f1500] inline-block mt-0.5">
                                {inq.grade}
                              </span>
                            </td>

                            {/* Contact Details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-medium text-[#021936]">
                                <span>{inq.phone}</span>
                                <a
                                  href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chat on WhatsApp"
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <span className="material-symbols-outlined text-base">chat</span>
                                </a>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {inq.email}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                              {inq.date}
                            </td>

                            {/* Quick Status Dropdown */}
                            <td className="py-3.5 px-4">
                              <select
                                value={inq.status}
                                onChange={(e) => handleStatusChange(inq.id, e.target.value as any)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                  statusColors[inq.status] || 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Tour Scheduled">Tour Scheduled</option>
                                <option value="Admission Offered">Admission Offered</option>
                                <option value="Enrolled">Enrolled</option>
                              </select>
                            </td>

                            {/* Notes Snippet */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <p className="text-[11px] text-slate-600 truncate" title={inq.notes || inq.message}>
                                {inq.notes || inq.message || '—'}
                              </p>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedInquiry(inq)}
                                  className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View & Edit Details"
                                >
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteInquiry(inq.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Record"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: UPCOMING UPDATES & NOTICES ===================== */}
        {activeTab === 'announcements' && (
          <AnnouncementsManager
            announcements={announcements}
            onUpdateAnnouncements={onUpdateAnnouncements}
            onBackToWebsite={onBackToWebsite}
          />
        )}

        {/* ===================== TAB 3: LIVE NEWSLETTER & BULLETINS ===================== */}
        {activeTab === 'newsletters' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Newsletter Control Bar */}
            <div className="bg-white p-6 rounded-2xl border border-[#dce3ec] custom-shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    ● Real-Time Live Sync
                  </span>
                  <span className="text-xs text-slate-500">
                    Editions marked 'Live' appear immediately on the website homepage and newsletter portal.
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#021936] mt-1">
                  School Newsletters &amp; Publications Manager
                </h3>
              </div>

              <button
                onClick={handleOpenCreateNewsletter}
                className="py-3 px-5 bg-[#904d00] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Publish New Newsletter</span>
              </button>
            </div>

            {/* Newsletter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletters.map((nl) => (
                <div
                  key={nl.id}
                  className="bg-white rounded-2xl border border-[#dce3ec] custom-shadow-card overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg"
                >
                  <div>
                    {/* Cover Thumbnail with Live Badge */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={nl.coverImageUrl || HOTLINK_IMAGES.smartClassroom}
                        alt={nl.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                          nl.isLive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${nl.isLive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{nl.isLive ? 'Live on Website' : 'Draft / Hidden'}</span>
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-[#021936]">
                          {nl.category}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[11px] font-semibold text-[#FDE68A]">
                          {nl.edition} • {nl.publishDate}
                        </span>
                      </div>
                    </div>

                    {/* Content Excerpt */}
                    <div className="p-5 space-y-3">
                      <h4 className="text-base font-bold font-serif text-[#021936] leading-snug line-clamp-2">
                        {nl.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {nl.summary}
                      </p>

                      {nl.highlights && nl.highlights.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-[#904d00] uppercase tracking-wider block mb-1">
                            Key Highlights:
                          </span>
                          <ul className="text-[11px] text-slate-600 space-y-1">
                            {nl.highlights.slice(0, 2).map((h, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-xs text-[#904d00] flex-shrink-0 mt-0.5">
                                  check
                                </span>
                                <span className="truncate">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-[#F2F8FD] border-t border-[#dce3ec] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleNewsletterLive(nl.id)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        nl.isLive
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {nl.isLive ? 'visibility_off' : 'visibility'}
                      </span>
                      <span>{nl.isLive ? 'Unpublish' : 'Go Live'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewNewsletter(nl)}
                        className="p-1.5 text-[#021936] hover:bg-white rounded-lg transition-colors"
                        title="Preview Article"
                      >
                        <span className="material-symbols-outlined text-base">menu_book</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditNewsletter(nl)}
                        className="p-1.5 text-blue-900 hover:bg-white rounded-lg transition-colors"
                        title="Edit Newsletter"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteNewsletter(nl.id)}
                        className="p-1.5 text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete Newsletter"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL 1: INQUIRY DETAILS & NOTES EDITOR --- */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#021936] text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#FDE68A] block">
                  {selectedInquiry.id}
                </span>
                <h3 className="text-lg font-bold font-serif text-white">
                  {selectedInquiry.studentName}
                </h3>
                <span className="text-xs text-[#8396b9]">
                  Applying for {selectedInquiry.grade} • Received {selectedInquiry.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phone:</span>
                  <div className="flex items-center gap-2 font-bold text-[#021936]">
                    <span>{selectedInquiry.phone}</span>
                    <a
                      href={`tel:${selectedInquiry.phone.replace(/[^0-9+]/g, '')}`}
                      className="p-1 bg-[#021936] text-white rounded hover:bg-[#904d00]"
                      title="Call Parent"
                    >
                      <span className="material-symbols-outlined text-xs">call</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-[#25D366] text-white rounded hover:opacity-90"
                      title="WhatsApp"
                    >
                      <span className="material-symbols-outlined text-xs">chat</span>
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-[#021936]">{selectedInquiry.email}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value as any)}
                    className="p-1.5 font-bold rounded bg-white border border-[#dce3ec] text-xs text-[#021936] outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Tour Scheduled">Tour Scheduled</option>
                    <option value="Admission Offered">Admission Offered</option>
                    <option value="Enrolled">Enrolled</option>
                  </select>
                </div>
              </div>

              {selectedInquiry.message && (
                <div>
                  <label className="text-xs font-bold text-[#021936] uppercase tracking-wider block mb-1">
                    Parent's Inquiry Message:
                  </label>
                  <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs italic">
                    "{selectedInquiry.message}"
                  </p>
                </div>
              )}

              {/* Staff Notes */}
              <div>
                <label className="text-xs font-bold text-[#021936] uppercase tracking-wider block mb-1">
                  Admissions Staff Internal Notes:
                </label>
                <textarea
                  rows={3}
                  defaultValue={selectedInquiry.notes || ''}
                  onBlur={(e) => handleSaveInquiryNotes(selectedInquiry.id, e.target.value)}
                  placeholder="Record call summary, campus visit date, document status, etc..."
                  className="w-full p-3 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs text-[#021936] outline-none focus:border-[#904d00]"
                ></textarea>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  * Changes to internal notes save automatically when clicking outside the box.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => exportInquiriesCSV([selectedInquiry], `Student_${selectedInquiry.id}`)}
                  className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
                  title="Export this student record as CSV"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Export Record (.csv)</span>
                </button>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="flex-1 py-2.5 bg-[#021936] hover:bg-[#1a2e4c] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Close &amp; Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD WALK-IN / OFFLINE INQUIRY --- */}
      {isAddInquiryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsAddInquiryOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#021936] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif text-white">
                  Record Offline / Walk-In Lead
                </h3>
                <p className="text-xs text-[#8396b9]">
                  Subhash Colony Admissions Counter
                </p>
              </div>
              <button
                onClick={() => setIsAddInquiryOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddWalkInInquiry} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newInquiryData.studentName}
                  onChange={(e) => setNewInquiryData({ ...newInquiryData, studentName: e.target.value })}
                  placeholder="e.g. Vihaan Bhati"
                  className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Phone (+91) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newInquiryData.phone}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, phone: e.target.value })}
                    placeholder="98996 38676"
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={newInquiryData.grade}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, grade: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  >
                    <option value="Playgroup">Playgroup</option>
                    <option value="Nursery">Nursery</option>
                    <option value="KG / Prep">KG / Prep</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5+">Grade 5 &amp; Middle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Parent Email (Optional)
                </label>
                <input
                  type="email"
                  value={newInquiryData.email}
                  onChange={(e) => setNewInquiryData({ ...newInquiryData, email: e.target.value })}
                  placeholder="parent@domain.com"
                  className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Initial Notes / Parent Remarks
                </label>
                <textarea
                  rows={2}
                  value={newInquiryData.notes}
                  onChange={(e) => setNewInquiryData({ ...newInquiryData, notes: e.target.value })}
                  placeholder="Parent requested fee brochure and visited classrooms..."
                  className="w-full p-2.5 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#904d00] hover:bg-[#B45309] text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Lead to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInquiryOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREATE / EDIT NEWSLETTER --- */}
      {isNewsletterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsNewsletterModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#021936] text-white p-6 sticky top-0 z-10 flex items-center justify-between border-b border-[#1a2e4c]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#904d00] text-white px-2 py-0.5 rounded">
                  {editingNewsletter ? 'Edit Edition' : 'Publish New Edition'}
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  Newsletter &amp; Bulletin Editor
                </h3>
              </div>
              <button
                onClick={() => setIsNewsletterModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewsletter} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Edition / Issue Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsletterForm.edition}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, edition: e.target.value })}
                    placeholder="e.g. Vol. 15 • May 2026 Special"
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newsletterForm.publishDate}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, publishDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Newsletter Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newsletterForm.title}
                  onChange={(e) => setNewsletterForm({ ...newsletterForm, title: e.target.value })}
                  placeholder="e.g. The DWPS Chronicle: Smart Classrooms & Annual Athletic Laurels"
                  className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newsletterForm.category}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, category: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  >
                    <option value="Academics & STEM">Academics &amp; STEM</option>
                    <option value="Sports & Athletics">Sports &amp; Athletics</option>
                    <option value="Campus Life & Arts">Campus Life &amp; Arts</option>
                    <option value="Special Bulletin">Special Bulletin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                    Author / Desk Byline
                  </label>
                  <input
                    type="text"
                    value={newsletterForm.author}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, author: e.target.value })}
                    placeholder="e.g. Editorial Board & Director Office"
                    className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                  />
                </div>
              </div>

              {/* Cover Image Preset Selector */}
              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={newsletterForm.coverImageUrl}
                  onChange={(e) => setNewsletterForm({ ...newsletterForm, coverImageUrl: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none mb-2"
                />
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-500 font-bold whitespace-nowrap">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setNewsletterForm({ ...newsletterForm, coverImageUrl: HOTLINK_IMAGES.smartClassroom })}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Smart Classroom
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterForm({ ...newsletterForm, coverImageUrl: HOTLINK_IMAGES.sportsRelay })}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Sports Relay
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterForm({ ...newsletterForm, coverImageUrl: HOTLINK_IMAGES.scienceExhibition })}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Science Fair
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterForm({ ...newsletterForm, coverImageUrl: HOTLINK_IMAGES.annualDay })}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Annual Day
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Lead Summary / Abstract *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newsletterForm.summary}
                  onChange={(e) => setNewsletterForm({ ...newsletterForm, summary: e.target.value })}
                  placeholder="Brief 2-3 sentence overview that appears on preview cards and homepage..."
                  className="w-full p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-[#021936] uppercase tracking-wider mb-1">
                  Full Article Body (Markdown supported)
                </label>
                <textarea
                  rows={6}
                  value={newsletterForm.content}
                  onChange={(e) => setNewsletterForm({ ...newsletterForm, content: e.target.value })}
                  placeholder="Enter full article text with headings and paragraphs..."
                  className="w-full p-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-[#021936] outline-none font-mono text-xs"
                ></textarea>
              </div>

              {/* Live on Website Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#021936] block">
                    Make Live on Website Immediately
                  </span>
                  <span className="text-[11px] text-slate-600">
                    If checked, this newsletter will be visible to parents and visitors right away.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newsletterForm.isLive}
                  onChange={(e) => setNewsletterForm({ ...newsletterForm, isLive: e.target.checked })}
                  className="w-5 h-5 accent-[#904d00] rounded"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#904d00] hover:bg-[#B45309] text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">publish</span>
                  <span>{editingNewsletter ? 'Update & Save Edition' : 'Publish Live to Website'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewsletterModalOpen(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: PREVIEW NEWSLETTER MODAL --- */}
      {previewNewsletter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setPreviewNewsletter(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#dce3ec]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 bg-slate-900">
              <img
                src={previewNewsletter.coverImageUrl}
                alt={previewNewsletter.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021936] via-[#021936]/40 to-transparent"></div>
              <button
                onClick={() => setPreviewNewsletter(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fe932c] text-[#021936]">
                  {previewNewsletter.edition}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                  {previewNewsletter.title}
                </h3>
                <p className="text-xs text-[#8396b9]">
                  {previewNewsletter.category} • Published {previewNewsletter.publishDate} • {previewNewsletter.author}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] text-xs font-medium text-[#021936]">
                {previewNewsletter.summary}
              </div>

              <div className="whitespace-pre-line prose prose-sm max-w-none">
                {previewNewsletter.content}
              </div>

              {previewNewsletter.highlights && previewNewsletter.highlights.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <span className="font-bold text-[#021936] block uppercase tracking-wider text-[11px]">
                    Key Highlights in this Issue:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {previewNewsletter.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#904d00]">check_circle</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setPreviewNewsletter(null)}
                  className="py-2 px-5 bg-[#021936] text-white rounded-lg text-xs font-bold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: PERIODIC DATA BACKUP & ARCHIVE MODAL --- */}
      <PeriodicBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentUser={currentUser}
        inquiries={inquiries}
        announcements={announcements}
        newsletters={newsletters}
        backupSettings={backupSettings}
        onUpdateBackupSettings={handleUpdateBackupSettings}
        secondsRemaining={secondsRemaining}
        lastBackupTime={lastBackupTime}
        onTriggerBackup={executeBackup}
        onRestoreData={handleRestoreBackupData}
      />

      {/* --- MODAL 6: NEON DATABASE STATUS & DEPLOYMENT GUIDE --- */}
      <NeonDbStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
