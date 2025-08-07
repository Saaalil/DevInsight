import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type ReportData = {
  labels: string[];
  data: number[];
};

type RepositoryStats = {
  repositoryId: string;
  repositoryName: string;
  totalCommits: number;
  contributors: number;
  pullRequests: number;
  mergeRate: number;
};

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [reportType, setReportType] = useState<'commits' | 'pullRequests'>('commits');

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['activity', timeRange, reportType],
    queryFn: async () => {
      const res = await api.get<{ data: ReportData }>(`/reports/${reportType}?range=${timeRange}`);
      return res.data.data;
    }
  });

  const { data: repositoryStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['repositoryStats'],
    queryFn: async () => {
      const res = await api.get<{ data: RepositoryStats[] }>('/reports/repository-stats');
      return res.data.data;
    }
  });

  const activityChartData = {
    labels: activityData?.labels ?? [],
    datasets: [
      {
        label: reportType === 'commits' ? 'Commits' : 'Pull Requests',
        data: activityData?.data ?? [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const repositoryChartData = {
    labels: (repositoryStats as RepositoryStats[] | undefined)?.map((stat: RepositoryStats) => stat.repositoryName) ?? [],
    datasets: [
      {
        label: 'Total Commits',
        data: (repositoryStats as RepositoryStats[] | undefined)?.map((stat: RepositoryStats) => stat.totalCommits) ?? [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Pull Requests',
        data: (repositoryStats as RepositoryStats[] | undefined)?.map((stat: RepositoryStats) => stat.pullRequests) ?? [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  if (isActivityLoading || isStatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>
      
      {/* Activity Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Activity Overview</h2>
          <div className="flex gap-4">
            <select
              className="border rounded px-3 py-1"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'commits' | 'pullRequests')}
            >
              <option value="commits">Commits</option>
              <option value="pullRequests">Pull Requests</option>
            </select>
            <select
              className="border rounded px-3 py-1"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        <Line data={activityChartData} />
      </div>

      {/* Repository Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Repository Statistics</h2>
        <div className="h-96">
          <Bar 
            data={repositoryChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
        
        {/* Repository Stats Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repository</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pull Requests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merge Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(repositoryStats as RepositoryStats[] | undefined)?.map((stat) => (
                <tr key={stat.repositoryId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.repositoryName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.totalCommits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.contributors}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.pullRequests}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.mergeRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
