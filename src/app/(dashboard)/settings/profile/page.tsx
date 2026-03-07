'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, User, Mail, Lock, Shield, CreditCard, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Subscription info
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();

      if (res.ok && data.user) {
        setFullName(data.user.full_name || '');
        setEmail(data.user.email || '');
        setAvatarUrl(data.user.avatar_url || '');
        setSubscription(data.subscription || null);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Profile updated!');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Password changed successfully!');
        setShowPasswordSection(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Account deleted');
        window.location.href = '/';
      } else {
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-dark-400 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Personal Information</h3>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary-400">
                {fullName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-medium">{fullName || 'No name set'}</p>
            <p className="text-dark-400 text-sm">{email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input pl-11"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="email"
                value={email}
                disabled
                className="input pl-11 opacity-60 cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>
            <p className="text-dark-500 text-sm mt-1">Email cannot be changed</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Password</h3>
              <p className="text-dark-400 text-sm">Change your account password</p>
            </div>
          </div>
          {!showPasswordSection && (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="btn btn-secondary btn-sm"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordSection && (
          <div className="space-y-4 pt-4 border-t border-dark-800">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-400"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="Enter new password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-400"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-dark-500 text-sm mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="btn btn-primary"
              >
                {changingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Subscription</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Current Plan</p>
              <p className="text-white font-medium capitalize">{subscription.plan || 'Starter'}</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Status</p>
              <p className={`font-medium capitalize ${
                subscription.status === 'active' ? 'text-emerald-400' :
                subscription.status === 'trialing' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {subscription.status || 'Trialing'}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Messages Used</p>
              <p className="text-white font-medium">
                {subscription.messages_used || 0} / {subscription.messages_limit || 25}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Trial Ends</p>
              <p className="text-white font-medium">
                {subscription.trial_end ? new Date(subscription.trial_end).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <a href="/settings/billing" className="btn btn-secondary w-full">
              Manage Billing
            </a>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Danger Zone</h3>
            <p className="text-dark-400 text-sm">Irreversible actions</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 w-full"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 font-medium mb-2">Are you sure?</p>
            <p className="text-dark-400 text-sm mb-4">
              This will permanently delete your account, workspace, all leads, and data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Yes, Delete My Account'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
