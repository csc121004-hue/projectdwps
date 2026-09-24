import React, { useState, useEffect, useRef } from 'react';
import {
  SCHOOL_INFO,
  InquiryRecord,
  NewsletterItem,
  SchoolAnnouncement,
} from '../data/schoolData';

export interface SchoolBackupPayload {
  schema: 'DWPS_SCHOOL_SYSTEM_BACKUP';
  version: string;
  timestamp: string;
  exportedAt: string;
  institution: {
    name: string;
    shortName: string;
    address: string;
    phone: string;
    email: string;
    academicYear: string;
  };
  exportedBy: {
    name: string;
    role: string;
    email: string;
  };
  summary: {
    totalInquiries: number;
    totalAnnouncements: number;
    totalNewsletters: number;
    backupTrigger: 'automatic_periodic' | 'manual_export';
  };
  data: {
    inquiries: InquiryRecord[];
    announcements: SchoolAnnouncement[];
    newsletters: NewsletterItem[];
  };
}

export interface BackupHistoryRecord {
  id: string;
  timestamp: string;
  filename: string;
  trigger: 'automatic_periodic' | 'manual_export';
  inquiriesCount: number;
  announcementsCount: number;
  newslettersCount: number;
  fileSizeBytes: number;
}

export interface BackupSettings {
  enabled: boolean;
  intervalMinutes: number;
  autoDownload: boolean;
  notifyOnAutoBackup: boolean;
}

interface PeriodicBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; role: string; email: string };
  inquiries: InquiryRecord[];
  announcements: SchoolAnnouncement[];
  newsletters: NewsletterItem[];
  backupSettings: BackupSettings;
  onUpdateBackupSettings: (settings: BackupSettings) => void;
  secondsRemaining: number;
  lastBackupTime: string | null;
  onTriggerBackup: (trigger: 'automatic_periodic' | 'manual_export') => void;
  onRestoreData: (
    restoredInquiries?: InquiryRecord[],
    restoredAnnouncements?: SchoolAnnouncement[],
    restoredNewsletters?: NewsletterItem[]
  ) => void;
}

