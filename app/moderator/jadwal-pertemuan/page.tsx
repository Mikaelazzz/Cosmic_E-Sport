"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Chip } from '@heroui/chip';
import { Pagination } from '@heroui/pagination';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';
import { Card, CardBody } from '@heroui/card';
import { Alert } from '@heroui/alert';
import { Selection, SortDescriptor } from '@heroui/table';
import { useAuth } from '@/context/AuthContext';
import ModeratorLayout from '@/components/ModeratorLayout';
import {
  Search,
  Plus,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  CalendarDays,
  GraduationCap,
  Filter,
} from 'lucide-react';

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

interface PeriodeStatus {
  has_active_period: boolean;
  current_period?: {
    id: string;
    nama_periode: string;
    tahun_akademik: string;
    semester: string;
    tanggal_mulai: string;
    tanggal_akhir: string;
    deskripsi?: string;
  };
  message?: string;
}

// Constants
const columns = [
  { name: "TOPIK", uid: "nama_topik", sortable: true },
  { name: "HARI", uid: "hari", sortable: true },
  { name: "TANGGAL", uid: "tanggal", sortable: true },
  { name: "KELAS", uid: "kelas", sortable: true },
  { name: "JAM", uid: "jam_pertemuan", sortable: true },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "", uid: "actions" },
];

const statusOptions = [
  { name: "Belum Mulai", uid: "belum_mulai" },
  { name: "Berlangsung", uid: "berlangsung" },
  { name: "Selesai", uid: "selesai" },
  { name: "Dibatalkan", uid: "dibatalkan" },
];

const statusConfig: Record<string, { color: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; label: string; icon: React.ReactNode }> = {
  belum_mulai: { color: "warning", label: "Belum Mulai", icon: <Timer className="w-4 h-4" /> },
  berlangsung: { color: "primary", label: "Berlangsung", icon: <Clock className="w-4 h-4" /> },
  selesai: { color: "success", label: "Selesai", icon: <CheckCircle2 className="w-4 h-4" /> },
  dibatalkan: { color: "danger", label: "Dibatalkan", icon: <XCircle className="w-4 h-4" /> },
};


// Helper: get day name from date
function getDayName(dateStr: string): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const date = new Date(dateStr);
  return days[date.getDay()] || '';
}

