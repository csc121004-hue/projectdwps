import React, { useState, useEffect } from 'react';
import { api, DbHealthResponse, TableSummary } from '../services/api';

interface NeonDbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLE_DESCRIPTIONS: Record<string, string> = {
  dwps_inquiries: 'Student admissions & parent inquiries repository',
  dwps_tour_bookings: 'Campus visit and orientation bookings',
  dwps_announcements: 'Live school announcements and urgent notices',
  dwps_newsletters: 'Quarterly school magazine, bulletins, and archives',
  dwps_newsletter_subscribers: 'Subscribed parent email distribution list'
};

const SQL_SCHEMA_SNIPPET = `-- DWPS Neon PostgreSQL Schema
CREATE TABLE IF NOT EXISTS dwps_inquiries (
  id VARCHAR(64) PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  grade VARCHAR(50) NOT NULL,
  message TEXT,
  date VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'New',
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'Normal',
  follow_up_date VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dwps_tour_bookings (
  id VARCHAR(64) PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  preferred_date VARCHAR(50) NOT NULL,
  preferred_slot VARCHAR(50) NOT NULL,
  grade_interested VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dwps_newsletters (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  edition VARCHAR(100),
  publish_date VARCHAR(50),
  category VARCHAR(100),
  cover_image_url TEXT,
  summary TEXT,
  content TEXT,
  author VARCHAR(100),
  is_live BOOLEAN DEFAULT true,
  highlights JSONB DEFAULT '[]'::jsonb,
  pdf_download_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dwps_announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  badge VARCHAR(50),
  is_urgent BOOLEAN DEFAULT false,
  action_label VARCHAR(100),
  action_link TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dwps_newsletter_subscribers (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`;

