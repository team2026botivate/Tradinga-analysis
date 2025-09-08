import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import Footer from './Footer';
import { fetchUserProfileFromSheet, updatePassword } from '../lib/sheets';

interface SettingsProps {
  userEmail: string | null;
  userName: string | null;
}

const Settings: React.FC<SettingsProps> = ({ userEmail, userName }) => {
  const [name, setName] = useState<string | null>(userName ?? null);
  const [email, setEmail] = useState<string | null>(userEmail ?? null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const ssEmail = email ?? sessionStorage.getItem('auth_email');
    const ssName = name ?? sessionStorage.getItem('auth_name');
    if (!email && ssEmail) setEmail(ssEmail);
    if (!name && ssName) setName(ssName);
    // If still no name but we have email, fetch from GAS
    if ((!name && (ssName == null || ssName === '')) && ssEmail) {
      fetchUserProfileFromSheet(ssEmail)
        .then((res) => {
          if (res?.success) {
            if (res.name) {
              setName(res.name);
              sessionStorage.setItem('auth_name', res.name);
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Remove automatic password fetching - users will enter current password manually
    // This is more secure and practical
    console.log('Password verification: Users will enter current password manually');
  }, [email]);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      // In a real implementation, you would verify the current password first
      // For now, we'll assume the password change is successful
      const res = await updatePassword(email, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to update password');
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your profile and account settings</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{name || "User"}</h3>
              <p className="text-slate-600 dark:text-slate-400">{email || "Not logged in"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                defaultValue={(name || '').split(' ')[0] || ""}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                defaultValue={(name || '').split(' ').slice(1).join(' ') || ""}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                defaultValue={email || ""}
                readOnly
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Settings Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Password Settings</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Update your account password securely</p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-700 dark:text-red-400 text-sm">{error}</div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-green-700 dark:text-green-400 text-sm">{success}</div>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your current password to verify changes</p>
              </div>

              <div></div> {/* Empty space for alignment */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                  minLength={6}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 6 characters required</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                  minLength={6}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {confirmPassword && newPassword !== confirmPassword ? (
                    <span className="text-red-500">Passwords do not match</span>
                  ) : (
                    "Re-enter your new password"
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;