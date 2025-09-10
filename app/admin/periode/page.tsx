'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Alert } from "@heroui/alert";
import { IconPlus, IconEdit, IconTrash, IconCalendar, IconUsers, IconDownload, IconSearch } from '@/components/icons';
import { Meeting } from '@/types/index';
import AdminLayout from '@/components/AdminLayout';

// Types sesuai database schema
interface Periode {
  id: number;
  nama: string;
  tahun_akademik: string;
  semester: 'genap' | 'ganjil';
  tanggal_mulai: string;
  tanggal_akhir: string;
  status: 'belum_mulai' | 'berlangsung' | 'selesai';
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

interface NextPeriodInfo {
  nextSemester: 'genap' | 'ganjil';
  suggestedYear: string;
  isNewCycle: boolean;
}

interface FormData {
  nama: string;
  tahun_akademik: string;
  semester: 'genap' | 'ganjil';
  tanggal_mulai: string;
  tanggal_akhir: string;
  deskripsi: string;
}

export default function PeriodePage() {
  // States
  const [currentPeriod, setCurrentPeriod] = useState<Periode | null>(null);
  const [nextPeriodInfo, setNextPeriodInfo] = useState<NextPeriodInfo | null>(null);
  const [allPeriods, setAllPeriods] = useState<Periode[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    tahun_akademik: '',
    semester: 'genap',
    tanggal_mulai: '',
    tanggal_akhir: '',
    deskripsi: ''
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

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
    // Auto hide after 5 seconds
    setTimeout(() => {
      setAlertConfig(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Fix Data confirmation modal state
  const [fixDataModal, setFixDataModal] = useState<{
    isOpen: boolean;
    isProcessing: boolean;
  }>({
    isOpen: false,
    isProcessing: false
  });

  // Open fix data confirmation modal
  const openFixDataModal = () => {
    setFixDataModal({
      isOpen: true,
      isProcessing: false
    });
  };

  // Close fix data modal
  const closeFixDataModal = () => {
    setFixDataModal({
      isOpen: false,
      isProcessing: false
    });
  };

  // Attendance Slider Component
  const AttendanceSlider = ({ meeting }: { meeting: Meeting }) => {
    const total = meeting.total_peserta || 0;
    const hadir = meeting.jumlah_hadir || 0;
    const tidakHadir = meeting.jumlah_tidak_hadir || 0;
    const persentase = meeting.persentase_kehadiran || 0;

    if (total === 0) {
      return (
        <div className="w-full">
          <div className="text-xs text-default-500 mb-1">Belum ada data kehadiran</div>
          <div className="w-full h-2 bg-default-200 rounded-full"></div>
          <div className="text-xs text-default-500 mt-1">0 / 0 peserta</div>
        </div>
      );
    }

    return (
      <div className="w-full min-w-[120px]">
        <div className="flex justify-between text-xs text-default-600 mb-1">
          <span>Hadir: {hadir}</span>
          <span>{persentase}%</span>
          <span>Tidak: {tidakHadir}</span>
        </div>
        <div className="relative w-full h-2 bg-default-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-300"
            style={{ width: `${persentase}%` }}
          ></div>
        </div>
        <div className="text-xs text-default-500 mt-1 text-center">
          {hadir + tidakHadir} / {total} peserta
        </div>
      </div>
    );
  };

  // Fetch current active period
  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch('/api/admin/periode?type=current');
      const result = await response.json();
      if (result.success) {
        setCurrentPeriod(result.data);
      }
    } catch (error) {
      console.error('Error fetching current period:', error);
    }
  };

  // Fetch next period info
  const fetchNextPeriodInfo = async () => {
    try {
      const response = await fetch('/api/admin/periode?type=next-info');
      const result = await response.json();
      if (result.success) {
        setNextPeriodInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching next period info:', error);
    }
  };

  // Fetch all periods for history
  const fetchAllPeriods = async () => {
    try {
      const response = await fetch('/api/admin/periode?type=all');
      const result = await response.json();
      if (result.success) {
        setAllPeriods(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching all periods:', error);
    }
  };

  // Fetch meetings for active period
  const fetchMeetings = async (periodId?: number) => {
    try {
      if (!periodId) {
        setMeetings([]);
        setFilteredMeetings([]);
        return;
      }
      
      const response = await fetch(`/api/admin/periode/${periodId}/meetings`);
      const result = await response.json();
      if (result.success) {
        const meetingsData = result.data || [];
        setMeetings(meetingsData);
        setFilteredMeetings(meetingsData);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
      setFilteredMeetings([]);
    }
  };

  // Fix periode_id for existing meetings
  const fixPeriodeId = async () => {
    setFixDataModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await fetch('/api/admin/fix-periode-id', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        showAlert('Berhasil!', result.message, 'success');
        // Refresh meetings data
        if (currentPeriod) {
          await fetchMeetings(currentPeriod.id);
        }
        closeFixDataModal();
      } else {
        showAlert('Error!', result.message, 'danger');
      }
    } catch (error) {
      console.error('Error fixing periode_id:', error);
      showAlert('Error!', 'Terjadi kesalahan saat memperbaiki data', 'danger');
    } finally {
      setFixDataModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle search filter
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setFilteredMeetings(meetings);
    } else {
      const filtered = meetings.filter(meeting =>
        meeting.nama_topik.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMeetings(filtered);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredMeetings.length === 0) return;
    
    const headers = ['Topik', 'Tanggal', 'Jam Mulai', 'Jam Akhir', 'Kelas', 'Hadir', 'Tidak Hadir', 'Total Peserta', 'Persentase Kehadiran', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredMeetings.map(meeting => [
        `"${meeting.nama_topik}"`,
        meeting.tanggal,
        meeting.jam_mulai,
        meeting.jam_akhir,
        `"${meeting.kelas}"`,
        meeting.jumlah_hadir || 0,
        meeting.jumlah_tidak_hadir || 0,
        meeting.total_peserta || 0,
        `${meeting.persentase_kehadiran || 0}%`,
        meeting.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pertemuan-${currentPeriod?.nama || 'periode'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (filteredMeetings.length === 0) return;
    
    // Simple PDF export using window.print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daftar Pertemuan - ${currentPeriod?.nama}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { text-align: center; margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Daftar Pertemuan</h1>
          <div class="header-info">
            <p><strong>Periode:</strong> ${currentPeriod?.nama}</p>
            <p><strong>Tahun Akademik:</strong> ${currentPeriod?.tahun_akademik}</p>
            <p><strong>Semester:</strong> ${currentPeriod?.semester}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Topik</th>
                <th>Tanggal</th>
                <th>Jam Mulai</th>
                <th>Jam Akhir</th>
                <th>Kelas</th>
                <th>Hadir</th>
                <th>Tidak Hadir</th>
                <th>Persentase</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMeetings.map((meeting, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${meeting.nama_topik}</td>
                  <td>${new Date(meeting.tanggal).toLocaleDateString('id-ID')}</td>
                  <td>${meeting.jam_mulai}</td>
                  <td>${meeting.jam_akhir}</td>
                  <td>${meeting.kelas}</td>
                  <td>${meeting.jumlah_hadir || 0}</td>
                  <td>${meeting.jumlah_tidak_hadir || 0}</td>
                  <td>${meeting.persentase_kehadiran || 0}%</td>
                  <td>${meeting.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCurrentPeriod(),
        fetchNextPeriodInfo(),
        fetchAllPeriods()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Fetch meetings when current period changes
  useEffect(() => {
    if (currentPeriod) {
      fetchMeetings(currentPeriod.id);
    } else {
      setMeetings([]);
      setFilteredMeetings([]);
    }
  }, [currentPeriod]);

  // Update filtered meetings when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMeetings(meetings);
    } else {
      const filtered = meetings.filter(meeting =>
        meeting.nama_topik.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMeetings(filtered);
    }
  }, [meetings, searchQuery]);

  // Generate default dates based on semester
  const generateDefaultDates = (semester: 'genap' | 'ganjil', year: string) => {
    const academicYear = parseInt(year.split('/')[0]);
    
    if (semester === 'genap') {
      // Semester genap: February - July
      return {
        tanggal_mulai: `${academicYear + 1}-02-01`,
        tanggal_akhir: `${academicYear + 1}-07-31`
      };
    } else {
      // Semester ganjil: August - January
      return {
        tanggal_mulai: `${academicYear}-08-01`,
        tanggal_akhir: `${academicYear + 1}-01-31`
      };
    }
  };

  // Open modal for creating new period
  const openCreateModal = () => {
    if (nextPeriodInfo) {
      const defaultDates = generateDefaultDates(nextPeriodInfo.nextSemester, nextPeriodInfo.suggestedYear);
      
      setFormData({
        nama: `Periode ${nextPeriodInfo.nextSemester === 'genap' ? 'Genap' : 'Ganjil'} ${nextPeriodInfo.suggestedYear}`,
        tahun_akademik: nextPeriodInfo.suggestedYear,
        semester: nextPeriodInfo.nextSemester,
        tanggal_mulai: defaultDates.tanggal_mulai,
        tanggal_akhir: defaultDates.tanggal_akhir,
        deskripsi: `Periode ${nextPeriodInfo.nextSemester} untuk tahun akademik ${nextPeriodInfo.suggestedYear}`
      });
    } else {
      // Fallback if no next period info
      const currentYear = new Date().getFullYear();
      setFormData({
        nama: '',
        tahun_akademik: `${currentYear}/${currentYear + 1}`,
        semester: 'genap',
        tanggal_mulai: '',
        tanggal_akhir: '',
        deskripsi: ''
      });
    }
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/periode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onClose();
        await Promise.all([
          fetchCurrentPeriod(),
          fetchNextPeriodInfo(),
          fetchAllPeriods()
        ]);
        showAlert('Berhasil!', 'Periode berhasil dibuat!', 'success');
      } else {
        showAlert('Error!', result.message || 'Gagal membuat periode', 'danger');
      }
    } catch (error) {
      console.error('Error creating period:', error);
      showAlert('Error!', 'Terjadi kesalahan saat membuat periode', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update period status
  const updatePeriodStatus = async (periodId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/periode/${periodId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        await Promise.all([
          fetchCurrentPeriod(),
          fetchNextPeriodInfo(),
          fetchAllPeriods()
        ]);
        showAlert('Berhasil!', 'Status periode berhasil diperbarui!', 'success');
      } else {
        showAlert('Error!', result.message || 'Gagal memperbarui status', 'danger');
      }
    } catch (error) {
      console.error('Error updating period status:', error);
      showAlert('Error!', 'Terjadi kesalahan saat memperbarui status', 'danger');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Remove seconds, show HH:MM
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'berlangsung': return 'success';
      case 'selesai': return 'default';
      case 'belum_mulai': return 'warning';
      default: return 'default';
    }
  };

  // Get meeting status color
  const getMeetingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'selesai': return 'success';
      case 'berlangsung': return 'primary';
      case 'dijadwalkan': return 'warning';
      case 'dibatalkan': return 'danger';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'berlangsung': return 'Berlangsung';
      case 'selesai': return 'Selesai';
      case 'belum_mulai': return 'Belum Mulai';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="Manajemen Periode"
      description="Kelola periode dan semester UKM untuk mengatur jadwal kegiatan organisasi."
    >
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

        {/* Action Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Periode Aktif & Kontrol</h2>
            <p className="text-default-500 text-sm">Kelola status periode dan buat periode baru</p>
          </div>
          {!currentPeriod && (
            <Button
              color="primary"
              startContent={<IconPlus />}
              onPress={openCreateModal}
              isDisabled={!nextPeriodInfo}
            >
              {nextPeriodInfo ? 
                `Mulai Periode ${nextPeriodInfo.nextSemester === 'genap' ? 'Genap' : 'Ganjil'}` : 
                'Buat Periode'
              }
            </Button>
          )}
      </div>

      {/* Current Period Card */}
      {currentPeriod ? (
        <Card className="">
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <IconCalendar/>
                <div>
                  <h3 className="text-xl font-bold">Periode Aktif</h3>
                  <p className="text-base font-semibold">{currentPeriod.nama}</p>
                </div>
              </div>
              <Chip color={getStatusColor(currentPeriod.status)} variant="flat">
                {getStatusText(currentPeriod.status)}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-default-500">Tahun Akademik</p>
                <p className="font-semibold">{currentPeriod.tahun_akademik}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Semester</p>
                <p className="font-semibold capitalize">{currentPeriod.semester}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Periode</p>
                <p className="font-semibold">
                  {formatDate(currentPeriod.tanggal_mulai)} - {formatDate(currentPeriod.tanggal_akhir)}
                </p>
              </div>
            </div>
            {currentPeriod.deskripsi && (
              <div className="mt-4">
                <p className="text-sm text-default-500">Deskripsi</p>
                <p className="text-sm ">{currentPeriod.deskripsi}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {currentPeriod.status === 'berlangsung' && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => updatePeriodStatus(currentPeriod.id, 'selesai')}
                >
                  Akhiri Periode
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-default-300">
          <CardBody className="text-center py-12">
            <IconCalendar className="mx-auto text-default-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-default-600 mb-2">
              Tidak Ada Periode Aktif
            </h3>
            <p className="text-default-500 mb-4">
              Belum ada periode yang sedang berlangsung. Buat periode baru untuk memulai.
            </p>
            {nextPeriodInfo && (
              <div className="text-center">
                <p className="text-sm text-default-600 mb-3">
                  Periode selanjutnya: <strong>{nextPeriodInfo.nextSemester === 'genap' ? 'Genap' : 'Ganjil'} {nextPeriodInfo.suggestedYear}</strong>
                </p>
                <Button
                  color="primary"
                  startContent={<IconPlus />}
                  onPress={openCreateModal}
                >
                  Mulai Periode {nextPeriodInfo.nextSemester === 'genap' ? 'Genap' : 'Ganjil'}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Meeting Table for Current Period */}
      {currentPeriod && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <IconCalendar />
                <div>
                  <h3 className="text-lg font-semibold">Pertemuan - {currentPeriod.nama}</h3>
                  <p className="text-sm text-default-500">Daftar pertemuan pada periode aktif</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Input
                  isClearable
                  placeholder="Cari berdasarkan nama pertemuan..."
                  startContent={<IconSearch />}
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  className="w-full sm:w-64"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="flat"
                    color="warning"
                    onPress={openFixDataModal}
                    className="whitespace-nowrap"
                  >
                    Fix Data
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<IconDownload />}
                    onPress={exportToCSV}
                    isDisabled={filteredMeetings.length === 0}
                  >
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<IconDownload />}
                    onPress={exportToPDF}
                    isDisabled={filteredMeetings.length === 0}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {filteredMeetings.length > 0 ? (
              <div className="space-y-4">
                {searchQuery && (
                  <div className="text-sm text-default-500">
                    Menampilkan {filteredMeetings.length} dari {meetings.length} pertemuan
                  </div>
                )}
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table aria-label="Daftar Pertemuan periode aktif">
                    <TableHeader>
                      <TableColumn>TOPIK</TableColumn>
                      <TableColumn>TANGGAL</TableColumn>
                      <TableColumn>WAKTU</TableColumn>
                      <TableColumn>KELAS</TableColumn>
                      <TableColumn>KEHADIRAN</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredMeetings.map((meeting) => (
                        <TableRow key={meeting.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{meeting.nama_topik}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                          {new Date(meeting.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          {formatTime(meeting.jam_mulai)} - {formatTime(meeting.jam_akhir)}
                        </TableCell>
                        <TableCell>{meeting.kelas || '-'}</TableCell>
                        <TableCell>
                          <AttendanceSlider meeting={meeting} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getMeetingStatusColor(meeting.status)}
                            variant="flat"
                            size="sm"
                          >
                            {meeting.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {filteredMeetings.map((meeting) => (
                    <Card key={meeting.id} className="w-full">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{meeting.nama_topik}</h4>
                            <p className="text-sm text-default-600">
                              {new Date(meeting.tanggal).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <Chip
                            color={getMeetingStatusColor(meeting.status)}
                            variant="flat"
                            size="sm"
                          >
                            {meeting.status}
                          </Chip>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-default-500">Waktu:</span>
                            <span className="text-sm">{formatTime(meeting.jam_mulai)} - {formatTime(meeting.jam_akhir)}</span>
                          </div>
                          {meeting.kelas && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-default-500">Kelas:</span>
                              <span className="text-sm">{meeting.kelas}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-default-500">Kehadiran:</span>
                            <AttendanceSlider meeting={meeting} />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <IconCalendar className="w-12 h-12 mx-auto text-default-300 mb-3" />
                <p className="text-default-500 mb-2">
                  {searchQuery ? 'Tidak ada pertemuan yang sesuai dengan pencarian' : 'Belum ada pertemuan untuk periode ini'}
                </p>
                <p className="text-sm text-default-400">
                  {searchQuery ? 'Coba gunakan kata kunci yang berbeda' : 'Pertemuan akan ditampilkan ketika sudah dijadwalkan'}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Period History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <IconUsers />
            <div>
              <h3 className="text-lg font-semibold">Riwayat Periode</h3>
              <p className="text-sm text-default-500">Daftar semua periode yang pernah dibuat</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {allPeriods.length > 0 ? (
            <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table aria-label="Riwayat periode">
                <TableHeader>
                  <TableColumn>NAMA PERIODE</TableColumn>
                  <TableColumn>TAHUN AKADEMIK</TableColumn>
                  <TableColumn>SEMESTER</TableColumn>
                  <TableColumn>TANGGAL</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>AKSI</TableColumn>
                </TableHeader>
                <TableBody>
                  {allPeriods.map((periode) => (
                    <TableRow key={periode.id}>
                      <TableCell>{periode.nama}</TableCell>
                      <TableCell>{periode.tahun_akademik}</TableCell>
                      <TableCell className="capitalize">{periode.semester}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(periode.tanggal_mulai)} - {formatDate(periode.tanggal_akhir)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={getStatusColor(periode.status)} variant="flat" size="sm">
                          {getStatusText(periode.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {periode.status === 'belum_mulai' && (
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => updatePeriodStatus(periode.id, 'berlangsung')}
                            >
                              Mulai
                            </Button>
                          )}
                          {periode.status === 'berlangsung' && (
                            <Button
                              size="sm"
                              color="danger"
                            variant="flat"
                            onPress={() => updatePeriodStatus(periode.id, 'selesai')}
                          >
                            Akhiri
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            {allPeriods.length > 0 ? (
              <div className="space-y-3">
                {allPeriods.map((periode) => (
                  <Card key={periode.id} className="w-full">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{periode.nama}</h4>
                          <p className="text-sm text-default-600">{periode.tahun_akademik} • <span className="capitalize">{periode.semester}</span></p>
                        </div>
                        <Chip color={getStatusColor(periode.status)} variant="flat" size="sm">
                          {getStatusText(periode.status)}
                        </Chip>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-default-400" />
                          <span className="text-sm">{formatDate(periode.tanggal_mulai)} - {formatDate(periode.tanggal_akhir)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {periode.status === 'belum_mulai' && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => updatePeriodStatus(periode.id, 'berlangsung')}
                            className="flex-1 min-w-[80px]"
                          >
                            Mulai
                          </Button>
                        )}
                        {periode.status === 'berlangsung' && (
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => updatePeriodStatus(periode.id, 'selesai')}
                            className="flex-1 min-w-[80px]"
                          >
                            Akhiri
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-default-500">Belum ada periode yang dibuat</p>
              </div>
            )}
          </div>
            </>
        ) : (
          <div className="text-center py-8">
            <p className="text-default-500">Belum ada periode yang dibuat</p>
          </div>
        )}
        </CardBody>
      </Card>

      {/* Create Period Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3>Buat Periode Baru</h3>
                {nextPeriodInfo && (
                  <p className="text-sm text-default-500">
                    {nextPeriodInfo.isNewCycle ? 
                      'Memulai siklus periode baru (kepengurusan baru)' : 
                      `Melanjutkan ke periode ${nextPeriodInfo.nextSemester}`
                    }
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Nama Periode"
                    placeholder="Masukkan nama periode"
                    value={formData.nama}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, nama: value }))}
                    isRequired
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Tahun Akademik"
                      placeholder="2025/2026"
                      value={formData.tahun_akademik}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tahun_akademik: value }))}
                      isRequired
                    />
                    
                    <Select
                      label="Semester"
                      selectedKeys={[formData.semester]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as 'genap' | 'ganjil';
                        const defaultDates = generateDefaultDates(value, formData.tahun_akademik);
                        setFormData(prev => ({ 
                          ...prev, 
                          semester: value,
                          tanggal_mulai: defaultDates.tanggal_mulai,
                          tanggal_akhir: defaultDates.tanggal_akhir
                        }));
                      }}
                      isRequired
                      isDisabled={!!nextPeriodInfo && !nextPeriodInfo.isNewCycle}
                    >
                      <SelectItem key="genap">Genap</SelectItem>
                      <SelectItem key="ganjil">Ganjil</SelectItem>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Tanggal Mulai"
                      value={formData.tanggal_mulai}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tanggal_mulai: value }))}
                      isRequired
                    />
                    
                    <Input
                      type="date"
                      label="Tanggal Akhir"
                      value={formData.tanggal_akhir}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tanggal_akhir: value }))}
                      isRequired
                    />
                  </div>
                  
                  <Textarea
                    label="Deskripsi"
                    placeholder="Masukkan deskripsi periode (opsional)"
                    value={formData.deskripsi}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, deskripsi: value }))}
                    minRows={3}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!formData.nama || !formData.tahun_akademik || !formData.tanggal_mulai || !formData.tanggal_akhir}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Periode'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Fix Data Confirmation Modal */}
      <Modal 
        isOpen={fixDataModal.isOpen} 
        onOpenChange={(open) => !open && closeFixDataModal()}
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-warning">Perbaiki Data Pertemuan</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-default-700">
                Apakah Anda yakin ingin memperbaiki data pertemuan yang belum memiliki periode_id?
              </p>
              <div className="bg-warning/10 p-3 rounded-lg border-l-4 border-warning">
                <p className="text-sm text-default-800">
                  <span className="font-semibold">Proses ini akan:</span>
                </p>
                <ul className="text-xs text-default-600 mt-1 space-y-1 ml-4">
                  <li>• Mengisi periode_id yang kosong dengan periode aktif</li>
                  <li>• Menampilkan data pertemuan di tabel periode admin</li>
                  <li>• Tidak mengubah data yang sudah memiliki periode_id</li>
                </ul>
              </div>
              <p className="text-sm text-primary">
                ✅ Proses ini aman dan tidak akan menghapus data apapun
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={closeFixDataModal}
              isDisabled={fixDataModal.isProcessing}
            >
              Batal
            </Button>
            <Button 
              color="warning" 
              onPress={fixPeriodeId}
              isLoading={fixDataModal.isProcessing}
              className="font-semibold"
            >
              {fixDataModal.isProcessing ? 'Memperbaiki...' : 'Ya, Perbaiki Data'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