export const NeonDbStatusModal: React.FC<NeonDbStatusModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [health, setHealth] = useState<DbHealthResponse | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'tables' | 'setup' | 'sql'>('status');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeTables = async () => {
    setInitLoading(true);
    setActionNotice('');
    try {
      const result = await api.initializeDb();
      if (result?.result?.success) {
        setActionNotice('✅ Tables created & verified in Neon! Seeded initial sample records.');
      } else if (result?.result?.message) {
        setActionNotice(`Notice: ${result.result.message}`);
      } else {
        setActionNotice('Tables verification request dispatched.');
      }
      // Recheck status
      await fetchStatus();
    } catch (err: any) {
      setActionNotice(`Error initializing tables: ${err?.message || String(err)}`);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isConnected = health?.database?.ok;
  const isConfigured = health?.database?.configured;
  const tables: TableSummary[] = health?.database?.tables || [];
  const logs = health?.database?.logs || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#dce3ec] my-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-xl bg-[#021936] text-[#00E699] flex items-center justify-center font-bold font-mono text-2xl shadow-md">
            🐘
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold font-serif text-[#021936]">
                Neon Serverless PostgreSQL Verification
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isConfigured
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isConnected ? '● Connected' : isConfigured ? '● Connection Error' : '○ Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, table inspector, and diagnostic verification for Neon database deployment.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-[#021936] text-[#021936]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">monitor_heart</span>
            <span>Live Health &amp; Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'border-[#021936] text-[#021936]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">table_chart</span>
            <span>Database Tables ({tables.filter((t) => t.exists).length}/{tables.length || 5})</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'border-[#021936] text-[#021936]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>Where to View in Neon</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#021936] text-[#021936]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>SQL Schema Script</span>
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900 text-sm font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Tab 1: Live Status & Logs */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Database Synchronization</span>
                <span className="text-[11px] text-slate-500">Trigger table creation &amp; test connection query</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStatus}
                  disabled={loading || initLoading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
                  <span>{loading ? 'Testing...' : 'Check Status'}</span>
                </button>
                <button
                  onClick={handleInitializeTables}
                  disabled={initLoading || loading}
                  className="px-3.5 py-1.5 rounded-lg bg-[#021936] hover:bg-[#032857] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <span className={`material-symbols-outlined text-sm ${initLoading ? 'animate-spin' : ''}`}>
                    {initLoading ? 'hourglass_top' : 'play_arrow'}
                  </span>
                  <span>{initLoading ? 'Initializing Tables...' : 'Initialize Tables in Neon'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="text-slate-500 text-[11px] font-medium">Database Name &amp; User</span>
                <p className="font-mono font-bold text-slate-800">
                  {health?.database?.database ? `${health.database.database} (user: ${health.database.user || 'neondb_owner'})` : 'neondb'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="text-slate-500 text-[11px] font-medium">PostgreSQL Engine Version</span>
                <p className="font-mono font-bold text-emerald-700">
                  {health?.database?.version || 'PostgreSQL (Neon Serverless)'}
                </p>
              </div>
            </div>

            {/* Live Message */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Connection Output:</span>
              <p className="text-slate-700 font-mono text-[12px] bg-slate-900 text-emerald-400 p-3 rounded-lg border border-slate-800 leading-relaxed overflow-x-auto">
                {health?.database?.message || 'Ready. Click "Check Status" or "Initialize Tables in Neon" to test.'}
              </p>
            </div>

            {/* Server Logs Trace */}
            {logs && logs.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#904d00]">receipt_long</span>
                  <span>Server Execution Logs (also in Vercel Runtime Logs):</span>
                </span>
                <div className="bg-slate-950 text-slate-300 p-3 rounded-lg font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto border border-slate-800">
                  {logs.map((line, idx) => (
                    <div key={idx} className="leading-tight text-slate-300">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Database Tables */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Neon PostgreSQL Schema: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#021936]">public</code>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The application expects 5 core tables. Each table stores persistent school records.
                </p>
              </div>
              <button
                onClick={handleInitializeTables}
                disabled={initLoading}
                className="px-3 py-1.5 rounded-lg bg-[#904d00] hover:bg-[#a65800] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className={`material-symbols-outlined text-sm ${initLoading ? 'animate-spin' : ''}`}>
                  build
                </span>
                <span>{initLoading ? 'Creating...' : 'Create Missing Tables'}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {(tables.length > 0 ? tables : [
                { name: 'dwps_inquiries', exists: false, rowCount: 0 },
                { name: 'dwps_tour_bookings', exists: false, rowCount: 0 },
                { name: 'dwps_announcements', exists: false, rowCount: 0 },
                { name: 'dwps_newsletters', exists: false, rowCount: 0 },
                { name: 'dwps_newsletter_subscribers', exists: false, rowCount: 0 }
              ]).map((tbl) => (
                <div key={tbl.name} className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#021936]">{tbl.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tbl.exists
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {tbl.exists ? '✓ Created in Neon' : 'Pending First Call'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {TABLE_DESCRIPTIONS[tbl.name] || 'Application data table'}
                    </p>
                  </div>
                  <div className="text-right pl-3">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      {tbl.rowCount} {tbl.rowCount === 1 ? 'row' : 'rows'}
                    </span>
                    <span className="text-[10px] text-slate-400">records in DB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Where to View in Neon Console & Vercel */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            {/* Step 1: Neon Console instructions */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#021936]">
                <span className="w-6 h-6 rounded-full bg-[#021936] text-[#00E699] flex items-center justify-center text-xs">1</span>
                <span>How to Find Your Tables in Neon Console</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 pl-2 leading-relaxed">
                <li>
                  Log in to your Neon account at <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="underline text-sky-600 font-bold">console.neon.tech</a>.
                </li>
                <li>
                  Click on your project (usually named after your project or branch).
                </li>
                <li>
                  In the left navigation sidebar under <strong>&quot;Postgres database&quot;</strong>, click on <strong>&quot;Tables&quot;</strong>.
                </li>
                <li>
                  Ensure the schema selector is set to <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold">public</code> (the default).
                </li>
                <li>
                  You will see all five tables: <code className="font-mono text-emerald-800">dwps_inquiries</code>, <code className="font-mono text-emerald-800">dwps_tour_bookings</code>, <code className="font-mono text-emerald-800">dwps_announcements</code>, etc.
                </li>
                <li>
                  Click on any table name to view live rows, edit columns, or browse records!
                </li>
              </ol>
            </div>

            {/* Step 2: Vercel Logs verification */}
            <div className="p-4 rounded-xl bg-[#021936] text-white space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-6 h-6 rounded-full bg-white/20 text-[#00E699] flex items-center justify-center text-xs">2</span>
                <span>How to Verify DB Logs in Vercel</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-2 leading-relaxed">
                <li>
                  Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="underline text-[#00E699]">vercel.com/dashboard</a> and open your school project.
                </li>
                <li>
                  In the top navigation tabs, click <strong>&quot;Logs&quot;</strong> (or <strong>Deployments &rarr; [Latest Deployment] &rarr; Functions</strong>).
                </li>
                <li>
                  In your browser address bar, visit: <code className="text-[#00E699] font-mono">https://[your-vercel-domain].vercel.app/api/health</code>
                </li>
                <li>
                  Watch your Vercel logs stream! You will see clear lines starting with:
                  <div className="mt-1 bg-black/50 p-2 rounded text-[11px] font-mono text-emerald-300">
                    [NeonDB] ✅ Connected successfully to database &quot;neondb&quot;<br />
                    [NeonDB] 📋 Public schema tables found: dwps_inquiries, ...
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 4: SQL Schema Script */}
        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Direct SQL Script for Neon SQL Editor</span>
                <p className="text-[11px] text-slate-500">
                  You can also paste and run this in Neon&apos;s <strong>&quot;SQL Editor&quot;</strong> tab if you prefer manual execution.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="py-1.5 px-3 rounded bg-[#904d00] hover:bg-[#a65800] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64 border border-slate-800">
              {SQL_SCHEMA_SNIPPET}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">/api/health</code>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
