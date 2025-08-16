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
import { IconPlus, IconEdit, IconTrash, IconCalendar, IconUsers, IconDownload, IconSearch } from '@/components/icons';
import { Meeting } from '@/types/index';

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
    
    const headers = ['Topik', 'Tanggal', 'Jam Mulai', 'Jam Akhir', 'Kelas', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredMeetings.map(meeting => [
        `"${meeting.nama_topik}"`,
        meeting.tanggal,
        meeting.jam_mulai,
        meeting.jam_akhir,
        `"${meeting.kelas}"`,
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
        alert('Periode berhasil dibuat!');
      } else {
        alert(result.message || 'Gagal membuat periode');
      }
    } catch (error) {
      console.error('Error creating period:', error);
      alert('Terjadi kesalahan saat membuat periode');
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
        alert('Status periode berhasil diperbarui!');
      } else {
        alert(result.message || 'Gagal memperbarui status');
      }
    } catch (error) {
      console.error('Error updating period status:', error);
      alert('Terjadi kesalahan saat memperbarui status');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Periode</h1>
          <p className="text-default-500">Kelola periode dan semester UKM</p>
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
                <Table aria-label="Daftar Pertemuan periode aktif">
                  <TableHeader>
                    <TableColumn>TOPIK</TableColumn>
                    <TableColumn>TANGGAL</TableColumn>
                    <TableColumn>WAKTU</TableColumn>
                    <TableColumn>KELAS</TableColumn>
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
    </div>
  );
}
