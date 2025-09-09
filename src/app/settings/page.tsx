'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';

export default function SettingsPage() {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language || 'en';

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  // const checkAuth = useAuthStore((s) => s.checkAuth);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [form, setForm] = useState({
    email: '',
    nickname: '',
    phone: '',
    avatar: '',
    gender: '',
    birthday: '',
  });
  // store the selected File for upload
  const avatarFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // load user on mount if missing
  useEffect(() => {
    if (!user) {
      // checkAuth().catch(() => { });
    }
  }, []);

  // when user changes, populate form
  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        nickname: (user.nickname as string) || (user.name as string) || '',
        phone: (user.phone as string) || '',
        avatar: (user.avatar as string) || '',
        gender: user.gender != null ? String(user.gender) : '',
        birthday: (user.birthday as string) || '',
      });
    }
  }, [user]);

  const handleChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setSuccess(null);
    try {
      type UpdateProfilePayload = {
        nickname?: string;
        phone?: string;
        avatar?: string;
        gender?: number;
        birthday?: string;
      };

      const payload: UpdateProfilePayload = {
        nickname: form.nickname || undefined,
        phone: form.phone || undefined,
        avatar: form.avatar || undefined,
        gender: form.gender ? Number(form.gender) : undefined,
        birthday: form.birthday || undefined,
      };
      // if avatarFileRef has a File (not a data URL string), upload it first
      if (avatarFileRef.current) {
        try {
          const file = avatarFileRef.current;
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          // create filename safe
          const ext = (file.type.split('/')[1] || 'png').split('+')[0];
          const filename = `avatar_${Date.now()}.${ext}`;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, data: dataUrl }),
          });
          const json = await res.json();
          if (json.url) payload.avatar = json.url;
        } catch (err) {
          console.error('avatar upload failed', err);
        }
      }
      const res = await updateProfile(payload, false);
      setSuccess(t('settings.save') ? `${t('settings.save')} ✅` : 'Saved ✅');
    } catch (err) {
      // error is stored in auth store; we also show it below
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setPasswordLoading(true);
      const result = await changePassword({
        oldPassword: passwordForm.oldPassword,
        password: passwordForm.newPassword,
      });
      setPasswordSuccess(result || 'Password changed successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto w-[90vw] py-8 ">
      <h1 className="text-2xl font-bold mb-4">{t('settings.title') || 'Settings'}</h1>

      <section className="bg-black/70 rounded-md ">

        <h2 className="text-lg font-semibold mb-3">{t('profile.personalInfo') || 'Profile'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid h-[90vh] md:h-full  w-full md:grid-cols-[50%_50%] md:grid-rows-1 grid-cols-1 grid-rows-[30%_70%] overflow-hidden">
            <div className="bg-black w-[90vw] md:w-full order-last md:order-first flex md:pr-40 pb-12 mx-auto overflow-visible flex-col">
              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('auth.email') || 'Email'}</label>
                <input readOnly value={form.email} className="w-full px-3 py-2 bg-gray-800 rounded text-gray-200 mb-2" />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">{t('auth.phone') || 'Phone'}</label>
                <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-3 py-2 bg-gray-900 rounded text-white mb-2" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                 
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      avatarFileRef.current = f;
                      // preview immediately as data URL
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          handleChange('avatar', reader.result);
                        }
                      };
                      reader.readAsDataURL(f);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{t('common.gender') || 'Gender'}</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full px-3 py-2 bg-gray-900 rounded text-white mb-2">
                    <option value="">--</option>
                    <option value="0">{t('common.male') || 'Male'}</option>
                    <option value="1">{t('common.female') || 'Female'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{t('profile.birthday') || 'Birthday'}</label>
                  <input type="date" value={form.birthday} onChange={(e) => handleChange('birthday', e.target.value)} className="w-full px-3 py-2 bg-gray-900 rounded text-white mb-2" />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button type="submit" disabled={localLoading || isLoading} className="bg-[#fbb033] px-4 py-2 rounded disabled:opacity-60 w-full">
                  {localLoading || isLoading ? (t('common.loading') || 'Loading...') : (t('common.save') || 'Save')}
                </button>
                {success && <span className="text-green-400">{success}</span>}
                {error && <span className="text-red-400">{error}</span>}
              </div>
            </div>
            <div className="relative flex order-first md:order-last justify-center items-center flex-col">
              {form.avatar ? (
                <Image onClick={() => fileInputRef.current?.click()} src={form.avatar} alt={form.nickname || "avatar"} width={30} height={30} className="w-30 h-30 lg:w-50 lg:h-50 rounded-full mr-2 object-cover cursor-pointer" />
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="h-30 w-30 mr-2 rounded-full bg-[#fbb033] text-black flex items-center justify-center font-semibold text-7xl cursor-pointer">
                  {form.nickname ? form.nickname.split(' ')
                    .map(part => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(): 'U'}
                </div>
              )}
              
              <div>
                <input value={form.nickname} onChange={(e) => handleChange('nickname', e.target.value)} className="w-full px-3 mt-2 py-2 rounded text-white text-center focus:outline-none border-b-1 focus:border-[#fbb033]" />
              </div>
            </div>
          </div>

        </form>
      </section>

      <section className="bg-black/70 p-6 rounded-md max-w-xl mt-6">
        <h2 className="text-lg font-semibold mb-3">{t('settings.changePassword') || 'Change Password'}</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">{t('auth.currentPassword') || 'Current Password'}</label>
            <input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-900 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{t('auth.newPassword') || 'New Password'}</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-900 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{t('auth.confirmPassword') || 'Confirm New Password'}</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-900 rounded text-white"
              required
            />
          </div>
          {passwordError && <div className="text-red-400 text-sm">{passwordError}</div>}
          {passwordSuccess && <div className="text-green-400 text-sm">{passwordSuccess}</div>}
          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-[#fbb033] px-4 py-2 rounded disabled:opacity-60 hover:bg-orange-600 transition-colors"
          >
            {passwordLoading ? (t('common.loading') || 'Loading...') : (t('settings.changePassword') || 'Change Password')}
          </button>
        </form>
      </section>

      <section className="bg-black/70 p-6 rounded-md max-w-xl mt-6">
        <h2 className="text-lg font-semibold mb-2">{t('settings.language') || 'Language'}</h2>
        <p className="text-sm text-gray-400 mb-4">{t('settings.current') ? `${t('settings.current')}: ${currentLang}` : `Current: ${currentLang}`}</p>

        <div className="mb-4">
          <LanguageSwitcher />
        </div>

        <p className="text-xs text-gray-500 mb-6">{t('settings.hint') || 'Your language preference is saved locally.'}</p>
      </section>
    </div>
  );
}
