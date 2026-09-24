import React, { useState, useEffect } from 'react';
import { api, DbHealthResponse } from '../services/api';

interface NeonDbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeonDbStatusModal: React.FC<NeonDbStatusModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<DbHealthResponse | null>(null);
  const [copiedVar, setCopiedVar] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText('DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require');
    setCopiedVar(true);
    setTimeout(() => setCopiedVar(false), 2500);
  };

  const isConnected = health?.database?.ok;
  const isConfigured = health?.database?.configured;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#dce3ec] my-8 space-y-6"
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
          <div className="w-12 h-12 rounded-xl bg-[#021936] text-[#00E699] flex items-center justify-center font-bold font-mono text-xl shadow-md">
            🐘
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-serif text-[#021936]">
                Neon Serverless PostgreSQL Database
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isConfigured
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isConnected ? 'Connected' : isConfigured ? 'Connection Error' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Persistent cloud storage for admissions, tour bookings, and school announcements.
            </p>
          </div>
        </div>

        {/* Active Status Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Connection Status:</span>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="text-xs font-semibold text-[#904d00] hover:text-[#021936] flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{loading ? 'Checking...' : 'Recheck Connection'}</span>
            </button>
          </div>
          <p className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
            {health?.database?.message || 'Testing connection...'}
          </p>
          {health?.database?.version && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
              <span>PostgreSQL Engine: {health.database.version}</span>
            </div>
          )}
        </div>

        {/* Deployment Setup Guide */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#021936] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-[#904d00]">rocket_launch</span>
            <span>How to Connect Your Neon DB for Vercel &amp; Hostinger</span>
          </h4>

          {/* Vercel Guide */}
          <div className="p-4 rounded-xl bg-[#021936] text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">▲ Vercel Deployment</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-emerald-300">
                  Zero Config (vercel.json ready)
                </span>
              </div>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 pl-1 leading-relaxed">
              <li>Deploy this repository to <strong>Vercel</strong>.</li>
              <li>Open your project dashboard &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
              <li>Add variable name: <code className="text-[#00E699] font-mono font-bold">DATABASE_URL</code></li>
              <li>Paste your Neon connection string (from <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="underline text-sky-300">console.neon.tech</a>).</li>
              <li>Redeploy. All tables are automatically created on first request!</li>
            </ol>
          </div>

          {/* Hostinger Guide */}
          <div className="p-4 rounded-xl bg-slate-100 text-[#021936] space-y-2.5 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">🟣 Hostinger Node.js Deployment</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] font-mono text-slate-700">
                Full-Stack Node.js
              </span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed">
              <li>In Hostinger hPanel, create a <strong>Node.js Application</strong> (Node v20+).</li>
              <li>Upload or Git pull the project files.</li>
              <li>Build command: <code className="bg-white px-1.5 py-0.5 rounded border font-mono">npm run build</code></li>
              <li>Start command: <code className="bg-white px-1.5 py-0.5 rounded border font-mono">npm start</code></li>
              <li>In the <strong>Environment Variables</strong> tab, set <code className="font-bold font-mono">DATABASE_URL</code> to your Neon DB URL.</li>
            </ol>
          </div>

          {/* Variable Copy Button */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700">info</span>
              <span>Need the connection string format template?</span>
            </div>
            <button
              onClick={handleCopyEnv}
              className="py-1.5 px-3 rounded bg-[#904d00] hover:bg-[#B45309] text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copiedVar ? 'Copied!' : 'Copy Template'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
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
