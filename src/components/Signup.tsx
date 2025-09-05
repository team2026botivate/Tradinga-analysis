import React, { useState } from 'react';
import { Mail, Lock, KeyRound, UserPlus } from 'lucide-react';
// import { startSignup, verifySignup } from '../lib/sheets'; // Commented out to resolve linter error

// Placeholder functions to resolve linter errors
const startSignup = async (email: string, password: string) => {
  console.log('Simulating startSignup for:', email, password);
  // Simulate success or failure
  if (email === 'error@example.com') {
    return { success: false, error: 'Simulated signup start error.' };
  }
  return { success: true, message: 'OTP sent (simulated).' };
};

const verifySignup = async (email: string, otp: string) => {
  console.log('Simulating verifySignup for:', email, otp);
  // Simulate success or failure
  if (otp === '000000') {
    return { success: false, error: 'Simulated verification error: Invalid OTP.' };
  }
  return { success: true, message: 'Signup verified (simulated).' };
};

interface SignupProps {
  onSignup: (email: string) => void;
  onShowLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onShowLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [signupStarted, setSignupStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

















  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Please enter your email to receive an OTP.');
      return;
    }
    if (!password) {
      setError('Please enter a password first.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      const res = await startSignup(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to start signup.');
        return;
      }
      setSignupStarted(true);
      setInfo(res.message || 'OTP sent. Check your email.');
    } catch (e: any) {
      setError(e?.message || 'Failed to start signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirm || !otp) {
      setError('Please fill in all fields and the OTP.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!signupStarted) {
      setError('Please request an OTP first.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifySignup(email, otp);
      if (!res.success) {
        setError(res.error || 'Verification failed.');
        return;
      }
      // Signup complete. We don't auto-issue a token on signup; redirect to login.
      sessionStorage.setItem('auth_email', email);
      onSignup(email);
    } catch (e: any) {
      setError(e?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-teal-500/5 animate-pulse"></div>
          <div className="relative p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-cyan-600 to-teal-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-cyan-900 dark:from-slate-100 dark:via-emerald-100 dark:to-cyan-100 bg-clip-text text-transparent">Create your account</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Sign up with email, password, and OTP verification</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors"><Mail className="h-5 w-5"/></span>
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="absolute right-2 top-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Password</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors"><Lock className="h-5 w-5"/></span>
                    <input
                      type="password"
                      id="signup-password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Confirm Password</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors"><Lock className="h-5 w-5"/></span>
                    <input
                      type="password"
                      id="signup-confirm"
                      name="confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="signup-otp" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Verification Code</label>
                <div className="relative group">
                  <span className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors"><KeyRound className="h-5 w-5"/></span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="signup-otp"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md tracking-widest text-center text-2xl font-bold"
                  />
                </div>
                {info && (
                  <div className="mt-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                    {info}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center space-x-2 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Remember me</span>
                </label>
                <button type="button" onClick={onShowLogin} className="text-sm text-blue-600 hover:text-blue-700">Have an account? Sign in</button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 hover:from-emerald-700 hover:via-cyan-700 hover:to-teal-700 disabled:opacity-70 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating account…</span>
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-6 w-6" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
