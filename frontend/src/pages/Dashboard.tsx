import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const { data: commits, isLoading: isCommitsLoading } = useQuery({
    queryKey: ['commits'],
    queryFn: async () => {
      const res = await api.get<{ data: { labels: string[]; data: number[] } }>('/reports/commits');
      return res.data.data;
    }
  });

  const { data: repositories, isLoading: isReposLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const res = await api.get<{
        data: Array<{
          id: string;
          name: string;
          commits: number;
          updatedAt: string;
          isActive: boolean;
        }>
      }>('/repositories');
      return res.data.data;
    }
  });

  type Repository = {
    id: string;
    name: string;
    commits: number;
    updatedAt: string;
    isActive: boolean;
  };

  const commitData = {
    labels: commits?.labels ?? [],
    datasets: [
      {
        label: 'Commits',
        data: commits?.data ?? [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const repoData = {
    labels: (repositories as Repository[] | undefined)?.map(repo => repo.name) ?? [],
    datasets: [
      {
        data: (repositories as Repository[] | undefined)?.map(repo => repo.commits) ?? [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  if (isCommitsLoading || isReposLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded">
              <p className="text-sm text-indigo-600">Total Repositories</p>
              <p className="text-2xl font-bold">{(repositories as Repository[] | undefined)?.length ?? 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Total Commits</p>
              <p className="text-2xl font-bold">
                {(repositories as Repository[] | undefined)?.reduce((acc: number, repo: Repository) => acc + repo.commits, 0) ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Commit Activity</h2>
          <Line data={commitData} options={{ responsive: true }} />
        </div>

        {/* Repository Distribution */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Repository Distribution</h2>
          <div className="h-64">
            <Doughnut data={repoData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Recent Repositories */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Repositories</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Commits</th>
                  <th className="text-left py-2">Last Updated</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {((repositories as Repository[] | undefined) ?? []).slice(0, 5).map((repo: Repository) => (
                  <tr key={repo.id} className="border-b">
                    <td className="py-2">{repo.name}</td>
                    <td className="py-2">{repo.commits}</td>
                    <td className="py-2">{new Date(repo.updatedAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        repo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {repo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
