import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

type AlertRule = {
  id: string;
  name: string;
  type: 'commit_frequency' | 'pull_request' | 'issue' | 'custom';
  condition: string;
  threshold: number;
  repositoryId: string;
  repositoryName: string;
  isEnabled: boolean;
  createdAt: string;
};

type Alert = {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  repositoryName: string;
  createdAt: string;
  isRead: boolean;
};

const AlertBadge: React.FC<{ severity: Alert['severity'] }> = ({ severity }) => {
  const colors = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const Alerts: React.FC = () => {
  const [showRules, setShowRules] = useState(true);

  const { data: rules, isLoading: isRulesLoading } = useQuery({
    queryKey: ['alertRules'],
    queryFn: async () => {
      const res = await api.get<{ data: AlertRule[] }>('/alerts/rules');
      return res.data.data;
    },
  });

  const { data: alerts, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await api.get<{ data: Alert[] }>('/alerts');
      return res.data.data;
    },
  });

  if (isRulesLoading || isAlertsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alerts & Monitoring</h1>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded ${
              showRules
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setShowRules(true)}
          >
            Alert Rules
          </button>
          <button
            className={`px-4 py-2 rounded ${
              !showRules
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setShowRules(false)}
          >
            Active Alerts
          </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => {/* TODO: Create new alert rule */}}
          >
            Create Rule
          </button>
        </div>
      </div>

      {showRules ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repository</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(rules as AlertRule[] | undefined)?.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.repositoryName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.condition} {rule.threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(rule.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => {/* TODO: Edit rule */}}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => {/* TODO: Delete rule */}}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {(alerts as Alert[] | undefined)?.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white p-4 rounded-lg shadow ${!alert.isRead ? 'border-l-4 border-indigo-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <AlertBadge severity={alert.severity} />
                  <h3 className="text-lg font-medium">{alert.ruleName}</h3>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {/* TODO: Mark as read */}}
                >
                  {alert.isRead ? 'Mark as unread' : 'Mark as read'}
                </button>
              </div>
              <p className="mt-2 text-gray-600">{alert.message}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>{alert.repositoryName}</span>
                <span className="mx-2">&middot;</span>
                <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
