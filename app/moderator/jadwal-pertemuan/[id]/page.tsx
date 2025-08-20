"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Alert } from "@heroui/alert";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useAuth } from '@/context/AuthContext';
import QRCodeGenerator from '@/components/QRCodeGenerator';

// Custom icons
const IconClock = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
  </svg>
);

const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
    <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
  </svg>
);

const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
  </svg>
);

const IconPlay = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
  </svg>
);

const IconStop = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const IconX = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
);

// Types
interface JadwalPertemuan {
  id: string;
  nama_topik: string;
  hari: string;
  tanggal: string;
  kelas: string;
  jam_mulai: string;
  jam_akhir: string;
  jam_pertemuan: string;
  status: 'belum_mulai' | 'berlangsung' | 'selesai' | 'dibatalkan';
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  nama_lengkap: string;
  nim: string;
  email: string;
}

interface Absensi {
  id: string;
  user_id: string;
  pertemuan_id: string;
  status: 'hadir' | 'tidak_hadir' | 'terlambat';
  waktu_absen: string;
  user: User;
}

interface StatistikKehadiran {
  total_anggota: number;
  hadir: number;
  tidak_hadir: number;
  terlambat: number;
  persentase_kehadiran: number;
}

export default function DetailPertemuanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pertemuanId = params.id as string;

  // States
  const [pertemuan, setPertemuan] = useState<JadwalPertemuan | null>(null);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [filteredAbsensi, setFilteredAbsensi] = useState<Absensi[]>([]);
  const [statistik, setStatistik] = useState<StatistikKehadiran>({
    total_anggota: 0,
    hadir: 0,
    tidak_hadir: 0,
    terlambat: 0,
    persentase_kehadiran: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hadir' | 'tidak_hadir' | 'terlambat'>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // Modal states
  const { isOpen: isAbsenModalOpen, onOpen: openAbsenModal, onClose: closeAbsenModal } = useDisclosure();
  const { isOpen: isQRModalOpen, onOpen: openQRModal, onClose: closeQRModal } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  // Get status color for attendance
  const getAttendanceStatusColor = (status: string) => {
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

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'hadir':
        return 'Hadir';
      case 'terlambat':
        return 'Terlambat';
      case 'tidak_hadir':
        return 'Tidak Hadir';
      default:
        return 'Unknown';
    }
  };

  // Fetch pertemuan detail
  const fetchPertemuanDetail = useCallback(async () => {
    try {
      const response = await fetch(`/api/moderator/jadwal-pertemuan/${pertemuanId}`);
      const result = await response.json();
      
      if (result.success) {
        setPertemuan(result.data);
      } else {
        showAlert('Error!', 'Gagal mengambil data pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error fetching pertemuan:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil data pertemuan', 'danger');
    }
  }, [pertemuanId]);

  // Fetch absensi data
  const fetchAbsensiData = useCallback(async () => {
    try {
      const response = await fetch(`/api/moderator/absensi/${pertemuanId}`);
      const result = await response.json();
      
      if (result.success) {
        setAbsensiList(result.data.absensi);
        setFilteredAbsensi(result.data.absensi);
        setStatistik(result.data.statistik);
      } else {
        showAlert('Error!', 'Gagal mengambil data absensi', 'danger');
      }
    } catch (error) {
      console.error('Error fetching absensi:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil data absensi', 'danger');
    }
  }, [pertemuanId]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPertemuanDetail(),
        fetchAbsensiData()
      ]);
      setLoading(false);
    };

    if (pertemuanId) {
      loadData();
    }
  }, [pertemuanId, fetchPertemuanDetail, fetchAbsensiData]);

  // Real-time update listener for QR scan success
  useEffect(() => {
    const handleAbsensiUpdate = (event: CustomEvent) => {
      const { pertemuanId: updatedPertemuanId } = event.detail;
      
      // Only refresh if the update is for this pertemuan
      if (updatedPertemuanId.toString() === pertemuanId) {
        console.log('🔄 Real-time absensi update detected, refreshing data...');
        fetchAbsensiData();
      }
    };

    // Add event listener
    window.addEventListener('absensi-updated', handleAbsensiUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('absensi-updated', handleAbsensiUpdate as EventListener);
    };
  }, [pertemuanId, fetchAbsensiData]);

  // Filter absensi based on search and status
  useEffect(() => {
    let filtered = absensiList;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.user.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.nim.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredAbsensi(filtered);
  }, [absensiList, searchQuery, statusFilter]);

  // Start meeting
  const startMeeting = async () => {
    if (!pertemuan) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/moderator/jadwal-pertemuan/${pertemuanId}/start`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        showAlert('Berhasil!', 'Pertemuan telah dimulai', 'success');
        await fetchPertemuanDetail();
      } else {
        showAlert('Error!', result.message || 'Gagal memulai pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      showAlert('Error!', 'Terjadi kesalahan saat memulai pertemuan', 'danger');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // End meeting
  const endMeeting = async () => {
    if (!pertemuan) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/moderator/jadwal-pertemuan/${pertemuanId}/end`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        showAlert('Berhasil!', 'Pertemuan telah diakhiri', 'success');
        await fetchPertemuanDetail();
      } else {
        showAlert('Error!', result.message || 'Gagal mengakhiri pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengakhiri pertemuan', 'danger');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Manual absen
  const handleManualAbsen = async (userId: string, status: 'hadir' | 'tidak_hadir' | 'terlambat') => {
    try {
      const response = await fetch(`/api/moderator/absensi/${pertemuanId}/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          status: status
        })
      });
      const result = await response.json();
      
      if (result.success) {
        showAlert('Berhasil!', `Absensi ${status} berhasil dicatat`, 'success');
        await fetchAbsensiData();
        closeAbsenModal();
      } else {
        showAlert('Error!', result.message || 'Gagal mencatat absensi', 'danger');
      }
    } catch (error) {
      console.error('Error manual absen:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mencatat absensi', 'danger');
    }
  };

  // Absen semua
  const absenSemua = async () => {
    try {
      const response = await fetch(`/api/moderator/absensi/${pertemuanId}/absen-semua`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        showAlert('Berhasil!', 'Semua anggota telah diabsen hadir', 'success');
        await fetchAbsensiData();
      } else {
        showAlert('Error!', result.message || 'Gagal mengabsen semua anggota', 'danger');
      }
    } catch (error) {
      console.error('Error absen semua:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengabsen semua anggota', 'danger');
    }
  };

  // Attendance Slider Component
  const AttendanceSlider = ({ statistik }: { statistik: StatistikKehadiran }) => {
    const { total_anggota, hadir, tidak_hadir, terlambat, persentase_kehadiran } = statistik;

    if (total_anggota === 0) {
      return (
        <div className="w-full">
          <div className="text-xs text-default-500 mb-1">Belum ada data kehadiran</div>
          <div className="w-full h-4 bg-default-200 rounded-full"></div>
          <div className="text-xs text-default-500 mt-1">0 / 0 anggota</div>
        </div>
      );
    }

    const persentaseHadir = total_anggota > 0 ? (hadir / total_anggota) * 100 : 0;
    const persentaseTerlambat = total_anggota > 0 ? (terlambat / total_anggota) * 100 : 0;
    const persentaseTidakHadir = total_anggota > 0 ? (tidak_hadir / total_anggota) * 100 : 0;

    return (
      <div className="w-full">
        <div className="flex justify-between text-sm text-default-600 mb-2">
          <span className="text-success">Hadir: {hadir}</span>
          <span className="text-warning">Terlambat: {terlambat}</span>
          <span className="font-semibold">{persentase_kehadiran}%</span>
          <span className="text-danger">Tidak Hadir: {tidak_hadir}</span>
        </div>
        <div className="relative w-full h-4 bg-default-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-success rounded-full transition-all duration-500"
            style={{ width: `${persentaseHadir}%` }}
          ></div>
          <div 
            className="absolute top-0 h-full bg-warning rounded-full transition-all duration-500"
            style={{ 
              left: `${persentaseHadir}%`,
              width: `${persentaseTerlambat}%` 
            }}
          ></div>
          <div 
            className="absolute top-0 h-full bg-danger rounded-full transition-all duration-500"
            style={{ 
              left: `${persentaseHadir + persentaseTerlambat}%`,
              width: `${persentaseTidakHadir}%` 
            }}
          ></div>
        </div>
        <div className="text-sm text-default-500 mt-2 text-center">
          {hadir + terlambat + tidak_hadir} / {total_anggota} anggota
        </div>
      </div>
    );
  };

  // Format time
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00' || timeString === '00:00:00') {
      return '-';
    }
    return timeString.substring(0, 5);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir': return 'success';
      case 'tidak_hadir': return 'danger';
      case 'berlangsung': return 'primary';
      case 'selesai': return 'success';
      case 'belum_mulai': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pertemuan) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Pertemuan tidak ditemukan</h1>
          <Button onPress={() => router.back()} color="primary">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Alert Notifications */}
        {alertConfig.show && (
          <Alert
            hideIconWrapper
            color={alertConfig.color}
            description={alertConfig.description}
            title={alertConfig.title}
            variant="bordered"
            onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
            isClosable
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="light"
              onPress={() => router.back()}
              className="mb-4"
            >
              ← Kembali
            </Button>
            <h1 className="text-3xl font-bold text-white">Detail Pertemuan</h1>
            <p className="text-gray-300">Kelola detail pertemuan dan absensi anggota</p>
          </div>
        </div>

        {/* Section 1: Pertemuan Info */}
        <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
              <IconClock className="w-6 h-6" />
              {pertemuan.nama_topik}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-400">Hari & Tanggal</p>
                <p className="font-semibold text-white">{pertemuan.hari}</p>
                <p className="text-sm text-gray-300">{formatDate(pertemuan.tanggal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Kelas</p>
                <p className="font-semibold text-white">{pertemuan.kelas}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Jam Pertemuan</p>
                <p className="font-semibold text-white">{pertemuan.jam_pertemuan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <Chip color={getStatusColor(pertemuan.status)} variant="flat" size="sm">
                  {pertemuan.status}
                </Chip>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">Jam Mulai</p>
                <p className="font-semibold text-white">{formatTime(pertemuan.jam_mulai)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Jam Akhir</p>
                <p className="font-semibold text-white">{formatTime(pertemuan.jam_akhir)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {pertemuan.status === 'belum_mulai' && (
                <Button
                  color="success"
                  startContent={<IconPlay />}
                  onPress={startMeeting}
                  isLoading={isUpdatingStatus}
                  className="font-semibold"
                >
                  Mulai Pertemuan
                </Button>
              )}

              {pertemuan.status === 'berlangsung' && (
                <>
                  <Button
                    color="danger"
                    startContent={<IconStop />}
                    onPress={endMeeting}
                    isLoading={isUpdatingStatus}
                    className="font-semibold"
                  >
                    Akhiri Pertemuan
                  </Button>
                  <Button
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold"
                    startContent={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
                      </svg>
                    }
                    onPress={openQRModal}
                  >
                    Presensi QR
                  </Button>
                </>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Statistik Kehadiran */}
        <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
              <IconUsers className="w-6 h-6" />
              Statistik Kehadiran
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{statistik.total_anggota}</div>
                <div className="text-sm text-gray-400">Total Anggota</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{statistik.hadir}</div>
                <div className="text-sm text-gray-400">Hadir</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{statistik.terlambat}</div>
                <div className="text-sm text-gray-400">Terlambat</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{statistik.tidak_hadir}</div>
                <div className="text-sm text-gray-400">Tidak Hadir</div>
              </div>
            </div>
            
            <AttendanceSlider statistik={statistik} />
          </CardBody>
        </Card>

        {/* Section 3: List Anggota */}
        <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
                <IconUsers className="w-6 h-6" />
                List Anggota
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  isClearable
                  placeholder="Cari berdasarkan nama atau NIM..."
                  startContent={<IconSearch />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="w-full sm:w-64"
                />
                
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat" startContent={<IconFilter />}>
                      Filter Status
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    selectedKeys={[statusFilter]}
                    onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as any)}
                  >
                    <DropdownItem key="all">Semua Status</DropdownItem>
                    <DropdownItem key="hadir">Hadir</DropdownItem>
                    <DropdownItem key="terlambat">Terlambat</DropdownItem>
                    <DropdownItem key="tidak_hadir">Tidak Hadir</DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                {pertemuan.status === 'berlangsung' && (
                  <Button
                    color="success"
                    onPress={absenSemua}
                    className="font-semibold"
                  >
                    Absen Semua
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {filteredAbsensi.length > 0 ? (
              <Table aria-label="Daftar Absensi Anggota">
                <TableHeader>
                  <TableColumn>ANGGOTA</TableColumn>
                  <TableColumn>NIM</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>WAKTU HADIR</TableColumn>
                  <TableColumn>AKSI</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredAbsensi.map((absensi) => (
                    <TableRow key={absensi.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={absensi.user.nama_lengkap}
                            size="sm"
                            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black"
                          />
                          <div>
                            <p className="font-medium text-white">{absensi.user.nama_lengkap}</p>
                            <p className="text-xs text-gray-400">{absensi.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{absensi.user.nim}</span>
                      </TableCell>
                      <TableCell>
                        <Chip color={getAttendanceStatusColor(absensi.status)} variant="flat" size="sm">
                          {getStatusText(absensi.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {absensi.waktu_absen ? 
                          new Date(absensi.waktu_absen).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {pertemuan.status === 'berlangsung' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleManualAbsen(absensi.user.id, 'hadir')}
                              startContent={<IconCheck className="w-3 h-3" />}
                            >
                              Hadir
                            </Button>
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              onPress={() => handleManualAbsen(absensi.user.id, 'terlambat')}
                              startContent={<IconClock className="w-3 h-3" />}
                            >
                              Terlambat
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => handleManualAbsen(absensi.user.id, 'tidak_hadir')}
                              startContent={<IconX className="w-3 h-3" />}
                            >
                              Tidak Hadir
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <IconUsers className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'Tidak ada anggota yang sesuai dengan filter' : 'Belum ada data absensi'}
                </p>
                <p className="text-sm text-gray-500">
                  {searchQuery || statusFilter !== 'all' ? 'Coba ubah kriteria pencarian atau filter' : 'Data absensi akan muncul ketika anggota melakukan presensi'}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* QR Code Generator Modal */}
      <QRCodeGenerator
        pertemuanId={pertemuanId}
        isOpen={isQRModalOpen}
        onClose={closeQRModal}
        onSuccess={() => {
          showAlert('Success!', 'QR Code generated successfully', 'success');
        }}
      />
    </div>
  );
}