// Helper: format date nicely
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JadwalPertemuanPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [jadwalPertemuan, setJadwalPertemuan] = useState<JadwalPertemuan[]>([]);
  const [periodeStatus, setPeriodeStatus] = useState<PeriodeStatus | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "tanggal",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalPertemuan | null>(null);

  // Modal states
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    jadwal: JadwalPertemuan | null;
    isDeleting: boolean;
  }>({ show: false, jadwal: null, isDeleting: false });

  // Form state
  const [formData, setFormData] = useState({
    nama_topik: '',
    hari: '',
    tanggal: '',
    kelas: '',
    jam_pertemuan: '',
    status: 'belum_mulai' as JadwalPertemuan['status'],
  });

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    description: string;
    color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary';
  }>({ show: false, title: '', description: '', color: 'primary' });

  const showAlert = (title: string, description: string, color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary' = 'primary') => {
    setAlertConfig({ show: true, title, description, color });
    setTimeout(() => setAlertConfig(prev => ({ ...prev, show: false })), 4000);
  };

  // Auto-fill day when date changes
  const handleDateChange = (dateValue: string) => {
    setFormData(prev => ({
      ...prev,
      tanggal: dateValue,
      hari: dateValue ? getDayName(dateValue) : prev.hari,
    }));
  };

  // Fetch data
  const fetchPeriodeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/periode/status');
      const result = await response.json();
      if (result.success) setPeriodeStatus(result.data);
      else showAlert('Peringatan', 'Gagal mengambil status periode', 'warning');
    } catch {
      showAlert('Error', 'Terjadi kesalahan saat mengambil status periode', 'danger');
    }
  }, []);

  const fetchJadwalPertemuan = useCallback(async () => {
    try {
      const response = await fetch('/api/moderator/jadwal-pertemuan');
      const result = await response.json();
      if (result.success) setJadwalPertemuan(result.data);
      else showAlert('Error', 'Gagal mengambil data jadwal pertemuan', 'danger');
    } catch {
      showAlert('Error', 'Terjadi kesalahan saat mengambil data', 'danger');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPeriodeStatus(), fetchJadwalPertemuan()]);
      setLoading(false);
    };
    if (user) loadData();
  }, [user, fetchPeriodeStatus, fetchJadwalPertemuan]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let filtered = [...jadwalPertemuan];
    if (filterValue) {
      const search = filterValue.toLowerCase();
      filtered = filtered.filter(j =>
        j.nama_topik.toLowerCase().includes(search) ||
        j.hari.toLowerCase().includes(search) ||
        j.kelas.toLowerCase().includes(search)
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filtered = filtered.filter(j => Array.from(statusFilter).includes(j.status));
    }
    return filtered;
  }, [jadwalPertemuan, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...paginatedItems].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof JadwalPertemuan] as string;
      const second = b[sortDescriptor.column as keyof JadwalPertemuan] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, paginatedItems]);

  // CRUD handlers
  const handleSubmit = async () => {
    if (!formData.nama_topik || !formData.hari || !formData.tanggal || !formData.kelas || !formData.jam_pertemuan) {
      showAlert('Error', 'Mohon lengkapi semua field yang diperlukan', 'danger');
      return;
    }
    if (!periodeStatus?.has_active_period) {
      showAlert('Error', 'Tidak ada periode aktif. Hubungi admin.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingJadwal ? 'PUT' : 'POST';
      const payload: any = { ...formData };
      if (editingJadwal) payload.id = editingJadwal.id;
      else payload.created_by = user?.id;

      const response = await fetch('/api/moderator/jadwal-pertemuan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        await fetchJadwalPertemuan();
        onFormClose();
        resetForm();
        showAlert('Berhasil', editingJadwal ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil dibuat', 'success');
      } else {
        showAlert('Error', result.message || 'Gagal menyimpan jadwal', 'danger');
      }
    } catch {
      showAlert('Error', 'Terjadi kesalahan saat menyimpan', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama_topik: '', hari: '', tanggal: '', kelas: '', jam_pertemuan: '', status: 'belum_mulai' });
    setEditingJadwal(null);
  };

  const handleEdit = (jadwal: JadwalPertemuan) => {
    setEditingJadwal(jadwal);
    setFormData({
      nama_topik: jadwal.nama_topik,
      hari: jadwal.hari,
      tanggal: jadwal.tanggal,
      kelas: jadwal.kelas,
      jam_pertemuan: jadwal.jam_pertemuan,
      status: jadwal.status,
    });
    onFormOpen();
  };

  const openDeleteModal = (jadwal: JadwalPertemuan) => {
    setDeleteModal({ show: true, jadwal, isDeleting: false });
  };

  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) setDeleteModal({ show: false, jadwal: null, isDeleting: false });
  };

  const handleDelete = async () => {
    if (!deleteModal.jadwal) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const response = await fetch(`/api/moderator/jadwal-pertemuan?id=${deleteModal.jadwal.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.success) {
        await fetchJadwalPertemuan();
        showAlert('Berhasil', 'Jadwal berhasil dihapus', 'success');
        closeDeleteModal();
      } else {
        showAlert('Error', result.message || 'Gagal menghapus jadwal', 'danger');
      }
    } catch {
      showAlert('Error', 'Terjadi kesalahan saat menghapus', 'danger');
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Render cell
  const renderCell = useCallback((jadwal: JadwalPertemuan, columnKey: React.Key) => {
    switch (columnKey) {
      case "nama_topik":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{jadwal.nama_topik}</p>
            </div>
          </div>
        );
      case "hari":
        return <span className="text-default-600 capitalize">{jadwal.hari}</span>;
      case "tanggal":
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-default-400" />
            <span className="text-default-600">{formatDate(jadwal.tanggal)}</span>
          </div>
        );
      case "kelas":
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-default-400" />
            <span className="text-default-600">{jadwal.kelas}</span>
          </div>
        );
      case "jam_pertemuan":
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-default-400" />
            <span className="text-default-600">{jadwal.jam_pertemuan}</span>
          </div>
        );
      case "status": {
        const config = statusConfig[jadwal.status];
        return (
          <Chip
            size="sm"
            variant="flat"
            color={config?.color || "default"}
            startContent={config?.icon}
            className="gap-1"
          >
            {config?.label || jadwal.status}
          </Chip>
        );
      }
      case "actions":
        return (
          <div className="flex justify-end">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" className="text-default-400">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                <DropdownItem
                  key="detail"
                  startContent={<Eye className="w-4 h-4" />}
                  onPress={() => router.push(`/moderator/jadwal-pertemuan/${jadwal.id}`)}
                >
                  Lihat Detail
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Pencil className="w-4 h-4" />}
                  onPress={() => handleEdit(jadwal)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 className="w-4 h-4" />}
                  onPress={() => openDeleteModal(jadwal)}
                >
                  Hapus
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return jadwal[columnKey as keyof JadwalPertemuan] as React.ReactNode;
    }
  }, [router]);

  // Stats
  const stats = useMemo(() => {
    const total = jadwalPertemuan.length;
    const belumMulai = jadwalPertemuan.filter(j => j.status === 'belum_mulai').length;
    const berlangsung = jadwalPertemuan.filter(j => j.status === 'berlangsung').length;
    const selesai = jadwalPertemuan.filter(j => j.status === 'selesai').length;
    return { total, belumMulai, berlangsung, selesai };
  }, [jadwalPertemuan]);

  // Loading state
  if (loading) {
    return (
      <ModeratorLayout title="Jadwal Pertemuan" description="Kelola jadwal pertemuan untuk periode aktif">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-default-500 text-sm animate-pulse">Memuat data jadwal pertemuan...</p>
        </div>
      </ModeratorLayout>
    );
  }

  return (
    <ModeratorLayout
      title="Jadwal Pertemuan"
      description="Kelola jadwal pertemuan untuk periode aktif"
    >
      <div className="space-y-6">
        {/* Alert */}
        {alertConfig.show && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <Alert
              hideIconWrapper
              color={alertConfig.color}
              description={alertConfig.description}
              title={alertConfig.title}
              variant="faded"
              isClosable
              onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
            />
          </div>
        )}

        {/* Period Info Banner - Separate Section */}
        {periodeStatus && (
          <Card className="border-none bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 shadow-sm">
            <CardBody className="py-3 px-4">
              <div className="flex items-center gap-3">
                {periodeStatus.has_active_period ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">
                          {periodeStatus.current_period?.nama_periode}
                        </span>
                        <Chip size="sm" variant="flat" color="success" className="h-5 text-xs">Aktif</Chip>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-default-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {periodeStatus.current_period?.tahun_akademik}
                        </span>
                        <span className="capitalize flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Semester {periodeStatus.current_period?.semester}
                        </span>
                        <span className="hidden sm:inline">
                          {periodeStatus.current_period?.tanggal_mulai && formatDate(periodeStatus.current_period.tanggal_mulai)} — {periodeStatus.current_period?.tanggal_akhir && formatDate(periodeStatus.current_period.tanggal_akhir)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground text-sm">Tidak Ada Periode Aktif</span>
                      <p className="text-xs text-default-500">{periodeStatus.message || 'Hubungi admin untuk mengaktifkan periode'}</p>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats Cards - Separate Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-default-500">Total Pertemuan</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.belumMulai}</p>
                  <p className="text-xs text-default-500">Belum Mulai</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.berlangsung}</p>
                  <p className="text-xs text-default-500">Berlangsung</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.selesai}</p>
                  <p className="text-xs text-default-500">Selesai</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm border-none">
          <CardBody className="p-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-divider">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input
                  isClearable
                  className="w-full sm:w-72"
                  placeholder="Cari topik, hari, atau kelas..."
                  size="sm"
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  value={filterValue}
                  onClear={() => setFilterValue("")}
                  onValueChange={(val) => { setFilterValue(val); setPage(1); }}
                  variant="bordered"
                />
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      variant="bordered"
                      endContent={<ChevronDown className="w-3.5 h-3.5" />}
                      startContent={<Filter className="w-3.5 h-3.5" />}
                      className="hidden sm:flex"
                    >
                      Status
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Status Filter"
                    closeOnSelect={false}
                    selectedKeys={statusFilter}
                    selectionMode="multiple"
                    onSelectionChange={(keys) => { setStatusFilter(keys); setPage(1); }}
                  >
                    {statusOptions.map((status) => (
                      <DropdownItem key={status.uid}>{status.name}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-default-400">
                  {filteredItems.length} jadwal
                </span>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    if (periodeStatus?.has_active_period) {
                      resetForm();
                      onFormOpen();
                    } else {
                      showAlert('Peringatan', 'Tidak ada periode aktif. Hubungi admin.', 'warning');
                    }
                  }}
                  isDisabled={!periodeStatus?.has_active_period}
                >
                  Tambah Jadwal
                </Button>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-default-300" />
                  </div>
                  <p className="text-default-500 font-medium">Tidak ada jadwal ditemukan</p>
                  <p className="text-default-400 text-sm mt-1">Coba ubah filter atau buat jadwal baru</p>
                </div>
              ) : (
                <div className="divide-y divide-divider">
                  {sortedItems.map((jadwal) => (
                    <div
                      key={jadwal.id}
                      className="p-4 hover:bg-default-50 transition-colors cursor-pointer active:bg-default-100"
                      onClick={() => router.push(`/moderator/jadwal-pertemuan/${jadwal.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-foreground truncate">{jadwal.nama_topik}</h3>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={statusConfig[jadwal.status]?.color || "default"}
                              className="flex-shrink-0 h-5 text-xs"
                            >
                              {statusConfig[jadwal.status]?.label || jadwal.status}
                            </Chip>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-default-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {jadwal.hari}, {formatDate(jadwal.tanggal)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {jadwal.jam_pertemuan}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {jadwal.kelas}
                            </span>
                          </div>
                        </div>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-default-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem
                              key="edit"
                              startContent={<Pencil className="w-4 h-4" />}
                              onPress={() => handleEdit(jadwal)}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => openDeleteModal(jadwal)}
                            >
                              Hapus
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Table
                aria-label="Jadwal Pertemuan"
                removeWrapper
                classNames={{
                  th: "bg-default-50 text-default-600 font-semibold text-xs uppercase tracking-wider",
                  td: "py-3",
                  tbody: "",
                }}
                
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn
                      key={column.uid}
                      align={column.uid === "actions" ? "end" : "start"}
                      allowsSorting={column.sortable}
                    >
                      {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody
                  emptyContent={
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-default-300" />
                      </div>
                      <p className="text-default-500 font-medium">Tidak ada jadwal ditemukan</p>
                      <p className="text-default-400 text-sm mt-1">Coba ubah filter atau buat jadwal baru</p>
                    </div>
                  }
                  items={sortedItems}
                >
                  {(item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-default-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/moderator/jadwal-pertemuan/${item.id}`)}
                    >
                      {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-divider">
                <div className="flex items-center gap-3 text-xs text-default-400">
                  <span>
                    {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredItems.length)} dari {filteredItems.length}
                  </span>
                  <select
                    className="bg-transparent border border-divider rounded-md text-xs px-2 py-1 text-default-600 focus:outline-none focus:border-primary"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  >
                    <option value={5}>5 / hal</option>
                    <option value={10}>10 / hal</option>
                    <option value={20}>20 / hal</option>
                  </select>
                </div>
                {pages > 1 && (
                  <Pagination
                    isCompact
                    showControls
                    size="sm"
                    page={page}
                    total={pages}
                    onChange={setPage}
                    classNames={{
                      cursor: "bg-primary text-primary-foreground font-semibold",
                    }}
                  />
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => { onFormClose(); resetForm(); }}
          size="2xl"
          backdrop="blur"
          placement="center"
          motionProps={{
            variants: {
              enter: { y: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
              exit: { y: 20, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
            },
          }}
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-3 pb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {editingJadwal ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {editingJadwal ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                </h3>
                <p className="text-xs text-default-500 font-normal">
                  {editingJadwal ? 'Perbarui informasi jadwal pertemuan' : 'Buat jadwal pertemuan baru untuk periode aktif'}
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Nama Topik"
                placeholder="Masukkan topik pertemuan"
                value={formData.nama_topik}
                onChange={(e) => setFormData(prev => ({ ...prev, nama_topik: e.target.value }))}
                isRequired
                variant="bordered"
                size="sm"
                startContent={<BookOpen className="w-4 h-4 text-default-400" />}
                labelPlacement="outside"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Tanggal"
                  value={formData.tanggal}
                  onChange={(e) => handleDateChange(e.target.value)}
                  isRequired
                  variant="bordered"
                  size="sm"
                  startContent={<Calendar className="w-4 h-4 text-default-400" />}
                  labelPlacement="outside"
                />
                <Input
                  label="Hari"
                  placeholder="Otomatis dari tanggal"
                  value={formData.hari}
                  onChange={(e) => setFormData(prev => ({ ...prev, hari: e.target.value }))}
                  isRequired
                  variant="bordered"
                  size="sm"
                  isReadOnly={!!formData.tanggal}
                  startContent={<CalendarDays className="w-4 h-4 text-default-400" />}
                  labelPlacement="outside"
                  // description={formData.tanggal ? "Otomatis terisi dari tanggal" : undefined}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Kelas"
                  placeholder="Contoh: Lab Komputer 1"
                  value={formData.kelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                  isRequired
                  variant="bordered"
                  size="sm"
                  startContent={<MapPin className="w-4 h-4 text-default-400" />}
                  labelPlacement="outside"
                />
                <Input
                  label="Jam Pertemuan"
                  placeholder="Contoh: 08:00 - 10:00"
                  value={formData.jam_pertemuan}
                  onChange={(e) => setFormData(prev => ({ ...prev, jam_pertemuan: e.target.value }))}
                  isRequired
                  variant="bordered"
                  size="sm"
                  startContent={<Clock className="w-4 h-4 text-default-400" />}
                  labelPlacement="outside"
                />
              </div>
              {editingJadwal && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-default-100 border border-default-200 hover:border-default-400 focus:border-primary rounded-lg text-sm text-foreground transition-colors focus:outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as JadwalPertemuan['status'] }))}
                  >
                    <option value="belum_mulai">Belum Mulai</option>
                    <option value="berlangsung">Berlangsung</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => { onFormClose(); resetForm(); }} size="sm">
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting} size="sm">
                {editingJadwal ? 'Simpan Perubahan' : 'Buat Jadwal'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.show}
          onClose={closeDeleteModal}
          size="sm"
          backdrop="blur"
          placement="center"
          hideCloseButton={deleteModal.isDeleting}
          isDismissable={!deleteModal.isDeleting}
        >
          <ModalContent>
            <ModalBody className="pt-6 pb-2 text-center">
              <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Hapus Jadwal?</h3>
              <p className="text-sm text-default-500 mt-1">
                Tindakan ini tidak dapat dibatalkan.
              </p>
              {deleteModal.jadwal && (
                <div className="bg-danger-50 dark:bg-danger-50/10 p-3 rounded-lg mt-3 text-left">
                  <p className="font-medium text-sm text-foreground">{deleteModal.jadwal.nama_topik}</p>
                  <p className="text-xs text-default-500 mt-0.5">
                    {deleteModal.jadwal.hari}, {formatDate(deleteModal.jadwal.tanggal)} • {deleteModal.jadwal.kelas}
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="justify-center gap-2 pb-5">
              <Button
                variant="flat"
                onPress={closeDeleteModal}
                isDisabled={deleteModal.isDeleting}
                size="sm"
                className="min-w-24"
              >
                Batal
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={deleteModal.isDeleting}
                size="sm"
                className="min-w-24"
              >
                {deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </ModeratorLayout>
  );
}
