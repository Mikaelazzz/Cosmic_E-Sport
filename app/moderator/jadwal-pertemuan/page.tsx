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
    tahun_ajaran: string;
    semester: string;
  };
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
      const response = await fetch('/api/moderator/jadwal-pertemuan', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteModal.jadwal.id }),
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
                <DropdownItem key="edit" onClick={() => handleEdit(jadwal)}>Edit</DropdownItem>
                <DropdownItem key="delete" onClick={() => openDeleteModal(jadwal)} className="text-danger" color="danger">
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

  // Top content
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Cari berdasarkan nama topik, hari, atau kelas..."
            startContent={<IconSearch />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<IconChevronDown className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<IconChevronDown className="text-small" />} variant="flat">
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button 
              color="primary" 
              endContent={<IconPlus />} 
              onPress={() => {
                resetForm();
                onFormOpen();
              }}
            >
              Tambah Baru
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {jadwalPertemuan.length} jadwal pertemuan</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-2"
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    jadwalPertemuan.length,
    onFormOpen,
    resetForm,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage(1)}>
            First
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage(pages)}>
            Last
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, filteredItems.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner size="lg" />
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
            <h1 className="text-3xl font-bold text-white">Jadwal Pertemuan</h1>
            <p className="text-gray-300">Kelola jadwal pertemuan untuk periode yang aktif</p>
          </div>
        </div>

        {/* Periode Status */}
        {periodeStatus && (
          <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
            <CardBody>
              {periodeStatus.has_active_period ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-green-400 font-semibold">Periode Aktif</p>
                    <p className="text-sm text-gray-300">
                      {periodeStatus.current_period?.nama_periode} - {periodeStatus.current_period?.tahun_ajaran} ({periodeStatus.current_period?.semester})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-red-400 font-semibold">Tidak Ada Periode Aktif</p>
                    <p className="text-sm text-gray-300">Hubungi admin untuk mengaktifkan periode</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Main Content */}
        <Card className="border-2 border-[#FFD700]/30 bg-slate-800/50 backdrop-blur">
          <CardBody className="p-0">
            <Table
              aria-label="Jadwal Pertemuan table with custom cells"
              isHeaderSticky
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
              classNames={{
                wrapper: "max-h-[382px] bg-transparent",
                th: "bg-slate-700/50 text-[#FFD700] border-b border-[#FFD700]/30",
                td: "border-b border-slate-600/30",
              }}
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
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
              <TableBody emptyContent={"Tidak ada jadwal pertemuan yang ditemukan"} items={sortedItems}>
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Form Modal */}
        <Modal isOpen={isFormOpen} onClose={onFormClose} size="2xl">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              {editingJadwal ? 'Edit Jadwal Pertemuan' : 'Tambah Jadwal Pertemuan Baru'}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Topik"
                  placeholder="Masukkan nama topik pertemuan"
                  value={formData.nama_topik}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_topik: e.target.value }))}
                  isRequired
                />
                <Input
                  label="Hari"
                  placeholder="Contoh: Senin"
                  value={formData.hari}
                  onChange={(e) => setFormData(prev => ({ ...prev, hari: e.target.value }))}
                  isRequired
                />
                <Input
                  type="date"
                  label="Tanggal"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  isRequired
                />
                <Input
                  label="Kelas"
                  placeholder="Contoh: Kelas A"
                  value={formData.kelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                  isRequired
                />
                <Input
                  label="Jam Pertemuan"
                  placeholder="Contoh: 08:00 - 10:00"
                  value={formData.jam_pertemuan}
                  onChange={(e) => setFormData(prev => ({ ...prev, jam_pertemuan: e.target.value }))}
                  isRequired
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-default-100 border border-default-200 rounded-lg"
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
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onFormClose}>
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
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
        >
          <ModalContent>
            <ModalHeader>
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
            <ModalFooter>
              <Button 
                color="default" 
                variant="light" 
                onPress={closeDeleteModal}
                isDisabled={deleteModal.isDeleting}
              >
                Batal
              </Button>
              <Button 
                color="danger" 
                onPress={handleDelete}
                isLoading={deleteModal.isDeleting}
                className="font-semibold"
              >
                {deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
