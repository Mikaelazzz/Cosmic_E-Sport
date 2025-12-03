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
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Alert } from '@heroui/alert';
import { Selection, SortDescriptor } from '@heroui/table';
import { useAuth } from '@/context/AuthContext';
import ModeratorLayout from '@/components/ModeratorLayout';

// Custom icons
const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
);

const IconPlus = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
  </svg>
);

const IconChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 10.293l3.146-3.147a.5.5 0 01.708.708L8 11.707 4.146 7.854a.5.5 0 01.708-.708L8 10.293z"/>
  </svg>
);

const IconDotsVertical = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.5 13a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
  </svg>
);

const IconEye = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
  </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 9.207l-3-3L12.146.146zM11.207 9.5L9 7.293 4.5 11.793V13.5h1.707l4.5-4.5-.5-.5zM.5 13.5V16h2.5l9-9-2.5-2.5L.5 13.5z"/>
  </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
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
  expected_semester?: string;
  expected_tahun_akademik?: string;
  available_periods?: Array<{
    id: string;
    nama: string;
    tahun_akademik: string;
    semester: string;
    status: string;
  }>;
  message?: string;
  transition_period?: boolean;
}

// Constants
const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "NAMA TOPIK", uid: "nama_topik", sortable: true },
  { name: "HARI", uid: "hari", sortable: true },
  { name: "TANGGAL", uid: "tanggal", sortable: true },
  { name: "KELAS", uid: "kelas", sortable: true },
  { name: "JAM PERTEMUAN", uid: "jam_pertemuan", sortable: true },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "Belum Mulai", uid: "belum_mulai" },
  { name: "Berlangsung", uid: "berlangsung" },
  { name: "Selesai", uid: "selesai" },
  { name: "Dibatalkan", uid: "dibatalkan" },
];

const INITIAL_VISIBLE_COLUMNS = ["nama_topik", "hari", "tanggal", "kelas", "jam_pertemuan", "status", "actions"];

