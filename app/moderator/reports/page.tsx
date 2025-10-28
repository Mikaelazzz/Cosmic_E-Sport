"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ModeratorLayout from '@/components/ModeratorLayout';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Alert } from '@heroui/alert';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Custom hook for responsive design
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile };
};

// Custom icons
const IconDownload = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg>
);

const IconChart = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zM1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
  </svg>
);

const IconCalendar = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5 0zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
  </svg>
);

const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002A.274.274 0 0 1 15 13H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
  </svg>
);

// Types
interface ReportData {
  attendanceStats: {
    totalMeetings: number;
    totalAttendance: number;
    averageAttendance: number;
    attendanceRate: number;
  };
  monthlyData: Array<{
    month: string;
    meetings: number;
    attendance: number;
    averageAttendance: number;
    attendanceRate: number;
  }>;
  attendanceByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  topicAnalysis: Array<{
    topic: string;
    meetings: number;
    totalAttendance: number;
    averageAttendance: number;
    attendanceRate: number;
    expectedAttendance: number;
  }>;
  weeklyAttendance: Array<{
    week: string;
    hadir: number;
    terlambat: number;
    tidak_hadir: number;
    total: number;
    meetings: number;
    meetingDetails?: Array<{
      topik: string;
      hari: string;
      tanggal: string;
      waktu?: string;
    }>;
  }>;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  status: string;
  period: string;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ModeratorReportsPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    status: 'all',
    period: '30'
  });

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    description: string;
    color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary';
  }>({
    show: false,
    title: '',
    description: '',
    color: 'primary'
  });

  // Show alert function
  const showAlert = (title: string, description: string, color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary' = 'primary') => {
    setAlertConfig({
      show: true,
      title,
      description,
      color
    });
    setTimeout(() => {
      setAlertConfig(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      queryParams.append('period', filters.period);

      const response = await fetch(`/api/moderator/reports?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
      } else {
        showAlert('Error!', 'Gagal mengambil data laporan', 'danger');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil data laporan', 'danger');
    }
  }, [filters]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Set default date range to last 30 days if not set
      if (!filters.startDate || !filters.endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setFilters(prev => ({
          ...prev,
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
      } else {
        await fetchReportData();
      }
      
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchReportData]);

  // Handle filter change
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchReportData();
  };

  // Download PDF report
  const downloadPDFReport = async () => {
    if (!reportData) return;

    setDownloadLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      queryParams.append('period', filters.period);

      const response = await fetch(`/api/moderator/reports/pdf?${queryParams.toString()}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-pertemuan-${filters.startDate}-to-${filters.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Success!', 'Laporan PDF berhasil didownload', 'success');
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showAlert('Error!', 'Gagal mendownload laporan PDF', 'danger');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <ModeratorLayout
      title="Laporan & Analytics"
      description="Analisis data kehadiran dan pertemuan organisasi"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Button
          color="primary"
          variant="solid"
          startContent={<IconDownload className="w-4 h-4" />}
          onPress={downloadPDFReport}
          isLoading={downloadLoading}
          className="w-full sm:w-auto"
        >
          Download PDF
        </Button>
      </div>

        {/* Alert */}
        {alertConfig.show && (
          <Alert
            color={alertConfig.color}
            title={alertConfig.title}
            description={alertConfig.description}
            className="mb-6"
          />
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <IconChart className="w-5 h-5" />
              Filter Laporan
            </h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="date"
                label="Tanggal Mulai"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
              <Input
                type="date"
                label="Tanggal Akhir"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
              <Select
                label="Status Pertemuan"
                selectedKeys={[filters.status]}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] as string)}
                className="w-full"
              >
                <SelectItem key="all">Semua Status</SelectItem>
                <SelectItem key="belum_mulai">Belum Mulai</SelectItem>
                <SelectItem key="berlangsung">Berlangsung</SelectItem>
                <SelectItem key="selesai">Selesai</SelectItem>
                <SelectItem key="dibatalkan">Dibatalkan</SelectItem>
              </Select>
              <Select
                label="Periode"
                selectedKeys={[filters.period]}
                onSelectionChange={(keys) => handleFilterChange('period', Array.from(keys)[0] as string)}
                className="w-full"
              >
                <SelectItem key="7">7 Hari Terakhir</SelectItem>
                <SelectItem key="30">30 Hari Terakhir</SelectItem>
                <SelectItem key="90">3 Bulan Terakhir</SelectItem>
                <SelectItem key="180">6 Bulan Terakhir</SelectItem>
                <SelectItem key="365">1 Tahun Terakhir</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-lg">Memuat laporan...</span>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardBody className="text-center">
                  <IconCalendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {reportData.attendanceStats.totalMeetings}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Pertemuan</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardBody className="text-center">
                  <IconUsers className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {reportData.attendanceStats.totalAttendance}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Total Kehadiran</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardBody className="text-center">
                  <IconChart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {reportData.attendanceStats.averageAttendance.toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Rata-rata Kehadiran</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardBody className="text-center">
                  <IconChart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {reportData.attendanceStats.attendanceRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Tingkat Kehadiran</p>
                </CardBody>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-8 xl:grid-cols-2 mb-8">
              {/* Monthly Attendance Trend */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg sm:text-xl font-semibold">Tren Kehadiran Bulanan</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                  <div className="w-full h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 10 }}
                          label={{ value: 'Jumlah', angle: -90, position: 'insideLeft', fontSize: 10 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10 }}
                          label={{ value: 'Rate (%)', angle: 90, position: 'insideRight', fontSize: 10 }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                  <p className="font-semibold mb-2">{data.month}</p>
                                  <p className="text-sm text-blue-600">Pertemuan: {data.meetings}</p>
                                  <p className="text-sm text-green-600">Kehadiran: {data.attendance}</p>
                                  <p className="text-sm text-purple-600">Rata-rata: {data.averageAttendance.toFixed(1)}</p>
                                  <p className="text-sm text-orange-600 font-bold">Rate: {data.attendanceRate.toFixed(1)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="meetings" 
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          name="Jumlah Pertemuan"
                          dot={{ r: 4 }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="attendance" 
                          stroke={COLORS.success} 
                          strokeWidth={2}
                          name="Total Kehadiran"
                          dot={{ r: 4 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="attendanceRate" 
                          stroke={COLORS.warning} 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Tingkat Kehadiran (%)"
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Attendance by Status (Pie Chart) */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg sm:text-xl font-semibold">Distribusi Status Kehadiran</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                  <div className="w-full h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.attendanceByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ payload }: any) => {
                            const labelName = payload?.status ?? payload?.name ?? '';
                            const pct = typeof payload?.percentage === 'number'
                              ? payload.percentage
                              : typeof payload?.percent === 'number'
                                ? payload.percent * 100
                                : 0;
                            return `${labelName} (${pct.toFixed(1)}%)`;
                          }}
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {reportData.attendanceByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Weekly Attendance Pattern */}
            <Card className="mb-8">
              <CardHeader>
                <h3 className="text-lg sm:text-xl font-semibold">Pola Kehadiran Mingguan (4 Minggu Terakhir)</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="w-full h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.weeklyAttendance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Jumlah', angle: -90, position: 'insideLeft', fontSize: 10 }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const totalValid = data.hadir + data.terlambat;
                            const percentage = data.total > 0 ? ((totalValid / data.total) * 100).toFixed(1) : '0';
                            return (
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
                                <p className="font-semibold mb-2">{data.week}</p>
                                
                                {/* Meeting Details */}
                                {data.meetingDetails && data.meetingDetails.length > 0 && (
                                  <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Pertemuan:</p>
                                    {data.meetingDetails.map((meeting: any, idx: number) => (
                                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1 pl-2">
                                        <p className="font-medium">{meeting.topik}</p>
                                        <p>{meeting.hari}, {meeting.tanggal}</p>
                                        {meeting.waktu && <p>Pukul {meeting.waktu}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {data.meetings === 0 && (
                                  <p className="text-xs text-gray-500 mb-2 italic">Tidak ada pertemuan minggu ini</p>
                                )}
                                
                                <p className="text-sm text-green-600">✓ Hadir: {data.hadir}</p>
                                <p className="text-sm text-yellow-600">⚠ Terlambat: {data.terlambat}</p>
                                <p className="text-sm text-red-600">✗ Tidak Hadir: {data.tidak_hadir}</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-bold mt-2 pt-2 border-t">
                                  Total: {data.total} ({percentage}% hadir)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="hadir" stackId="a" fill={COLORS.success} name="Hadir" />
                      <Bar dataKey="terlambat" stackId="a" fill={COLORS.warning} name="Terlambat" />
                      <Bar dataKey="tidak_hadir" stackId="a" fill={COLORS.danger} name="Tidak Hadir" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Topic Analysis - Responsive Layout */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Analisis Berdasarkan Topik Pertemuan</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Topik Pertemuan</th>
                        <th className="text-center py-3 px-4">Jumlah Pertemuan</th>
                        <th className="text-center py-3 px-4">Total Kehadiran</th>
                        <th className="text-center py-3 px-4">Rata-rata Kehadiran</th>
                        <th className="text-center py-3 px-4">Tingkat Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topicAnalysis.map((topic, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 font-medium">{topic.topic}</td>
                          <td className="py-3 px-4 text-center">{topic.meetings}</td>
                          <td className="py-3 px-4 text-center">
                            {topic.totalAttendance} / {topic.expectedAttendance}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {topic.averageAttendance.toFixed(1)} orang
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Chip
                              color={topic.attendanceRate >= 70 ? 'success' : 
                                     topic.attendanceRate >= 50 ? 'warning' : 'danger'}
                              size="sm"
                              variant="flat"
                            >
                              {topic.attendanceRate.toFixed(1)}%
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {reportData.topicAnalysis.map((topic, index) => (
                    <Card key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          {/* Topic Title */}
                          <div className="border-b border-gray-200 dark:border-gray-600 pb-2">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                              {topic.topic}
                            </h4>
                          </div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {topic.meetings}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Jumlah Pertemuan
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {topic.totalAttendance}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                / {topic.expectedAttendance}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Kehadiran
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {topic.averageAttendance.toFixed(1)}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Rata-rata Kehadiran
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <div className="mb-1">
                                <Chip
                                  color={topic.attendanceRate >= 70 ? 'success' : 
                                         topic.attendanceRate >= 50 ? 'warning' : 'danger'}
                                  size="md"
                                  variant="flat"
                                >
                                  {topic.attendanceRate.toFixed(1)}%
                                </Chip>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tingkat Kehadiran
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {/* No Data State */}
        {!loading && !reportData && (
          <Card>
            <CardBody className="text-center py-12">
              <IconChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Tidak Ada Data</h3>
              <p className="text-gray-600">
                Tidak ada data pertemuan pada rentang tanggal yang dipilih.
                Silakan ubah filter dan coba lagi.
              </p>
            </CardBody>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Reports & Analytics • Moderator Dashboard
          </p>
        </div>
    </ModeratorLayout>
  );
}