export const PeriodicBackupModal: React.FC<PeriodicBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  inquiries,
  announcements,
  newsletters,
  backupSettings,
  onUpdateBackupSettings,
  secondsRemaining,
  lastBackupTime,
  onTriggerBackup,
  onRestoreData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'manual' | 'restore' | 'history'>('schedule');
  const [copySuccess, setCopySuccess] = useState(false);
  const [historyList, setHistoryList] = useState<BackupHistoryRecord[]>([]);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<SchoolBackupPayload | null>(null);
  const [restoreError, setRestoreError] = useState<string>('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const savedHistory = localStorage.getItem('dwps_backup_history');
        if (savedHistory) {
          setHistoryList(JSON.parse(savedHistory));
        }
      } catch (e) {
        console.warn('Failed to load backup history', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format seconds to MM:SS
  const formatTimeRemaining = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate estimated payload size
  const previewPayload = {
    schema: 'DWPS_SCHOOL_SYSTEM_BACKUP',
    version: '1.0.0',
    data: { inquiries, announcements, newsletters },
  };
  const estimatedSizeBytes = new Blob([JSON.stringify(previewPayload)]).size;
  const estimatedSizeKB = (estimatedSizeBytes / 1024).toFixed(1);

  // Handle Copy JSON to Clipboard
  const handleCopyJSON = () => {
    const payload: SchoolBackupPayload = {
      schema: 'DWPS_SCHOOL_SYSTEM_BACKUP',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
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
        backupTrigger: 'manual_export',
      },
      data: {
        inquiries,
        announcements,
        newsletters,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Handle File Selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    setRestoreSuccessMsg('');
    setRestorePreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format. Please select a valid DWPS school backup file.');
        }

        const data = parsed.data || parsed;
        if (!data.inquiries && !data.announcements && !data.newsletters) {
          throw new Error(
            'The uploaded file does not contain recognizable inquiries, announcements, or newsletters datasets.'
          );
        }

        setRestorePreview(parsed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse backup JSON file.';
        setRestoreError(msg);
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Restore
  const handleExecuteRestore = () => {
    if (!restorePreview) return;
    const data = restorePreview.data || restorePreview;

    const countInq = Array.isArray(data.inquiries) ? data.inquiries.length : 0;
    const countAnn = Array.isArray(data.announcements) ? data.announcements.length : 0;
    const countNl = Array.isArray(data.newsletters) ? data.newsletters.length : 0;

    const confirmMsg = `Are you sure you want to restore the following datasets?\n\n` +
      `• Student Inquiries: ${countInq} records\n` +
      `• Upcoming Updates & Notices: ${countAnn} items\n` +
      `• Newsletters & Bulletins: ${countNl} publications\n\n` +
      `This will update the active school database and localStorage.`;

    if (!window.confirm(confirmMsg)) return;

    onRestoreData(
      Array.isArray(data.inquiries) ? data.inquiries : undefined,
      Array.isArray(data.announcements) ? data.announcements : undefined,
      Array.isArray(data.newsletters) ? data.newsletters : undefined
    );

    setRestoreSuccessMsg(`Successfully restored data! (${countInq} inquiries, ${countAnn} announcements, ${countNl} newsletters).`);
    setRestorePreview(null);
    setRestoreFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clear History
  const handleClearHistory = () => {
    if (window.confirm('Clear all backup activity log records?')) {
      localStorage.removeItem('dwps_backup_history');
      setHistoryList([]);
    }
  };

  const totalIntervalSec = backupSettings.intervalMinutes * 60;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalIntervalSec - secondsRemaining) / totalIntervalSec) * 100))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#dce3ec] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#021936] text-white flex items-center justify-between border-b border-[#1a2e4c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fe932c] to-[#904d00] flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">backup</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
                  Periodic Data Backup &amp; Archive Center
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                  JSON Automation
                </span>
              </div>
              <p className="text-xs text-[#8396b9] mt-0.5">
                Automatically serializes and saves student inquiries, upcoming notices &amp; newsletters to local JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Live Status Hero Card */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-[#F2F8FD] to-white border-b border-[#dce3ec]">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Automation Status */}
            <div className="p-3.5 bg-white rounded-xl border border-[#dce3ec] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Periodic Engine
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    backupSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="text-sm font-bold text-[#021936] flex items-center gap-1.5">
                <span>{backupSettings.enabled ? 'Active & Running' : 'Paused / Off'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Frequency: Every <strong>{backupSettings.intervalMinutes} mins</strong>
              </div>
            </div>

            {/* Next Automated Run */}
            <div className="p-3.5 bg-white rounded-xl border border-[#dce3ec] shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Next Auto-Download
              </span>
              <div className="text-lg font-mono font-bold text-[#904d00] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">timer</span>
                <span>{backupSettings.enabled ? formatTimeRemaining(secondsRemaining) : 'Paused'}</span>
              </div>
              {backupSettings.enabled && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-[#904d00] h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Total School Records */}
            <div className="p-3.5 bg-white rounded-xl border border-[#dce3ec] shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Serialized Dataset
              </span>
              <div className="text-sm font-bold text-[#021936]">
                {inquiries.length + announcements.length + newsletters.length} Records Total
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {inquiries.length} Inq • {announcements.length} Ann • {newsletters.length} News
              </div>
            </div>

            {/* Estimated JSON File Size */}
            <div className="p-3.5 bg-white rounded-xl border border-[#dce3ec] shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Est. Payload Size
              </span>
              <div className="text-sm font-mono font-bold text-blue-700">
                ~{estimatedSizeKB} KB JSON
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                Last: {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'Not yet run'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-[#dce3ec] px-6 bg-white gap-2">
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'border-[#904d00] text-[#904d00]'
                : 'border-transparent text-slate-500 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>Periodic Settings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('manual')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'manual'
                ? 'border-[#904d00] text-[#904d00]'
                : 'border-transparent text-slate-500 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Manual Download</span>
          </button>

          <button
            onClick={() => setActiveSubTab('restore')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'restore'
                ? 'border-[#904d00] text-[#904d00]'
                : 'border-transparent text-slate-500 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Restore / Verify Backup</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-[#904d00] text-[#904d00]'
                : 'border-transparent text-slate-500 hover:text-[#021936]'
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>Activity Log ({historyList.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* TAB 1: PERIODIC AUTOMATION SETTINGS */}
          {activeSubTab === 'schedule' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#F2F8FD] border border-[#dce3ec] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-2xl text-[#904d00]">sync</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#021936]">
                        Automatic Local JSON Backup Routine
                      </h4>
                      <p className="text-xs text-slate-600">
                        When enabled, the dashboard periodically serializes current admissions inquiries, upcoming announcements, and newsletters into a timestamped JSON file and triggers an automatic local download.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSettings.enabled}
                      onChange={(e) =>
                        onUpdateBackupSettings({
                          ...backupSettings,
                          enabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#904d00]"></div>
                  </label>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Periodic Interval Frequency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { label: '⚡ 1 Min (Test)', value: 1, hint: 'Fast demo / live test' },
                    { label: '5 Mins', value: 5, hint: 'Active sessions' },
                    { label: '15 Mins (Default)', value: 15, hint: 'Recommended standard' },
                    { label: '30 Mins', value: 30, hint: 'Standard office hours' },
                    { label: '60 Mins (1 Hr)', value: 60, hint: 'Low frequency' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        onUpdateBackupSettings({
                          ...backupSettings,
                          intervalMinutes: item.value,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        backupSettings.intervalMinutes === item.value
                          ? 'border-[#904d00] bg-amber-50/60 ring-2 ring-[#904d00]/20'
                          : 'border-[#dce3ec] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#021936]">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automation Flags */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Periodic Actions &amp; Alerts
                </label>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#dce3ec] cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={backupSettings.autoDownload}
                      onChange={(e) =>
                        onUpdateBackupSettings({
                          ...backupSettings,
                          autoDownload: e.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 text-[#904d00] rounded border-slate-300 focus:ring-[#904d00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#021936]">
                        Trigger Local File Download on Interval
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Automatically prompts the browser to download <code>DWPS_Backup_Auto_[date].json</code> when the countdown expires.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#dce3ec] cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={backupSettings.notifyOnAutoBackup}
                      onChange={(e) =>
                        onUpdateBackupSettings({
                          ...backupSettings,
                          notifyOnAutoBackup: e.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 text-[#904d00] rounded border-slate-300 focus:ring-[#904d00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#021936]">
                        Show Toast Notification in Admin Dashboard
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Displays an in-app banner confirming the time and records backed up upon every periodic execution.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onTriggerBackup('automatic_periodic')}
                  className="py-2.5 px-4 bg-[#904d00] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  <span>Test Run Periodic Auto-Backup Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL DOWNLOAD */}
          {activeSubTab === 'manual' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Dataset Schema Preview (JSON)
                </h4>
                <div className="bg-[#021936] text-emerald-300 p-4 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
                  <pre>{JSON.stringify({
                    schema: 'DWPS_SCHOOL_SYSTEM_BACKUP',
                    version: '1.0.0',
                    institution: SCHOOL_INFO.name,
                    timestamp: new Date().toISOString(),
                    exportedBy: currentUser.name,
                    summary: {
                      inquiries: inquiries.length,
                      announcements: announcements.length,
                      newsletters: newsletters.length,
                    },
                    sampleInquiry: inquiries[0] || null,
                    sampleAnnouncement: announcements[0] || null,
                  }, null, 2)}</pre>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onTriggerBackup('manual_export')}
                  className="py-3 px-5 bg-[#021936] hover:bg-[#1a2e4c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-lg text-emerald-400">download</span>
                  <span>Download Complete Backup (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="py-3 px-5 bg-white hover:bg-slate-50 text-[#021936] border border-[#dce3ec] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span className="material-symbols-outlined text-lg text-blue-600">
                    {copySuccess ? 'check' : 'content_copy'}
                  </span>
                  <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON Payload to Clipboard'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE / VERIFY BACKUP */}
          {activeSubTab === 'restore' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-base mt-0.5">info</span>
                  <div>
                    <span className="font-bold">Restore &amp; Data Recovery:</span> Upload a previously downloaded DWPS JSON backup file to inspect its contents and restore inquiries, announcements, or newsletters.
                  </div>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-[#dce3ec] rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="backup-upload-input"
                />
                <label
                  htmlFor="backup-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#dce3ec] flex items-center justify-center text-[#904d00] shadow-xs">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#021936] underline">
                      Click to choose backup JSON file
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Supports .json exported from DWPS School Suite
                    </span>
                  </div>
                </label>
                {restoreFile && (
                  <div className="mt-3 inline-block px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                    Selected: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {restoreError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Success Banner */}
              {restoreSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  <span>{restoreSuccessMsg}</span>
                </div>
              )}

              {/* Preview of Parsed File */}
              {restorePreview && (
                <div className="p-4 rounded-xl bg-white border border-[#dce3ec] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#021936]">
                      Backup Verification &amp; Contents
                    </h5>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Valid Structure
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-[#F2F8FD] rounded-lg">
                      <div className="text-xs font-bold text-[#021936]">
                        {restorePreview.data?.inquiries?.length ?? (restorePreview as any).inquiries?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Student Inquiries</div>
                    </div>
                    <div className="p-2.5 bg-[#F2F8FD] rounded-lg">
                      <div className="text-xs font-bold text-[#021936]">
                        {restorePreview.data?.announcements?.length ?? (restorePreview as any).announcements?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Notices &amp; Updates</div>
                    </div>
                    <div className="p-2.5 bg-[#F2F8FD] rounded-lg">
                      <div className="text-xs font-bold text-[#021936]">
                        {restorePreview.data?.newsletters?.length ?? (restorePreview as any).newsletters?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Newsletters</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Exported by:{' '}
                    <strong>{restorePreview.exportedBy?.name || 'Authorized Admin'}</strong> on{' '}
                    {restorePreview.timestamp ? new Date(restorePreview.timestamp).toLocaleString() : 'N/A'}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">restore</span>
                      <span>Confirm &amp; Restore this School Dataset</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY LOG */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Recent serialized downloads stored in this browser session.
                </span>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">
                    history_toggle_off
                  </span>
                  <div className="text-xs font-bold text-slate-600">No backup records logged yet</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Trigger a manual or periodic backup to view execution timestamps and file sizes here.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-[#dce3ec] rounded-xl overflow-hidden bg-white">
                  {historyList.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-[#F2F8FD] transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-lg ${
                            item.trigger === 'automatic_periodic' ? 'text-emerald-600' : 'text-blue-600'
                          }`}
                        >
                          {item.trigger === 'automatic_periodic' ? 'sync' : 'download'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#021936] font-mono">
                            {item.filename}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(item.timestamp).toLocaleString()} •{' '}
                            <span className="uppercase font-semibold">
                              {item.trigger === 'automatic_periodic' ? 'Periodic Auto' : 'Manual'}
                            </span>{' '}
                            • {item.inquiriesCount} Inquiries, {item.announcementsCount} Updates,{' '}
                            {item.newslettersCount} Newsletters
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-slate-600 font-semibold">
                          {(item.fileSizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#dce3ec] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Disney World Public School • Data Storage Engine (Client-Side Encapsulated)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-[#021936] hover:bg-[#1a2e4c] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