export default function JadwalPertemuanPage() {
  // Auth context
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [jadwalPertemuan, setJadwalPertemuan] = useState<JadwalPertemuan[]>([]);
  const [periodeStatus, setPeriodeStatus] = useState<PeriodeStatus | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "tanggal",
    direction: "ascending",
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
  }>({
    show: false,
    jadwal: null,
    isDeleting: false
  });

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

  // Fetch periode status
  const fetchPeriodeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/periode/status');
      const result = await response.json();
      
      if (result.success) {
        setPeriodeStatus(result.data);
      } else {
        showAlert('Warning!', 'Gagal mengambil status periode', 'warning');
      }
    } catch (error) {
      console.error('Error fetching periode status:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil status periode', 'danger');
    }
  }, []);

  // Fetch jadwal pertemuan
  const fetchJadwalPertemuan = useCallback(async () => {
    try {
      const response = await fetch('/api/moderator/jadwal-pertemuan');
      const result = await response.json();
      
      if (result.success) {
        setJadwalPertemuan(result.data);
      } else {
        showAlert('Error!', 'Gagal mengambil data jadwal pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error fetching jadwal pertemuan:', error);
      showAlert('Error!', 'Terjadi kesalahan saat mengambil data jadwal pertemuan', 'danger');
    }
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPeriodeStatus(),
        fetchJadwalPertemuan()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchPeriodeStatus, fetchJadwalPertemuan]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let filteredJadwal = [...jadwalPertemuan];

    if (filterValue) {
      filteredJadwal = filteredJadwal.filter((jadwal) =>
        jadwal.nama_topik.toLowerCase().includes(filterValue.toLowerCase()) ||
        jadwal.hari.toLowerCase().includes(filterValue.toLowerCase()) ||
        jadwal.kelas.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredJadwal = filteredJadwal.filter((jadwal) =>
        Array.from(statusFilter).includes(jadwal.status),
      );
    }

    return filteredJadwal;
  }, [jadwalPertemuan, filterValue, statusFilter]);

  // Paginated items
  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: JadwalPertemuan, b: JadwalPertemuan) => {
      const first = a[sortDescriptor.column as keyof JadwalPertemuan] as string;
      const second = b[sortDescriptor.column as keyof JadwalPertemuan] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // Submit form
  const handleSubmit = async () => {
    if (!formData.nama_topik || !formData.hari || !formData.tanggal || !formData.kelas || !formData.jam_pertemuan) {
      showAlert('Error!', 'Mohon lengkapi semua field yang diperlukan', 'danger');
      return;
    }

    if (!periodeStatus?.has_active_period) {
      showAlert('Error!', 'Tidak ada periode aktif. Mohon hubungi admin untuk mengaktifkan periode.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingJadwal ? '/api/moderator/jadwal-pertemuan' : '/api/moderator/jadwal-pertemuan';
      const method = editingJadwal ? 'PUT' : 'POST';
      let payload: any = { ...formData };
      if (editingJadwal) {
        payload.id = editingJadwal.id;
      } else {
        payload.created_by = user?.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        await fetchJadwalPertemuan();
        onFormClose();
        resetForm();
        showAlert('Berhasil!', editingJadwal ? 'Jadwal pertemuan berhasil diperbarui!' : 'Jadwal pertemuan berhasil dibuat!', 'success');
      } else {
        showAlert('Error!', result.message || 'Gagal menyimpan jadwal pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showAlert('Error!', 'Terjadi kesalahan saat menyimpan jadwal', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_topik: '',
      hari: '',
      tanggal: '',
      kelas: '',
      jam_pertemuan: '',
      status: 'belum_mulai',
    });
    setEditingJadwal(null);
  };

  // Handle edit
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

  // Handle detail
  const handleDetail = (jadwal: JadwalPertemuan) => {
    router.push(`/moderator/jadwal-pertemuan/${jadwal.id}`);
  };

  // Open delete modal
  const openDeleteModal = (jadwal: JadwalPertemuan) => {
    setDeleteModal({
      show: true,
      jadwal: jadwal,
      isDeleting: false
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        show: false,
        jadwal: null,
        isDeleting: false
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.jadwal) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const response = await fetch(`/api/moderator/jadwal-pertemuan?id=${deleteModal.jadwal.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        await fetchJadwalPertemuan();
        showAlert('Berhasil!', 'Jadwal pertemuan berhasil dihapus!', 'success');
        closeDeleteModal();
      } else {
        showAlert('Error!', result.message || 'Gagal menghapus jadwal pertemuan', 'danger');
      }
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      showAlert('Error!', 'Terjadi kesalahan saat menghapus jadwal', 'danger');
    } finally {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Render cell content
  const renderCell = useCallback((jadwal: JadwalPertemuan, columnKey: React.Key) => {
    const cellValue = jadwal[columnKey as keyof JadwalPertemuan];

    switch (columnKey) {
      case "nama_topik":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize text-default-400">{cellValue}</p>
          </div>
        );
      case "hari":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
          </div>
        );
      case "tanggal":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">
              {new Date(cellValue as string).toLocaleDateString('id-ID')}
            </p>
          </div>
        );
      case "kelas":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
          </div>
        );
      case "jam_pertemuan":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{cellValue}</p>
          </div>
        );
      case "status":
        const statusColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
          belum_mulai: "warning",
          berlangsung: "primary", 
          selesai: "success",
          dibatalkan: "danger",
        };

        const statusLabelMap: Record<string, string> = {
          belum_mulai: "Belum Mulai",
          berlangsung: "Berlangsung",
          selesai: "Selesai", 
          dibatalkan: "Dibatalkan",
        };

        return (
          <Chip className="capitalize" color={statusColorMap[jadwal.status]} size="sm" variant="flat">
            {statusLabelMap[jadwal.status] || cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <IconDotsVertical className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="detail" onClick={() => handleDetail(jadwal)} startContent={<IconEye />}>
                  Detail
                </DropdownItem>
                <DropdownItem key="edit" onClick={() => handleEdit(jadwal)} startContent={<IconEdit />}>
                  Edit
                </DropdownItem>
                <DropdownItem key="delete" onClick={() => openDeleteModal(jadwal)} className="text-danger" color="danger" startContent={<IconTrash />}>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue as React.ReactNode;
    }
  }, [router]);

  // Cleanup: topContent and bottomContent removed - now using inline controls

  if (loading) {
    return (
      <section className='p-4 sm:p-6 md:p-8 border-2 border-[#ffd700] rounded-lg max-w-7xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white my-8 sm:mb-10'>
        <div className='text-center py-6 sm:py-10 text-yellow-400'>
          <div className='flex items-center justify-center gap-2 sm:gap-3'>
            <div className='w-6 h-6 sm:w-8 sm:h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
            <p className='text-lg sm:text-xl font-bold'>Memuat data jadwal pertemuan...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ModeratorLayout
      title="Jadwal Pertemuan"
      description=""
    >
      <section>

      <div className="space-y-6">
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
            className="border-yellow-400 bg-gray-800/50"
            classNames={{
              title: "text-yellow-400",
              description: "text-gray-300"
            }}
          />
        )}

        {/* Header
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-yellow-400">Jadwal Pertemuan</h1>
            <p className="text-gray-400 text-center">Kelola jadwal pertemuan untuk periode yang aktif</p>
          </div>
        </div> */}

        {/* Periode Status & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Periode Status */}
          {periodeStatus && (
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-dashed border-yellow-400 shadow-lg transform transition-all duration-500 hover:scale-[1.02]">
              {periodeStatus.has_active_period ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-yellow-400 mb-6">Periode Aktif!</h3>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <span className="text-yellow-400 font-medium mb-1 sm:mb-0">Nama Periode:</span>
                      <span className="text-yellow-300 font-bold text-lg">{periodeStatus.current_period?.nama_periode}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <span className="text-yellow-400 font-medium mb-1 sm:mb-0">Tahun Akademik:</span>
                      <span className="text-yellow-300 font-bold text-lg">{periodeStatus.current_period?.tahun_akademik}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <span className="text-yellow-400 font-medium mb-1 sm:mb-0">Semester:</span>
                      <span className="text-yellow-300 font-bold text-lg capitalize">{periodeStatus.current_period?.semester}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <span className="text-yellow-400 font-medium mb-1 sm:mb-0">Periode:</span>
                      <span className="text-yellow-300 font-bold text-lg">
                        {periodeStatus.current_period?.tanggal_mulai && new Date(periodeStatus.current_period.tanggal_mulai).toLocaleDateString('id-ID')} - 
                        {periodeStatus.current_period?.tanggal_akhir && new Date(periodeStatus.current_period.tanggal_akhir).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg">
                      <span className="text-yellow-400 font-medium mb-1 sm:mb-0">Total Jadwal:</span>
                      <span className="text-green-400 font-bold text-lg">{jadwalPertemuan.length} pertemuan</span>
                    </div>
                  </div>
                </div>
              ) : periodeStatus.transition_period ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-orange-400 mb-4">Masa Transisi Semester</h3>
                  <p className="text-center text-gray-300">{periodeStatus.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-red-400 mb-4">Tidak Ada Periode Aktif</h3>
                  <p className="text-center text-gray-300 mb-4">{periodeStatus.message}</p>
                  {periodeStatus.expected_semester && periodeStatus.expected_tahun_akademik && (
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-400 mb-2">Periode yang diharapkan:</p>
                      <p className="text-yellow-300 font-bold text-lg capitalize">
                        {periodeStatus.expected_semester} {periodeStatus.expected_tahun_akademik}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-dashed border-yellow-400 shadow-lg transform transition-all duration-500 hover:scale-[1.02]">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <IconPlus className="text-black" />
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold text-lg">Quick Actions</p>
                  <p className="text-xs text-gray-400">Aksi cepat jadwal pertemuan</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  className="w-full py-2 sm:py-3 text-sm sm:text-base bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all duration-300"
                  startContent={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                  }
                  onPress={() => {
                    if (periodeStatus?.has_active_period) {
                      resetForm();
                      onFormOpen();
                    } else {
                      showAlert('Warning!', 'Tidak ada periode aktif. Hubungi admin untuk mengaktifkan periode.', 'warning');
                    }
                  }}
                  isDisabled={!periodeStatus?.has_active_period}
                >
                  Buat Jadwal Baru
                </Button>
                
                <Button
                  className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gray-600 hover:bg-gray-700 border border-gray-500 text-white font-bold rounded-lg transition-all duration-300"
                  startContent={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
                      <path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.5 13 8 13c-1.5 0-3.309.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z"/>
                    </svg>
                  }
                  onPress={() => {
                    fetchJadwalPertemuan();
                    showAlert('Info', 'Data jadwal pertemuan telah diperbarui', 'primary');
                  }}
                >
                  Refresh Data
                </Button>

                <Button
                  className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gray-600 hover:bg-gray-700 border border-gray-500 text-white font-bold rounded-lg transition-all duration-300"
                  startContent={<IconEye className="w-4 h-4" />}
                  onPress={() => {
                    router.push('/moderator/jadwal-pertemuan');
                  }}
                >
                  Kelola Absensi
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tabel Jadwal */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-dashed border-yellow-400 shadow-lg">
          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-6">
            <h4 className="text-xl font-bold text-yellow-400 border-b border-yellow-400 pb-3">
              Data Jadwal Pertemuan ({jadwalPertemuan.length})
            </h4>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <Input
                isClearable
                className="w-full lg:max-w-md"
                placeholder="Cari berdasarkan nama topik, hari, atau kelas..."
                startContent={<IconSearch className="text-gray-400" />}
                value={filterValue}
                onClear={() => setFilterValue("")}
                onValueChange={setFilterValue}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300",
                  inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                }}
              />
              
              <div className="flex flex-wrap gap-3 items-center">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered"
                      endContent={<IconChevronDown className="text-small" />}
                      className="border-gray-600 text-gray-300 hover:border-yellow-400"
                    >
                      Status ({Array.from(statusFilter).length})
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Status Filter"
                    closeOnSelect={false}
                    selectedKeys={statusFilter}
                    selectionMode="multiple"
                    onSelectionChange={setStatusFilter}
                    className="bg-gray-800"
                  >
                    {statusOptions.map((status) => (
                      <DropdownItem key={status.uid} className="text-gray-300">
                        {status.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                
                <label className="flex items-center text-gray-400 text-sm whitespace-nowrap">
                  Per halaman:
                  <select
                    className="bg-gray-700 border border-gray-600 hover:border-yellow-400 focus:border-yellow-400 text-white text-sm ml-2 px-2 py-1 rounded transition-colors"
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          
          {/* Mobile Card View - Hidden on desktop */}
          <div className="lg:hidden">
            {/* Mobile Cards */}
            <div className="space-y-4">
              {sortedItems.length === 0 ? (
                <Card className="bg-gray-900 border-gray-700">
                  <CardBody className="text-center py-8">
                    <p className="text-gray-400">Tidak ada jadwal pertemuan yang ditemukan</p>
                  </CardBody>
                </Card>
              ) : (
                sortedItems.map((jadwal) => (
                  <Card key={jadwal.id} className="bg-gray-900 border-gray-700 hover:border-yellow-400/50 transition-colors">
                    <CardBody className="p-4">
                      <div className="space-y-3">
                        {/* Header with Status */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-400 text-lg mb-1">
                              {jadwal.nama_topik}
                            </h3>
                            <p className="text-sm text-gray-400">ID: {jadwal.id}</p>
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              jadwal.status === 'berlangsung' ? 'success' :
                              jadwal.status === 'selesai' ? 'primary' :
                              jadwal.status === 'dibatalkan' ? 'danger' : 'warning'
                            }
                            className="capitalize"
                          >
                            {jadwal.status.replace('_', ' ')}
                          </Chip>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Hari:</span>
                            <p className="text-gray-200 font-medium">{jadwal.hari}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Tanggal:</span>
                            <p className="text-gray-200 font-medium">{jadwal.tanggal}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Kelas:</span>
                            <p className="text-gray-200 font-medium">{jadwal.kelas}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Jam:</span>
                            <p className="text-gray-200 font-medium">{jadwal.jam_pertemuan}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<IconEye className="w-4 h-4" />}
                            onPress={() => router.push(`/moderator/jadwal-pertemuan/${jadwal.id}`)}
                            className="flex-1 min-w-0"
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            startContent={<IconEdit className="w-4 h-4" />}
                            onPress={() => handleEdit(jadwal)}
                            className="flex-1 min-w-0"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            startContent={<IconTrash className="w-4 h-4" />}
                            onPress={() => openDeleteModal(jadwal)}
                            className="flex-1 min-w-0"
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>

            {/* Mobile Bottom Info & Pagination */}
            {filteredItems.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Data Count Info */}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>
                    Menampilkan {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredItems.length)} dari {filteredItems.length} jadwal
                  </span>
                  <span>
                    Halaman {page} dari {pages}
                  </span>
                </div>
                
                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={page}
                      total={pages}
                      onChange={setPage}
                      classNames={{
                        wrapper: "gap-0 overflow-visible h-8",
                        item: "w-8 h-8 text-small rounded-none bg-transparent",
                        cursor: "bg-yellow-400 text-gray-900 font-bold",
                      }}
                    />
                  </div>
                )}
                
                {/* Rows per page selector for mobile */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Baris per halaman:</span>
                    <select
                      className="bg-gray-700 border border-gray-600 hover:border-yellow-400 focus:border-yellow-400 text-white text-sm px-2 py-1 rounded transition-colors"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Table Section - Hidden on mobile */}
          <div className="hidden lg:block">
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <Table
                aria-label="Jadwal Pertemuan table"
                removeWrapper
                classNames={{
                  table: "min-w-full",
                  th: "bg-gray-800 text-yellow-400 border-b-2 border-yellow-400/50 font-bold text-sm px-4 py-3 whitespace-nowrap",
                  td: "border-b border-gray-700 text-gray-300 px-4 py-4",
                  tbody: "divide-y divide-gray-700"
                }}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
              >
              <TableHeader columns={columns.filter(column => Array.from(visibleColumns).includes(column.uid))}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.sortable}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody 
                emptyContent={
                  <div className="text-center py-8 text-gray-400">
                    <p>Tidak ada jadwal pertemuan yang ditemukan</p>
                  </div>
                } 
                items={sortedItems}
              >
                {(item) => (
                  <TableRow key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
          
          {/* Desktop Footer: Info and Pagination */}
          {filteredItems.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-700">
              <span className="text-sm text-gray-400">
                Menampilkan {sortedItems.length} dari {filteredItems.length} data
                {selectedKeys !== "all" && selectedKeys.size > 0 && (
                  <span className="ml-2 text-yellow-400">({selectedKeys.size} dipilih)</span>
                )}
              </span>
              
              {pages > 1 && (
                <Pagination
                  isCompact
                  showControls
                  page={page}
                  total={pages}
                  onChange={setPage}
                  classNames={{
                    wrapper: "gap-0 overflow-visible h-8 rounded border border-yellow-400",
                    item: "w-8 h-8 text-small rounded-none bg-transparent text-gray-400 hover:bg-yellow-400 hover:text-black transition-colors",
                    cursor: "bg-yellow-500 shadow-lg text-black font-bold"
                  }}
                />
              )}
            </div>
          )}
          </div>
          
          {/* Empty State */}
          {filteredItems.length === 0 && jadwalPertemuan.length > 0 && (
            <div className="text-center py-8 mt-6 border-t border-gray-700">
              <div className="text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">Tidak ada hasil ditemukan</p>
                <p className="text-sm">Coba ubah kata kunci pencarian atau filter yang digunakan</p>
              </div>
            </div>
          )}
        </div>

        {/* Form Modal */}
        <Modal isOpen={isFormOpen} onClose={onFormClose} size="2xl" className="bg-gray-800">
          <ModalContent className="bg-gray-800 text-white border border-yellow-400">
            <ModalHeader className="flex flex-col gap-1 border-b border-yellow-400/30">
              <h3 className="text-yellow-400 font-bold">
                {editingJadwal ? 'Edit Jadwal Pertemuan' : 'Tambah Jadwal Pertemuan Baru'}
              </h3>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Topik"
                  placeholder="Masukkan nama topik pertemuan"
                  value={formData.nama_topik}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_topik: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    label: "text-gray-300",
                    inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                  }}
                />
                <Input
                  label="Hari"
                  placeholder="Contoh: Senin"
                  value={formData.hari}
                  onChange={(e) => setFormData(prev => ({ ...prev, hari: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    label: "text-gray-300",
                    inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                  }}
                />
                <Input
                  type="date"
                  label="Tanggal"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    label: "text-gray-300",
                    inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                  }}
                />
                <Input
                  label="Kelas"
                  placeholder="Contoh: Kelas A"
                  value={formData.kelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    label: "text-gray-300",
                    inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                  }}
                />
                <Input
                  label="Jam Pertemuan"
                  placeholder="Contoh: 08:00 - 10:00"
                  value={formData.jam_pertemuan}
                  onChange={(e) => setFormData(prev => ({ ...prev, jam_pertemuan: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    label: "text-gray-300",
                    inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400 bg-gray-700"
                  }}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 hover:border-yellow-400 focus:border-yellow-400 rounded-lg text-white transition-colors"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as JadwalPertemuan['status'] }))}
                  >
                    <option value="belum_mulai">Belum Mulai</option>
                    <option value="berlangsung">Berlangsung</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-yellow-400/30">
              <Button 
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold"
                onPress={onFormClose}
              >
                Batal
              </Button>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                onPress={handleSubmit} 
                isLoading={isSubmitting}
              >
                {editingJadwal ? 'Update' : 'Simpan'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal 
          isOpen={deleteModal.show} 
          onClose={closeDeleteModal}
          size="md"
          backdrop="blur"
          hideCloseButton={deleteModal.isDeleting}
          isDismissable={!deleteModal.isDeleting}
          className="bg-gray-800"
        >
          <ModalContent className="bg-gray-800 text-white border border-red-400">
            <ModalHeader className="border-b border-red-400/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className="text-danger">Hapus Jadwal Pertemuan</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                <p className="text-default-700">
                  Apakah Anda yakin ingin menghapus jadwal pertemuan ini?
                </p>
                {deleteModal.jadwal && (
                  <div className="bg-default-100 p-3 rounded-lg border-l-4 border-danger">
                    <p className="font-semibold text-sm text-default-800">
                      {deleteModal.jadwal.nama_topik}
                    </p>
                    <p className="text-xs text-default-600">
                      {deleteModal.jadwal.hari}, {new Date(deleteModal.jadwal.tanggal).toLocaleDateString('id-ID')} - {deleteModal.jadwal.kelas}
                    </p>
                  </div>
                )}
                <p className="text-sm text-danger font-medium">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-red-400/30">
              <Button 
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold"
                onPress={closeDeleteModal}
                isDisabled={deleteModal.isDeleting}
              >
                Batal
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white font-bold"
                onPress={handleDelete}
                isLoading={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
      </section>
    </ModeratorLayout>
  );
}
