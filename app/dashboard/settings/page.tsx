"use client"

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'profile' | 'notifications' | 'api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user } = useAuth();

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
    { key: 'api', label: 'API Keys', icon: 'key' },
  ];

  return (
    <div className="px-16 py-12 space-y-12">
      <section className="max-w-[960px] mx-auto">
        <div className="mb-12">
          <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Settings</h2>
          <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">
            Manage your account preferences and configuration.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-surface-container rounded-lg p-1 border border-outline-variant w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-label-md rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-surface-container border border-outline-variant p-8 rounded space-y-6">
            <h3 className="text-headline-md font-headline-md text-on-surface">Profile Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Email</label>
                <p className="text-body-md text-on-surface bg-surface border border-outline-variant rounded px-4 py-3">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Account ID</label>
                <p className="text-body-md text-on-surface bg-surface border border-outline-variant rounded px-4 py-3 font-data-mono text-data-mono">{user?.id || 'N/A'}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/30">
              <p className="text-label-sm text-on-surface-variant">Account settings management coming soon.</p>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-surface-container border border-outline-variant p-8 rounded">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Notification Preferences</h3>
            <p className="text-body-md text-body-md text-on-surface-variant">Notification settings coming soon.</p>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="bg-surface-container border border-outline-variant p-8 rounded">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-6">API Keys</h3>
            <p className="text-body-md text-body-md text-on-surface-variant">API key management coming soon.</p>
          </div>
        )}
      </section>
    </div>
  );
}
