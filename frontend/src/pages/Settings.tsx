import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

type UserSettings = {
  id: string;
  email: string;
  emailNotifications: boolean;
  slackWebhook?: string;
  slackNotifications: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  theme: 'light' | 'dark' | 'system';
};

const Settings: React.FC = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const res = await api.get<{ data: UserSettings }>('/user/settings');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg">
        {/* Notification Settings */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive alerts and reports via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings?.emailNotifications}
                  onChange={() => {/* TODO: Toggle email notifications */}}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Slack Notifications</h3>
                <p className="text-sm text-gray-500">Send alerts to Slack channel</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings?.slackNotifications}
                  onChange={() => {/* TODO: Toggle slack notifications */}}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {settings?.slackNotifications && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Slack Webhook URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={settings.slackWebhook || ''}
                  onChange={() => {/* TODO: Update slack webhook */}}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Report Settings */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Frequency</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={settings?.reportFrequency}
                onChange={() => {/* TODO: Update report frequency */}}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={settings?.timezone}
                onChange={() => {/* TODO: Update timezone */}}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={settings?.theme}
              onChange={() => {/* TODO: Update theme */}}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => {/* TODO: Save settings */}}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
