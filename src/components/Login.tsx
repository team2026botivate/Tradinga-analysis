import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Hash, LogIn, TimerReset } from 'lucide-react';
import { sendOtp, verifyOtp } from '../lib/sheets';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState<number>(0);
  

  // basic email format check
  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const handleSend = async () => {
    setError(null);
    setInfo(null);
    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      const res = await sendOtp(email, { timeoutMs: 12000 });
      if (!res.success) {
        setError(res.error || 'Failed to send OTP. Please try again.');
        return;
      }
      setInfo(res.message || 'OTP sent. Check your email.');
      setStep('code');
      setResendIn(30); // align with backend rate limit window
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const codeTrim = code.trim();
    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }
    if (!/^[0-9]{6}$/.test(codeTrim)) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const res = await verifyOtp(email, codeTrim, { timeoutMs: 12000 });
      if (!res.success) {
        if (typeof (res as any).attemptsLeft === 'number') {
          setError(`${res.error || 'Invalid OTP'}. Attempts left: ${(res as any).attemptsLeft}`);
        } else {
          setError(res.error || 'Invalid OTP');
        }
        return;
      }
      // Store session info: email and optional name from backend
      sessionStorage.setItem('auth_email', email);
      if (res.name) sessionStorage.setItem('auth_name', res.name);
      // For remember me, persist a simple flag token to keep existing app checks working
      if (remember) {
        localStorage.setItem('auth_token', 'ok');
      } else {
        sessionStorage.setItem('auth_token', 'ok');
      }
      onLogin(email);
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 animate-pulse"></div>
          <div className="relative p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">Welcome back</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Sign in to continue to your trading dashboard</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5" autoComplete="on">
              {/* OTP-only mode (password login removed) */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors"><Mail className="h-5 w-5"/></span>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Password flow removed */}

              {step === 'code' && (
                <div>
                  <label htmlFor="login-otp" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Verification Code</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors"><Hash className="h-5 w-5"/></span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="login-otp"
                      name="otp"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md tracking-widest text-center text-2xl font-bold"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Didn't receive the code?</span>
                    <button
                      type="button"
                      disabled={loading || resendIn > 0}
                      onClick={handleSend}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:text-slate-400 disabled:hover:bg-transparent transition-all duration-200 font-semibold"
                    >
                      <TimerReset className="h-4 w-4"/>
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium text-sm">
                  {error}
                </div>
              )}
              {info && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                  {info}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center space-x-2 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setInfo(null);
                    setError(null);
                  }}
                >
                  Use another email
                </button>
              </div>

              {step === 'email' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSend}
                  className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-70 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending code…</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-6 w-6" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 disabled:opacity-70 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying…</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-6 w-6" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
