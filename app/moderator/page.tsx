"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Alert } from '@heroui/alert';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { formatTimeForDisplay } from '@/lib/time-utils';

// Custom icons
const IconCalendar = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5 0zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
  </svg>
);

const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002A.274.274 0 0 1 15 13H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
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

const IconSettings = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
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
  jumlah_kehadiran?: number;
  created_at: string;
  updated_at: string;
}

interface ModeratorStats {
  total_users: number;
  total_meetings: number;
  active_meetings: number;
  completed_meetings: number;
  today_meetings: number;
}

export default function ModeratorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ModeratorStats | null>(null);
  const [todayMeetings, setTodayMeetings] = useState<JadwalPertemuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal untuk konfirmasi aksi
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();
  const [actionModal, setActionModal] = useState<{
    meeting: JadwalPertemuan | null;
    action: 'start' | 'end' | null;
    isProcessing: boolean;
  }>({
    meeting: null,
    action: null,
    isProcessing: false
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

  // Fetch moderator stats
  const fetchModeratorStats = useCallback(async () => {
    try {
      // Get total users
      const usersResponse = await fetch('/api/moderator/users');
      const usersResult = await usersResponse.json();
      
      // Get meetings data
      const meetingsResponse = await fetch('/api/moderator/jadwal-pertemuan');
      const meetingsResult = await meetingsResponse.json();
      
      if (usersResult.success && meetingsResult.success) {
        const meetings = meetingsResult.data || [];
        const today = new Date().toISOString().split('T')[0];
        
        // Filter today's meetings
        const todayMeetingsList = meetings.filter((meeting: JadwalPertemuan) => 
          meeting.tanggal === today
        );
        
        setStats({
          total_users: usersResult.data?.length || 0,
          total_meetings: meetings.length,
          active_meetings: meetings.filter((m: JadwalPertemuan) => m.status === 'berlangsung').length,
          completed_meetings: meetings.filter((m: JadwalPertemuan) => m.status === 'selesai').length,
          today_meetings: todayMeetingsList.length
        });
        
        setTodayMeetings(todayMeetingsList);
      } else {
        showAlert('Warning!', 'Gagal mengambil statistik data', 'warning');
      }
    } catch (error) {
      console.error('Error fetching moderator stats:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil data statistik', 'danger');
    }
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchModeratorStats();
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchModeratorStats]);

  // Handle meeting actions
  const handleMeetingAction = async (meeting: JadwalPertemuan, action: 'start' | 'end') => {
    setActionModal({
      meeting,
      action,
      isProcessing: false
    });
    onActionOpen();
  };

  const confirmMeetingAction = async () => {
    if (!actionModal.meeting || !actionModal.action) return;

    setActionModal(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const endpoint = `/api/moderator/jadwal-pertemuan/${actionModal.meeting.id}/${actionModal.action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        showAlert(
          'Success!', 
          `Pertemuan berhasil ${actionModal.action === 'start' ? 'dimulai' : 'diakhiri'}`, 
          'success'
        );
        
        // Refresh data
        await fetchModeratorStats();
        onActionClose();
      } else {
        showAlert('Error!', result.message || 'Gagal memproses pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error processing meeting action:', error);
      showAlert('Error!', 'Terjadi kesalahan saat memproses pertemuan', 'danger');
    } finally {
      setActionModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'belum_mulai':
        return 'default';
      case 'berlangsung':
        return 'success';
      case 'selesai':
        return 'primary';
      case 'dibatalkan':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'belum_mulai':
        return 'Belum Mulai';
      case 'berlangsung':
        return 'Berlangsung';
      case 'selesai':
        return 'Selesai';
      case 'dibatalkan':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Alert */}
        {alertConfig.show && (
          <Alert
            color={alertConfig.color}
            title={alertConfig.title}
            description={alertConfig.description}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && (
          <>
            {/* Welcome Card */}
            <Card className="mb-8">
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
                      Selamat datang di dashboard moderator. Anda dapat mengelola jadwal pertemuan, 
                      user, dan memulai sesi pertemuan dari dashboard ini.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardBody className="text-center">
                  <IconUsers className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {stats?.total_users || 0}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Users</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardBody className="text-center">
                  <IconCalendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {stats?.total_meetings || 0}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Total Meetings</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardBody className="text-center">
                  <IconPlay className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {stats?.active_meetings || 0}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Active Meetings</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardBody className="text-center">
                  <IconStop className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {stats?.completed_meetings || 0}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Completed</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
                <CardBody className="text-center">
                  <IconCalendar className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {stats?.today_meetings || 0}
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-400">Today's Meetings</p>
                </CardBody>
              </Card>
            </div>

            {/* Today's Meetings Section */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-xl font-semibold">Jadwal Pertemuan Hari Ini</h3>
                  <Button 
                    size="sm" 
                    variant="flat"
                    onPress={() => window.location.href = '/moderator/jadwal-pertemuan'}
                  >
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                {todayMeetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <IconCalendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada pertemuan hari ini</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {todayMeetings.map((meeting) => (
                      <Card key={meeting.id} className="border hover:shadow-md transition-shadow">
                        <CardBody>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-lg">{meeting.nama_topik}</h4>
                              <Chip 
                                color={getStatusColor(meeting.status) as any}
                                size="sm"
                                variant="flat"
                              >
                                {getStatusText(meeting.status)}
                              </Chip>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Hari:</strong> {meeting.hari}</p>
                              <p><strong>Kelas:</strong> {meeting.kelas}</p>
                              <p><strong>Jam:</strong> {meeting.jam_pertemuan}</p>
                              {meeting.jumlah_kehadiran !== undefined && (
                                <p><strong>Kehadiran:</strong> {meeting.jumlah_kehadiran} orang</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {meeting.status === 'belum_mulai' && (
                                <Button
                                  color="success"
                                  size="sm"
                                  variant="flat"
                                  startContent={<IconPlay className="w-4 h-4" />}
                                  onPress={() => handleMeetingAction(meeting, 'start')}
                                  isLoading={actionLoading === `start-${meeting.id}`}
                                >
                                  Mulai
                                </Button>
                              )}
                              
                              {meeting.status === 'berlangsung' && (
                                <Button
                                  color="danger"
                                  size="sm"
                                  variant="flat"
                                  startContent={<IconStop className="w-4 h-4" />}
                                  onPress={() => handleMeetingAction(meeting, 'end')}
                                  isLoading={actionLoading === `end-${meeting.id}`}
                                >
                                  Akhiri
                                </Button>
                              )}
                              
                              <Button
                                color="primary"
                                size="sm"
                                variant="light"
                                onPress={() => window.location.href = `/moderator/jadwal-pertemuan/${meeting.id}`}
                              >
                                Detail
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Management Tools */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconUsers className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">User Management</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                    Kelola data user, reset password, dan hak akses anggota
                  </p>
                  <Button 
                    color="primary" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/moderator/users'}
                  >
                    Kelola Users
                  </Button>
                </CardBody>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconCalendar className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Jadwal Pertemuan</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                    Buat, edit, dan kelola jadwal pertemuan organisasi
                  </p>
                  <Button 
                    color="success" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/moderator/jadwal-pertemuan'}
                  >
                    Kelola Jadwal
                  </Button>
                </CardBody>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconSettings className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Laporan & Analytics</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                    Lihat laporan kehadiran dan statistik pertemuan
                  </p>
                  <Button 
                    color="secondary" 
                    variant="flat"
                    className="w-full"
                    onPress={() => window.location.href = '/moderator/reports'}
                  >
                    Lihat Laporan
                  </Button>
                </CardBody>
              </Card>
            </div>
          </>
        )}

        {/* Action Confirmation Modal */}
        <Modal 
          isOpen={isActionOpen} 
          onClose={onActionClose}
          size="md"
        >
          <ModalContent>
            <ModalHeader>
              <h3 className="text-lg font-semibold">
                Konfirmasi {actionModal.action === 'start' ? 'Memulai' : 'Mengakhiri'} Pertemuan
              </h3>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p>
                  Apakah Anda yakin ingin {actionModal.action === 'start' ? 'memulai' : 'mengakhiri'} pertemuan:
                </p>
                
                {actionModal.meeting && (
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardBody>
                      <div className="space-y-2">
                        <p><strong>Topik:</strong> {actionModal.meeting.nama_topik}</p>
                        <p><strong>Hari:</strong> {actionModal.meeting.hari}</p>
                        <p><strong>Tanggal:</strong> {actionModal.meeting.tanggal}</p>
                        <p><strong>Kelas:</strong> {actionModal.meeting.kelas}</p>
                        <p><strong>Jam:</strong> {actionModal.meeting.jam_pertemuan}</p>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {actionModal.action === 'start' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      📝 Setelah pertemuan dimulai, sistem akan generate QR code untuk absensi 
                      dan status pertemuan akan berubah menjadi "Berlangsung".
                    </p>
                  </div>
                )}

                {actionModal.action === 'end' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      ⚠️ Setelah pertemuan diakhiri, absensi akan ditutup dan status 
                      pertemuan akan berubah menjadi "Selesai".
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="default" 
                variant="light" 
                onPress={onActionClose}
                isDisabled={actionModal.isProcessing}
              >
                Batal
              </Button>
              <Button 
                color={actionModal.action === 'start' ? 'success' : 'danger'} 
                onPress={confirmMeetingAction}
                isLoading={actionModal.isProcessing}
                startContent={
                  actionModal.action === 'start' ? 
                  <IconPlay className="w-4 h-4" /> : 
                  <IconStop className="w-4 h-4" />
                }
              >
                {actionModal.isProcessing 
                  ? `${actionModal.action === 'start' ? 'Memulai' : 'Mengakhiri'}...`
                  : `Ya, ${actionModal.action === 'start' ? 'Mulai' : 'Akhiri'}`
                }
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}