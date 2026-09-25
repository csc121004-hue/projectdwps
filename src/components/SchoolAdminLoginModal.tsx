import React, { useState } from 'react';
import { SCHOOL_INFO } from '../data/schoolData';

interface SchoolAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; role: string; email: string }) => void;
}

export const SchoolAdminLoginModal: React.FC<SchoolAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // Clean invisible characters, zero-width spaces, and whitespace
      const cleanString = (str: string) =>
        (str || '').replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

      const normalizedId = cleanString(loginId).toLowerCase();
      let normalizedPw = cleanString(password);
      // Remove leading dash/hyphen if user copied "- rahul#dwps2026"
      if (normalizedPw.startsWith('-')) {
        normalizedPw = cleanString(normalizedPw.substring(1));
      }

      // Valid IDs: Rahul@dwpsballabgarh.org, username rahul, or user email
      const isValidId =
        normalizedId === 'rahul@dwpsballabgarh.org' ||
        normalizedId === 'rahul@dwps' ||
        normalizedId === 'rahul' ||
        normalizedId === 'rahul@dwpsballabgarh' ||
        normalizedId === 'csc121004@gmail.com';

      // Valid Passwords: case-insensitive rahul#dwps2026, rahul@dwps2026, rahul2026, dwps#2026
      const isValidPassword =
        normalizedPw.toLowerCase() === 'rahul#dwps2026' ||
        normalizedPw.toLowerCase() === 'rahul@dwps2026' ||
        normalizedPw.toLowerCase() === 'rahul2026' ||
        normalizedPw.toLowerCase() === 'rahul#2026' ||
        normalizedPw === 'dwps#2026' ||
        normalizedPw === 'dwps2026';

      if (isValidId && isValidPassword) {
        const user = {
          name: 'Mr. Rahul Chaudhary',
          role: 'School Director / Administrator',
          email: 'Rahul@dwpsballabgarh.org',
        };
        if (rememberMe) {
          localStorage.setItem('dwps_admin_session', JSON.stringify(user));
        } else {
          localStorage.removeItem('dwps_admin_session');
        }
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('Galat ID ya Password. Kripya naye credentials darj karein ya neeche diye gaye "Auto Fill" button par click karein.');
      }
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#dce3ec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with School Crest */}
        <div className="bg-[#021936] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-md flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/dwps_logo.svg"
                alt="DWPS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#904d00] text-white inline-block">
                Staff &amp; Admin Portal
              </span>
              <h3 className="text-xl font-bold font-serif text-white mt-0.5">
                School Management Login
              </h3>
              <p className="text-xs text-[#8396b9]">
                {SCHOOL_INFO.shortName} • Subhash Colony
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-Click Auto Fill Credentials Box */}
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-[#021936]">
                <span className="material-symbols-outlined text-amber-700 text-sm">vpn_key</span>
                <span>Authorized School Credentials</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                ID: <strong className="text-[#021936]">Rahul@dwpsballabgarh.org</strong>
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                Password: <strong className="text-[#021936]">rahul#dwps2026</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoginId('Rahul@dwpsballabgarh.org');
                setPassword('rahul#dwps2026');
                setErrorMsg('');
              }}
              className="px-3 py-1.5 bg-[#021936] hover:bg-[#904d00] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">touch_app</span>
              <span>Auto-Fill</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#021936] uppercase tracking-wider mb-1.5">
                Institutional Login ID
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  person
                </span>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Rahul@dwpsballabgarh.org"
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] focus:border-[#904d00] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#021936] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="rahul#dwps2026"
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-[#F2F8FD] border border-[#dce3ec] text-xs font-semibold text-[#021936] focus:border-[#904d00] focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#904d00] rounded cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <span className="text-[#904d00] text-[11px] font-semibold">
                Authorized Personnel Only
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#904d00] hover:bg-[#B45309] disabled:opacity-75 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  <span>Sign In to School Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-[#F2F8FD] p-3 text-center border-t border-[#dce3ec] text-[11px] text-slate-500">
          Official staff dashboard of Disney World Public School, Ballabgarh.
        </div>
      </div>
    </div>
  );
};
