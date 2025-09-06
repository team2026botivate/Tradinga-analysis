import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import Footer from './Footer';
import { fetchUserProfileFromSheet } from '../lib/sheets';

interface SettingsProps {
  userEmail: string | null;
  userName: string | null;
}

const Settings: React.FC<SettingsProps> = ({ userEmail, userName }) => {
  const [name, setName] = useState<string | null>(userName ?? null);
  const [email, setEmail] = useState<string | null>(userEmail ?? null);

  useEffect(() => {
    const ssEmail = email ?? sessionStorage.getItem('auth_email');
    const ssName = name ?? sessionStorage.getItem('auth_name');
    if (!email && ssEmail) setEmail(ssEmail);
    if (!name && ssName) setName(ssName);
    // If still no name but we have email, fetch from GAS
    if ((!name && (ssName == null || ssName === '')) && ssEmail) {
      fetchUserProfileFromSheet(ssEmail)
        .then((res) => {
          if (res?.success && res.name) {
            setName(res.name);
            sessionStorage.setItem('auth_name', res.name);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your profile</p>
        </div>
      </div>

      {/* Profile only */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{name || "User"}</h3>
              <p className="text-slate-600">{email || "Not logged in"}</p>
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Change Photo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                defaultValue={(name || '').split(' ')[0] || ""}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                defaultValue={(name || '').split(' ').slice(1).join(' ') || ""}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue={email || ""}
                readOnly
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                defaultValue=""
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              rows={4}
              defaultValue="Experienced trader focused on technology stocks and cryptocurrency markets."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;