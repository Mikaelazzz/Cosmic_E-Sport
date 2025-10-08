"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
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
import { getUserAvatarUrl } from '@/lib/avatar';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import ModeratorLayout from '@/components/ModeratorLayout';

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

const IconDownload = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Real-time state
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<string[]>([]);
  const [newlyUpdatedIds, setNewlyUpdatedIds] = useState<Set<string>>(new Set());

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

  // Real-time polling untuk update otomatis
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      setIsPollingActive(true);
      // Polling setiap 2.5 detik untuk update real-time
      pollingInterval = setInterval(async () => {
        try {
          // Fetch data absensi terbaru tanpa loading indicator
          const response = await fetch(`/api/moderator/absensi/${pertemuanId}`);
          const result = await response.json();
          
          if (result.success) {
            // Update data jika ada perubahan
            setAbsensiList(prevList => {
              const hasChanges = JSON.stringify(prevList) !== JSON.stringify(result.data.absensi);
              if (hasChanges) {
                // console.log('🔄 Real-time update: Data absensi diperbarui');
                setLastUpdateTime(new Date());
                setStatistik(result.data.statistik);
                
                // Find newly updated records
                const newIds = new Set<string>();
                result.data.absensi.forEach((newRecord: any) => {
                  const oldRecord = prevList.find((old: any) => old.id === newRecord.id);
                  if (!oldRecord || oldRecord.status !== newRecord.status) {
                    newIds.add(newRecord.id);
                  }
                });
                setNewlyUpdatedIds(newIds);
                
                // Clear highlights after 2.5 seconds
                setTimeout(() => {
                  setNewlyUpdatedIds(new Set());
                }, 2500);
                
                // Track recent updates dengan timezone Indonesia
                setRecentUpdates(prev => {
                  const now = new Date();
                  const timeString = now.toLocaleTimeString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  const newUpdate = `Data diperbarui pada ${timeString} WIB`;
                  return [newUpdate, ...prev.slice(0, 4)]; // Keep last 5 updates
                });
                
                return result.data.absensi;
              }
              return prevList;
            });
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 5000); // Update setiap 5 detik
    };

    // Mulai polling jika pertemuan sedang berlangsung
    if (pertemuan?.status === 'berlangsung') {
      // console.log('🚀 Starting real-time polling for meeting', pertemuanId);
      startPolling();
    } else {
      setIsPollingActive(false);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setIsPollingActive(false);
        // console.log('⏹️ Stopped real-time polling');
      }
    };
  }, [pertemuanId, pertemuan?.status]);

  // Real-time update listener for QR scan success
  useEffect(() => {
    const handleAbsensiUpdate = (event: CustomEvent) => {
      const { pertemuanId: updatedPertemuanId, nim, status } = event.detail;
      
      // Only refresh if the update is for this pertemuan
      if (updatedPertemuanId.toString() === pertemuanId) {
        // console.log('🎯 Triggered immediate refresh from QR scan event');
        
        // Add instant notification dengan timezone Indonesia
        setRecentUpdates(prev => {
          const now = new Date();
          const timeString = now.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          const newUpdate = `${nim} baru saja ${status === 'hadir' ? 'hadir' : status === 'terlambat' ? 'terlambat' : 'absen'} - ${timeString} WIB`;
          return [newUpdate, ...prev.slice(0, 4)];
        });
        
        // Immediate data refresh
        fetchAbsensiData();
        setLastUpdateTime(new Date());
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

  // Download PDF
  const downloadPDF = async () => {
    if (!pertemuan) return;
    
    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`/api/moderator/absensi/${pertemuanId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'laporan-absensi.pdf';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showAlert('Berhasil!', 'Laporan PDF berhasil didownload', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showAlert('Error!', 'Gagal mendownload laporan PDF', 'danger');
    } finally {
      setIsDownloadingPDF(false);
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
        <div className="text-xs text-gray-400 mb-2">
          Tingkat Kehadiran: {persentase_kehadiran.toFixed(1)}%
        </div>
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500" 
            style={{ width: `${persentaseHadir}%` }}
          ></div>
          <div 
            className="h-full bg-yellow-500" 
            style={{ width: `${persentaseTerlambat}%` }}
          ></div>
          <div 
            className="h-full bg-red-500" 
            style={{ width: `${persentaseTidakHadir}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>{hadir + terlambat} / {total_anggota} hadir</span>
          <span>{tidak_hadir} tidak hadir</span>
        </div>
      </div>
    );
  };

  // Format time dengan timezone Indonesia (WIB)
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00' || timeString === '00:00:00') {
      return '-';
    }
    
    try {
      // Jika timeString sudah format HH:MM, langsung gunakan
      if (timeString.length === 5 && timeString.includes(':')) {
        return timeString;
      }
      
      // Jika timeString adalah ISO string atau dengan timezone
      if (timeString.includes('T') || timeString.includes('+')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // Fallback untuk format lain
      return timeString.substring(0, 5);
    } catch (error) {
      console.warn('Error formatting time:', error);
      return timeString.substring(0, 5);
    }
  };

  // Format date dengan timezone Indonesia
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return dateString;
    }
  };

  // Format waktu absen dengan timezone Indonesia (WIB)
  const formatAttendanceTime = (timeString: string) => {
    if (!timeString) return '-';
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.warn('Error formatting attendance time:', error);
      return '-';
    }
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
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <title>Detail Pertemuan - Cosmic E-Sports</title>
      </Head>

      <ModeratorLayout
        title="Detail Pertemuan"
        description="Kelola jadwal pertemuan dan absensi anggota"
      >
        <div className="min-h-screen p-3 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
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
                className="mx-2 sm:mx-0"
              />
            )}


            {/* Section 1: Pertemuan Info */}
            <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
              <CardHeader className="pb-2 sm:pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#FFD700] flex items-center gap-2">
                  <IconClock className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="truncate text-base sm:text-xl">{pertemuan.nama_topik}</span>
                </h2>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Hari & Tanggal</p>
                    <p className="font-semibold text-white text-sm sm:text-base">{pertemuan.hari}</p>
                    <p className="text-xs sm:text-sm text-gray-300">{formatDate(pertemuan.tanggal)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Kelas</p>
                    <p className="font-semibold text-white text-sm sm:text-base">{pertemuan.kelas}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Jam Pertemuan</p>
                    <p className="font-semibold text-white text-sm sm:text-base">{pertemuan.jam_pertemuan}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Status</p>
                    <Chip color={getStatusColor(pertemuan.status)} variant="flat" size="sm">
                      {pertemuan.status}
                    </Chip>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Jam Mulai</p>
                    <p className="font-semibold text-white font-mono">
                      {formatTime(pertemuan.jam_mulai)}
                      <span className="text-gray-400 text-xs ml-1">WIB</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Jam Akhir</p>
                    <p className="font-semibold text-white font-mono">
                      {formatTime(pertemuan.jam_akhir)}
                      <span className="text-gray-400 text-xs ml-1">WIB</span>
                    </p>
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

                  {/* Download PDF Button - Available for all meeting statuses */}
                  <Button
                    color="primary"
                    variant="bordered"
                    startContent={<IconDownload />}
                    onPress={downloadPDF}
                    isLoading={isDownloadingPDF}
                    className="font-semibold border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  >
                    Download PDF
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Section 2: Statistik Kehadiran */}
            <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-[#FFD700] flex items-center gap-2">
                    <IconUsers className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className='text-base sm:text-xl'>
                      Statistik Kehadiran
                    </span>
                  </h2>
                  
                  {/* Real-time indicator */}
                  <div className="flex items-center gap-2">
                    {isPollingActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    )}
                    {lastUpdateTime && (
                      <span className="text-xs text-gray-400">
                        Update: {lastUpdateTime.toLocaleTimeString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })} WIB
                      </span>
                    )}
                  </div>
                </div>
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
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#FFD700] flex items-center gap-2">
                    <IconUsers className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-xl">List Anggota</span>
                  </h2>
                  
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <Input
                      isClearable
                      placeholder="Cari nama atau NIM..."
                      startContent={<IconSearch className="w-4 h-4" />}
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="w-full"
                      size="md"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10"
                      }}
                    />
                    
                    <div className="flex gap-2">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="flat" startContent={<IconFilter className="w-4 h-4" />} size="sm" className="text-xs">
                            Filter
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
                          size="sm"
                          className="font-semibold text-xs whitespace-nowrap"
                        >
                          Absen Semua
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                    {filteredAbsensi.length > 0 ? (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden sm:block">
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
                                <TableRow 
                                  key={absensi.id}
                                  className={`
                                    ${newlyUpdatedIds.has(absensi.id) 
                                      ? 'bg-green-900/30 border border-green-500/50 animate-pulse' 
                                      : 'hover:bg-slate-700/50'
                                    }
                                  `}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center relative">
                                        {newlyUpdatedIds.has(absensi.id) && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                        )}
                                        <img 
                                          src={getUserAvatarUrl(absensi.user, 40, true) || '/logc.png'}
                                          alt="Profile"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = '/logc.png';
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <p className="font-medium text-white flex items-center gap-2">
                                          {absensi.user.nama_lengkap}
                                          {newlyUpdatedIds.has(absensi.id) && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                                              Baru Update!
                                            </span>
                                          )}
                                        </p>
                                        {/* <p className="text-xs text-gray-400">{absensi.user.email}</p> */}
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
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-sm">
                                        {formatAttendanceTime(absensi.waktu_absen)}
                                      </span>
                                      <span className="text-xs text-gray-400">WIB</span>
                                    </div>
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
                        </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                          {filteredAbsensi.map((absensi) => (
                            <Card key={absensi.id} className="bg-gray-800/50 border border-gray-700 hover:border-yellow-400/50 transition-colors">
                              <CardBody className="p-3">
                                <div className="space-y-2.5">
                                  {/* Header with Profile */}
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                                      <img 
                                        src={getUserAvatarUrl(absensi.user, 200, true) || '/logc.png'}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = '/logc.png';
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold text-white truncate">{absensi.user.nama_lengkap}</h3>
                                      <p className="text-xs text-gray-400">{absensi.user.nim}</p>
                                    </div>
                                    <Chip color={getAttendanceStatusColor(absensi.status)} variant="flat" size="sm" className="text-xs">
                                      {getStatusText(absensi.status)}
                                    </Chip>
                                  </div>

                                  {/* Details */}
                                  <div className="space-y-1.5 text-xs">
                                    {/* <div>
                                      <span className="text-gray-400">Email: </span>
                                      <span className="text-gray-200 font-medium break-all">{absensi.user.email}</span>
                                    </div> */}
                                    <div>
                                      <span className="text-gray-400">Waktu: </span>
                                      <span className="text-gray-200 font-medium font-mono">
                                        {formatAttendanceTime(absensi.waktu_absen)}
                                        <span className="text-gray-400 ml-1">WIB</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions for Mobile */}
                                  {pertemuan.status === 'berlangsung' && (
                                    <div className="flex gap-1.5 pt-2 border-t border-gray-700">
                                      <Button
                                        size="sm"
                                        color="success"
                                        variant="flat"
                                        onPress={() => handleManualAbsen(absensi.user.id, 'hadir')}
                                        startContent={<IconCheck className="w-3 h-3" />}
                                        className="flex-1 text-xs"
                                      >
                                        Hadir
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="warning"
                                        variant="flat"
                                        onPress={() => handleManualAbsen(absensi.user.id, 'terlambat')}
                                        startContent={<IconClock className="w-3 h-3" />}
                                        className="flex-1 text-xs"
                                      >
                                        Terlambat
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() => handleManualAbsen(absensi.user.id, 'tidak_hadir')}
                                        startContent={<IconX className="w-3 h-3" />}
                                        className="flex-1 text-xs"
                                      >
                                        Tidak Hadir
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </>
            ) : (
              <div className="text-center py-12">
                <IconUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'Tidak ada anggota yang sesuai dengan filter' : 'Belum ada data absensi'}
                </p>
                <p className="text-sm text-gray-500">
                  {searchQuery || statusFilter !== 'all' ? 'Coba ubah kriteria pencarian atau filter' : 'Data absensi akan muncul ketika anggota melakukan presensi'}
                </p>
              </div>
            )}
              </CardBody>
            </Card>

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
        </div>
      </ModeratorLayout>
    </>
  );
}
