"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Alert } from '@heroui/react';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Pagination } from '@heroui/pagination';
import UserLayout from '@/components/UserLayout';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, TrendingUp, Award, BookOpen, AlertTriangle, CheckCircle, X } from "lucide-react";

interface Periode {
  id: number;
  nama: string;
  semester: string;
  tahun: string;
  status: string;
}

interface JadwalPertemuan {
  id: number;
  nama_topik: string;
  tanggal: string;
  hari: string;
  kelas: string;
  jam_mulai: string;
  jam_akhir: string;
  periode_id: number;
  periode: Periode;
}

interface AttendanceRecord {
  id: number;
  pertemuan_id: number;
  nim: string;
  status: string;
  jam: string;
  hari: string;
  created_at: string;
  jadwal_pertemuan: JadwalPertemuan;
}

interface Statistics {
  totalPertemuan: number;
  hadir: number;
  persenKehadiran: number;
}

interface HistoryData {
  user: {
    id: number;
    nim: string;
    nama: string;
  };
  history: AttendanceRecord[];
  statistics: Statistics;
  currentPeriod: {
    id: number;
    nama: string;
    semester: string;
    tahun: string;
  } | null;
}

export default function HistoryPertemuanPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriode, setFilterPeriode] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showAlert, setShowAlert] = useState(true);

  // Check localStorage on mount to see if alert was dismissed
  useEffect(() => {
    const alertDismissed = localStorage.getItem('historyAlertDismissed');
    if (alertDismissed === 'true') {
      setShowAlert(false);
    }
  }, []);

  useEffect(() => {
    if (user?.nim) {
      fetchHistoryData();
    }
  }, [user]);

  const handleCloseAlert = () => {
    setShowAlert(false);
    localStorage.setItem('historyAlertDismissed', 'true');
  };

  // Reset alert when user revisits (clear localStorage when needed)
  useEffect(() => {
    // Alert will show again on page refresh if localStorage is cleared
    // Or you can implement logic to reset after certain conditions
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/history?nim=${user?.nim}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError('Gagal mengambil data history');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWaktu = (jamMulai: string, jamAkhir: string) => {
    return `${jamMulai.substring(0, 5)} - ${jamAkhir.substring(0, 5)} WIB`;
  };

  const formatWaktuAbsen = (waktuAbsen: string) => {
    // waktuAbsen from 'jam' field is in format "HH:MM:SS"
    if (waktuAbsen && waktuAbsen.includes(':')) {
      return waktuAbsen.substring(0, 5); // Return HH:MM
    }
    // Fallback if it's a full timestamp
    const date = new Date(waktuAbsen);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): "success" | "danger" | "warning" | "default" => {
    switch (status) {
      case 'hadir':
        return 'success';
      case 'terlambat':
        return 'warning';
      case 'tidak_hadir':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hadir':
        return 'Hadir';
      case 'terlambat':
        return 'Terlambat';
      case 'tidak_hadir':
        return 'Tidak Hadir';
      default:
        return status;
    }
  };

  // Get unique periods from history
  const periods = data ? Array.from(
    new Set(
      data.history
        .filter(record => record.jadwal_pertemuan?.periode)
        .map(record => JSON.stringify({
          id: record.jadwal_pertemuan.periode.id,
          nama: record.jadwal_pertemuan.periode.nama,
          semester: record.jadwal_pertemuan.periode.semester,
          tahun: record.jadwal_pertemuan.periode.tahun
        }))
    )
  ).map(str => JSON.parse(str)) : [];

  // Filter history
  const filteredHistory = data?.history.filter(record => {
    const matchesSearch = record.jadwal_pertemuan?.nama_topik.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesPeriode = filterPeriode === 'all' || record.jadwal_pertemuan?.periode_id.toString() === filterPeriode;
    return matchesSearch && matchesStatus && matchesPeriode;
  }) || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPeriode]);

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  if (loading) {
    return (
      <UserLayout
        title="History Pertemuan"
        description="Lihat riwayat kehadiran pertemuan Anda"
      >
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout
        title="History Pertemuan"
        description="Lihat riwayat kehadiran pertemuan Anda"
      >
        <Alert color="danger" variant="faded" title="Error">
          {error}
        </Alert>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      title="History Pertemuan"
      description=""
    >
      {/* Alert Badge for Attendance Warning */}
      {showAlert && data && data.statistics.totalPertemuan > 0 && (
        <>
          {/* Critical Warning - Below 80% */}
          {data.statistics.persenKehadiran < 80 && (
            <div className="relative mb-6">
              <Alert 
                color="danger" 
                variant="faded" 
                className="border-2 border-danger pr-12"
                title="⚠️ PERINGATAN - Kehadiran Rendah!"
              >
                <div className="space-y-1">
                  <button
                    onClick={handleCloseAlert}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-danger-600 hover:text-danger-800 transition-colors p-1 rounded-full hover:bg-danger-100"
                    aria-label="Close alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <p className="font-semibold">
                    Kehadiran Anda : {data.statistics.persenKehadiran}% (Standar minimum: 80%)
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-0.5 ml-2 pr-8">
                    <li>Wajib hadir di semua pertemuan berikutnya</li>
                    <li>Risiko tidak mendapat poin KPKK jika tetap di bawah 80%</li>
                    <li>Hindari terlambat dan konsultasi dengan moderator jika ada kendala</li>
                  </ul>
                </div>
              </Alert>
            </div>
          )}

          {/* Warning - Exactly 80% */}
          {data.statistics.persenKehadiran === 80 && (
            <div className="relative mb-6">
              <Alert 
                color="warning" 
                variant="faded" 
                className="border-2 border-warning pr-12"
                title="⚠️ PERINGATAN - Batas Minimum"
              >
                <div className="space-y-1">
                  <button
                    onClick={handleCloseAlert}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-warning-700 hover:text-warning-900 transition-colors p-1 rounded-full hover:bg-warning-100"
                    aria-label="Close alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <p className="font-semibold">
                    Kehadiran Anda : {data.statistics.persenKehadiran}% (Tepat di batas minimum)
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-0.5 ml-2 pr-8">
                    <li>Wajib hadir di semua pertemuan untuk mempertahankan 80%</li>
                    <li>Satu ketidakhadiran akan menurunkan persentase di bawah 80%</li>
                    <li>Risiko tidak mendapat poin KPKK jika turun di bawah standar</li>
                  </ul>
                </div>
              </Alert>
            </div>
          )}

          {/* Success - Above 80% */}
          {data.statistics.persenKehadiran > 80 && data.statistics.persenKehadiran <= 100 && (
            <div className="relative mb-6">
              <Alert 
                color="success" 
                variant="faded" 
                className="border-2 border-success pr-12"
                title="✓ Kehadiran Baik"
              >
                <div className="space-y-1">
                  <button
                    onClick={handleCloseAlert}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-success-700 hover:text-success-900 transition-colors p-1 rounded-full hover:bg-success-100"
                    aria-label="Close alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <p className="font-semibold">
                    Kehadiran Anda : {data.statistics.persenKehadiran}% - Pertahankan!
                  </p>
                  <p className="text-sm pr-8">
                    Anda memenuhi standar kehadiran minimum. Terus jaga konsistensi untuk mendapat poin KPKK.
                  </p>
                </div>
              </Alert>
            </div>
          )}
        </>
      )}

      {/* Statistics Cards */}
      {data?.currentPeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Pertemuan</p>
                  <p className="text-2xl font-bold text-primary-500">
                    {data.statistics.totalPertemuan}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success-500/10 to-success-600/5 border border-success-500/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-success-500" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Kehadiran</p>
                  <p className="text-2xl font-bold text-success-500">
                    {data.statistics.hadir}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-warning-500/10 to-warning-600/5 border border-warning-500/20">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-warning-500" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Persentase</p>
                  <p className="text-2xl font-bold text-warning-500">
                    {data.statistics.persenKehadiran}%
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Current Period Info */}
      {data?.currentPeriod && (
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="font-semibold">Periode Aktif:</span>
              <span className="text-default-600">
                {data.currentPeriod.nama} - {data.currentPeriod.semester} {data.currentPeriod.tahun}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Cari topik pertemuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Calendar className="w-4 h-4 text-default-400" />}
              variant="bordered"
              classNames={{
                input: "text-sm",
                inputWrapper: "h-10"
              }}
            />

            <Select
              placeholder="Filter Status"
              selectedKeys={[filterStatus]}
              onChange={(e) => setFilterStatus(e.target.value)}
              variant="bordered"
              classNames={{
                trigger: "h-10"
              }}
            >
              <SelectItem key="all">Semua Status</SelectItem>
              <SelectItem key="hadir">Hadir</SelectItem>
              <SelectItem key="terlambat">Terlambat</SelectItem>
              <SelectItem key="tidak_hadir">Tidak Hadir</SelectItem>
            </Select>

            <Select
              placeholder="Filter Periode"
              selectedKeys={[filterPeriode]}
              onChange={(e) => setFilterPeriode(e.target.value)}
              variant="bordered"
              classNames={{
                trigger: "h-10"
              }}
            >
              <>
                <SelectItem key="all">Semua Periode</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period.id.toString()}>
                    {period.nama} - {period.semester} {period.tahun}
                  </SelectItem>
                ))}
              </>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <Calendar className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <p className="text-default-500">
              {data?.history.length === 0 
                ? 'Belum ada riwayat kehadiran pertemuan'
                : 'Tidak ada data yang sesuai dengan filter'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedHistory.map((record) => (
            <Card key={record.id} className="border border-default-200">
              <CardBody className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        record.status === 'hadir' 
                          ? 'bg-success-500/20' 
                          : record.status === 'terlambat'
                          ? 'bg-warning-500/20'
                          : 'bg-danger-500/20'
                      }`}>
                        {record.status === 'hadir' ? (
                          <CheckCircle2 className="w-5 h-5 text-success-500" />
                        ) : record.status === 'terlambat' ? (
                          <AlertCircle className="w-5 h-5 text-warning-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-danger-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {record.jadwal_pertemuan?.nama_topik || 'Topik tidak tersedia'}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-default-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {record.jadwal_pertemuan?.tanggal 
                                ? formatTanggal(record.jadwal_pertemuan.tanggal)
                                : 'Tanggal tidak tersedia'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {record.jadwal_pertemuan?.jam_mulai && record.jadwal_pertemuan?.jam_akhir
                                ? formatWaktu(record.jadwal_pertemuan.jam_mulai, record.jadwal_pertemuan.jam_akhir)
                                : 'Waktu tidak tersedia'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Chip 
                            size="sm" 
                            variant="flat"
                            className="bg-default-100"
                          >
                            {record.jadwal_pertemuan?.kelas || 'Kelas tidak tersedia'}
                          </Chip>
                          
                          {record.jadwal_pertemuan?.periode && (
                            <Chip 
                              size="sm" 
                              variant="flat"
                              color="primary"
                            >
                              {record.jadwal_pertemuan.periode.nama}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Chip 
                      color={getStatusColor(record.status)}
                      variant="flat"
                      size="lg"
                      className="font-semibold"
                    >
                      {getStatusLabel(record.status)}
                    </Chip>
                    
                    {record.jam && record.jam !== '-' && (
                      <div className="text-xs text-default-400">
                        Absen: {formatWaktuAbsen(record.jam)}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
                size="lg"
              />
            </div>
          )}
        </>
      )}

      {/* Summary at bottom */}
      {filteredHistory.length > 0 && (
        <Card className="mt-6">
          <CardBody className="p-4">
            <div className="text-center text-sm text-default-500">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} dari {filteredHistory.length} hasil
              {filteredHistory.length !== data?.history.length && ` (Total: ${data?.history.length || 0} riwayat pertemuan)`}
            </div>
          </CardBody>
        </Card>
      )}
    </UserLayout>
  );
}
