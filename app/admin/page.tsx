"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Spinner } from '@heroui/spinner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import AdminLayout from '@/components/AdminLayout';

interface AdminStats {
  totalMembers: number;
  totalEvents: number;
  totalPengurus: number;
  totalPrestasi: number;
  totalTeams: number;
  pengurusBreakdown?: {
    active: number;
    notRegistered: number;
    total: number;
  };
  chartData: Array<{
    date: string;
    newMembers: number;
    totalMembers: number;
    label: string;
  }>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching admin stats:', err);
  } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Kelola dan pantau seluruh aktivitas organisasi dari satu tempat."
    >
      {/* <div className="flex justify-end mb-4">
        <Button 
          color="danger" 
          variant="ghost"
          onPress={logout}
        >
          Logout
        </Button>
      </div> */}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-red-500">Error: {error}</p>
            <Button 
              color="primary" 
              size="sm" 
              className="mt-2"
              onPress={fetchAdminStats}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Dashboard Content */}
      {stats && !loading && (
        <>
          {/* Statistics Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6 md:mb-8">
            {/* Total Members */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardHeader className="pb-2">
                <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">Total Anggota</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.totalMembers}</p>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Anggota terdaftar</p>
              </CardBody>
            </Card>

            {/* Total Events */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Total Event</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">{stats.totalEvents}</p>
                <p className="text-sm text-green-600 dark:text-green-400">Event tersedia</p>
              </CardBody>
            </Card>

            {/* Total Pengurus */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Total Pengurus</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{stats.totalPengurus}</p>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {stats.pengurusBreakdown ? (
                    <div className="space-y-1">
                      <div>{stats.pengurusBreakdown.active} Aktif</div>
                      <div>{stats.pengurusBreakdown.notRegistered} Belum Terdaftar</div>
                    </div>
                  ) : (
                    <p>Pengurus aktif</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Total Prestasi */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-300">Total Prestasi</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">{stats.totalPrestasi}</p>
                <p className="text-sm text-orange-600 dark:text-orange-400">Prestasi dicapai</p>
              </CardBody>
            </Card>

            {/* Total Teams */}
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
              <CardHeader className="pb-2">
                <h3 className="text-base sm:text-lg font-semibold text-cyan-700 dark:text-cyan-300">Total Team</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-cyan-800 dark:text-cyan-200">{stats.totalTeams || 0}</p>
                <p className="text-xs sm:text-sm text-cyan-600 dark:text-cyan-400">Team terdaftar</p>
              </CardBody>
            </Card>
          </div>

          {/* Member Registration Chart */}
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-xl font-semibold">Grafik Pendaftaran Anggota Baru (30 Hari Terakhir)</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `Tanggal: ${new Date(data.date).toLocaleDateString('id-ID')}`;
                        }
                        return label;
                      }}
                      formatter={(value: number, name: string) => {
                        const labels = {
                          newMembers: 'Anggota Baru',
                          totalMembers: 'Total Anggota'
                        };
                        return [value, labels[name as keyof typeof labels] || name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="newMembers" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Anggota Baru"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalMembers" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Total Anggota"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Management Tools */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Info Card */}
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <h3 className="text-xl font-semibold">Welcome, {user?.nama_lengkap}</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>NIM:</strong> {user?.nim}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selamat datang di dashboard admin. Anda dapat mengelola seluruh aspek organisasi dari sini.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Button 
                    color="primary" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/admin/pengurus'}
                  >
                    Kelola Pengurus
                  </Button>
                  <Button 
                    color="secondary" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/admin/prestasi'}
                  >
                    Kelola Prestasi
                  </Button>
                  <Button 
                    color="success" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/admin/periode'}
                  >
                    Kelola Periode
                  </Button>
                  <Button 
                    color="warning" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/admin/pengurus/history'}
                  >
                    History Pengurus
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}