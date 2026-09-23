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
      const trimmedId = loginId.trim();
      const trimmedPassword = password.trim();

      // Authorized credential verification: ID = Rahul@dwps, Password = dwps#2026
      if (
        trimmedId.toLowerCase() === 'rahul@dwps' &&
        trimmedPassword === 'dwps#2026'
      ) {
        const user = {
          name: 'Mr. Rahul Chaudhary',
          role: 'School Director / Administrator',
          email: 'Rahul@dwps',
        };
        if (rememberMe) {
          localStorage.setItem('dwps_admin_session', JSON.stringify(user));
        }
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('Galat ID ya Password. Kripya sahi credentials darj karein (Invalid ID or Password).');
      }
    }, 450);
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
                  placeholder="Enter ID"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
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
