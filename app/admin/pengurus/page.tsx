'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/table';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { Chip } from '@heroui/chip';
import { User } from '@heroui/user';
import { Pagination } from '@heroui/pagination';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Alert } from '@heroui/alert';
import { getUserAvatarUrl } from '@/lib/avatar';
import AdminLayout from '@/components/AdminLayout';

interface PengurusData {
  id: number;
  nim: string;
  name: string;
  email: string;
  role: string;
  jabatan: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  nim: string;
  nama_lengkap: string;
  email: string;
  role: string;
  jabatan: string;
  customJabatan: string;
}

interface CurrentPeriod {
  id: number;
  nama: string;
  tahun_akademik: string;
  semester: 'genap' | 'ganjil';
  tanggal_mulai: string;
  tanggal_akhir: string;
  status: string;
}

const columns = [
  { name: "NIM", uid: "nim", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "EMAIL", uid: "email" },
  { name: "ROLE", uid: "role", sortable: true },
  { name: "JABATAN", uid: "jabatan", sortable: true },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const roleOptions = [
  { name: "Moderator", value: "moderator" },
];

const jabatanOptions = [
  "Ketua",
  "Wakil Ketua", 
  "Sekretaris",
  "Bendahara",
  "Humas",
  "PDD",
  "Lainnya",
];

const statusOptions = [
  { name: "All", uid: "all" },
  { name: "Active", uid: "active" },
  { name: "Inactive", uid: "inactive" },
  { name: "Belum Terdaftar", uid: "not_registered" },
];

// Icons
const PlusIcon = ({ size = 24, width, height, ...props }: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
      <path d="M6 12h12" />
      <path d="M12 18V6" />
    </g>
  </svg>
);

const VerticalDotsIcon = ({ size = 24, width, height, ...props }: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      fill="currentColor"
    />
  </svg>
);

const SearchIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const ChevronDownIcon = ({ strokeWidth = 1.5, ...otherProps }: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...otherProps}
  >
    <path
      d="m19.92 8.95-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={strokeWidth}
    />
  </svg>
);

const statusColorMap: Record<string, "success" | "danger" | "warning" | "default" | "primary" | "secondary"> = {
  active: "success",
  inactive: "danger",
  not_registered: "warning",
};

const INITIAL_VISIBLE_COLUMNS = ["nim", "name","email", "role", "jabatan", "status", "actions"];

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export default function AdminPengurusPage() {
  const [pengurus, setPengurus] = useState<PengurusData[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null);
  const [isPeriodLoading, setIsPeriodLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(["all"]));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<{column: string; direction: "ascending" | "descending"}>({
    column: "nim",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Modal and form state
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formData, setFormData] = useState<FormData>({
    nim: '',
    nama_lengkap: '',
    email: '',
    role: 'moderator',
    jabatan: 'Ketua',
    customJabatan: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);

  const pages = Math.ceil(pengurus.length / rowsPerPage);
  const hasSearchFilter = Boolean(filterValue);

  // Load current period data
  const loadCurrentPeriod = async () => {
    setIsPeriodLoading(true);
    try {
      const response = await fetch('/api/admin/periode?type=current');
      if (response.ok) {
        const result = await response.json();
        setCurrentPeriod(result.data);
      } else {
        throw new Error('Failed to load current period');
      }
    } catch (error) {
      console.error('Error loading current period:', error);
      setAlert({ type: 'error', message: 'Failed to load current period data' });
    } finally {
      setIsPeriodLoading(false);
    }
  };

  // Load pengurus data
  const loadPengurus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/pengurus?type=active');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPengurus(data.pengurus || []);
          setAvatarKey(prev => prev + 1); // Force avatar refresh
        } else {
          setAlert({ type: 'error', message: data.message || 'Failed to load pengurus data' });
        }
      } else {
        throw new Error('Failed to load pengurus data');
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load pengurus data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentPeriod();
  }, []);

  useEffect(() => {
    if (currentPeriod && currentPeriod.status === 'berlangsung') {
      loadPengurus();
    }
  }, [currentPeriod]);

  // Table filtering and sorting
  const headerColumns = useMemo(() => {
    if (visibleColumns.has("all")) return columns;
    return columns.filter((column) => visibleColumns.has(column.uid));
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredPengurus = [...pengurus];

    if (hasSearchFilter) {
      filteredPengurus = filteredPengurus.filter((item) =>
        item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.nim.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter.size > 0 && !statusFilter.has("all")) {
      filteredPengurus = filteredPengurus.filter((item) =>
        statusFilter.has(item.status)
      );
    }

    return filteredPengurus;
  }, [pengurus, filterValue, statusFilter]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: PengurusData, b: PengurusData) => {
      const first = a[sortDescriptor.column as keyof PengurusData] as string;
      const second = b[sortDescriptor.column as keyof PengurusData] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // CRUD operations
  const handleAdd = () => {
    setFormData({
      nim: '',
      nama_lengkap: '',
      email: '',
      role: 'moderator',
      jabatan: 'Ketua',
      customJabatan: '',
    });
    setEditingId(null);
    onOpen();
  };

  const handleEdit = (pengurus: PengurusData) => {
    setFormData({
      nim: pengurus.nim,
      nama_lengkap: pengurus.name,
      email: pengurus.email,
      role: pengurus.role,
      jabatan: jabatanOptions.includes(pengurus.jabatan) ? pengurus.jabatan : 'Lainnya',
      customJabatan: jabatanOptions.includes(pengurus.jabatan) ? '' : pengurus.jabatan,
    });
    setEditingId(pengurus.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pengurus?')) return;

    try {
      const response = await fetch(`/api/admin/pengurus/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Pengurus deleted successfully' });
        loadPengurus();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Delete failed' 
      });
    }
  };

  const submitForm = async () => {
    try {
      // Validation
      if (!formData.nim) {
        setAlert({ type: 'error', message: 'NIM harus diisi' });
        return;
      }
      
      if (formData.jabatan === 'Lainnya' && !formData.customJabatan.trim()) {
        setAlert({ type: 'error', message: 'Jabatan custom harus diisi' });
        return;
      }

      // Check if there's an active periode
      if (!currentPeriod || currentPeriod.status !== 'berlangsung') {
        setAlert({ type: 'error', message: 'Tidak ada periode aktif. Silakan buat periode baru terlebih dahulu.' });
        return;
      }
      
      const url = editingId 
        ? `/api/admin/pengurus/${editingId}` 
        : '/api/admin/pengurus';
      
      const method = editingId ? 'PUT' : 'POST';
      
      // Use custom jabatan if "Lainnya" is selected
      const finalJabatan = formData.jabatan === 'Lainnya' ? formData.customJabatan : formData.jabatan;
      
      // Prepare request body - only NIM, role, and jabatan for new pengurus
      const requestBody: any = {
        nim: formData.nim,
        role: formData.role || 'moderator', // Default to moderator
        jabatan: finalJabatan,
      };

      // For editing existing pengurus, include all necessary fields
      if (editingId) {
        // Add any other fields needed for editing
        requestBody.id = editingId;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: data.message || (editingId ? 'Pengurus berhasil diupdate' : 'Pengurus berhasil ditambahkan')
        });
        loadPengurus();
        onOpenChange();
      } else {
        throw new Error(data.message || 'Operasi gagal');
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Operasi gagal' 
      });
    }
  };

  // Event handlers
  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  // Render cell content
  const renderCell = useCallback((pengurus: PengurusData, columnKey: React.Key) => {
    const cellValue = pengurus[columnKey as keyof PengurusData];

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center">
              <img 
                key={avatarKey} // Force re-render when avatar changes
                src={getUserAvatarUrl(pengurus, 48, true)}
                alt="Profile"
                className="w-12 h-12 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/logc.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-small font-medium">{pengurus.name}</span>
              {/* <span className={`text-tiny ${pengurus.email === 'Belum terdaftar' ? 'text-warning' : 'text-default-500'}`}>
                {pengurus.email}
              </span> */}
            </div>
          </div>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            {/* <p className="text-bold text-tiny capitalize text-default-500">{pengurus.jabatan}</p> */}
          </div>
        );
      case "status":
        const getStatusText = (status: string) => {
          switch (status) {
            case 'active': return 'Active';
            case 'inactive': return 'Inactive';
            case 'not_registered': return 'Belum Terdaftar';
            default: return status;
          }
        };
        
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={statusColorMap[pengurus.status]}
            size="sm"
            variant="dot"
          >
            {getStatusText(cellValue as string)}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown className="bg-background border-1 border-default-200">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="edit" onPress={() => handleEdit(pengurus)}>
                  Edit
                </DropdownItem>
                <DropdownItem 
                  key="delete" 
                  className="text-danger" 
                  color="danger"
                  onPress={() => handleDelete(pengurus.id)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  // Top content (search and filters)
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Cari berdasarkan nama atau NIM..."
            size="sm"
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Status Filter"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={(keys) => setStatusFilter(new Set(Array.from(keys) as string[]))}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys) as string[]))}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
          <div className="flex justify-between">
            <Button 
              color="warning"
              variant="flat"
              size="sm"
              onPress={() => window.location.href = '/admin/pengurus/history'}
            >
              History Pengurus
            </Button>
            <Button 
              className="bg-foreground text-background" 
              endContent={<PlusIcon />} 
              size="sm"
              onPress={handleAdd}
            >
              Tambah Pengurus
            </Button>
          </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pengurus.length} pengurus ({pengurus.filter(p => p.status === 'not_registered').length} belum terdaftar)
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-2"
              onChange={onRowsPerPageChange}
              value={rowsPerPage}
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
    onSearchChange,
    onRowsPerPageChange,
    pengurus.length,
    hasSearchFilter,
    rowsPerPage
  ]);

  // Bottom content (pagination)
  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          isDisabled={hasSearchFilter}
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {selectedKeys.size === pengurus.length
            ? "Semua item dipilih"
            : `${selectedKeys.size} of ${items.length} dipilih`}
        </span>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter, pengurus.length]);

  const classNames = useMemo(
    () => ({
      wrapper: ["max-h-[500px]"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        "group-data-[middle=true]:before:rounded-none",
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
      ],
    }),
    [],
  );

  return (
    <AdminLayout
      title="Manajemen Pengurus"
      description="Kelola data pengurus dan anggota organisasi untuk periode yang sedang berlangsung."
    >

      {/* Period Status Check */}
      {isPeriodLoading ? (
        <Card className="mb-6">
          <CardBody className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat informasi periode...</p>
          </CardBody>
        </Card>
      ) : !currentPeriod ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-warning">Tidak Ada Periode Aktif</h3>
                <p className="text-sm text-default-600">
                  Anda perlu membuat dan mengaktifkan periode terlebih dahulu sebelum dapat mengelola pengurus.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <Button 
                color="primary" 
                variant="solid"
                onPress={() => window.location.href = '/admin/periode'}
              >
                Kelola Periode
              </Button>
              <Button 
                color="default" 
                variant="flat"
                onPress={() => loadCurrentPeriod()}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : currentPeriod.status !== 'berlangsung' ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-warning">Periode Tidak Aktif</h3>
                <p className="text-sm text-default-600">
                  Periode "{currentPeriod.nama}" ({currentPeriod.tahun_akademik} - {currentPeriod.semester}) 
                  belum dimulai. Aktivkan periode untuk mengelola pengurus.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <Button 
                color="primary" 
                variant="solid"
                onPress={() => window.location.href = '/admin/periode'}
              >
                Aktivkan Periode
              </Button>
              <Button 
                color="default" 
                variant="flat"
                onPress={() => loadCurrentPeriod()}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-success">PERIODE {currentPeriod.semester.toUpperCase()} {currentPeriod.tahun_akademik}</h3>
                  {/* <p className="text-sm text-default-600">
                    {currentPeriod.nama} 
                    PERIODE {currentPeriod.semester.toUpperCase()} {currentPeriod.tahun_akademik}
                  </p> */}
                </div>
              </div>
              {/* <Chip color="success" variant="flat" className="self-center">Berlangsung</Chip> */}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Alert */}
      {alert && (
        <div className={`mb-4 p-4 rounded-lg ${
          alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {alert.message}
          <button 
            onClick={() => setAlert(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Show table only if period is active */}
      {currentPeriod && currentPeriod.status === 'berlangsung' && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              isCompact
              removeWrapper
              aria-label="Pengurus table with custom cells, pagination and sorting"
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
              checkboxesProps={{
                classNames: {
                  wrapper: "after:bg-foreground after:text-background text-background",
                },
              }}
              classNames={classNames}
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              onSelectionChange={(keys) => setSelectedKeys(new Set(Array.from(keys as any) as string[]))}
              onSortChange={(descriptor) => setSortDescriptor({
                column: descriptor.column as string,
                direction: descriptor.direction as "ascending" | "descending"
          })}
            >
              <TableHeader columns={headerColumns}>
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
                emptyContent={isLoading ? "Loading..." : "No pengurus found"} 
                items={sortedItems}
                isLoading={isLoading}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            {/* Top Content for Mobile */}
            <div className="mb-4">
              {topContent}
            </div>

            {/* Cards */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-default-500">No pengurus found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedItems.map((item) => (
                  <Card key={item.id} className="w-full">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center">
                            <img 
                              src={getUserAvatarUrl(item, 40)}
                              alt={item.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `/logc.png`;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base truncate">{item.name}</h4>
                            <p className="text-sm text-default-600">{item.nim}</p>
                          </div>
                        </div>
                        <Chip 
                          className="ml-2"
                          color={
                            item.status === "active" ? "success" :
                            item.status === "inactive" ? "danger" : "default"
                          }
                          size="sm" 
                          variant="flat"
                        >
                          {item.status}
                        </Chip>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-default-500">Email:</span>
                          <span className="text-sm truncate ml-2">{item.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-default-500">Role:</span>
                          <Chip size="sm" variant="dot" className="ml-2">
                            {item.role}
                          </Chip>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-default-500">Jabatan:</span>
                          <Chip 
                            size="sm" 
                            variant="flat" 
                            color="primary"
                            className="ml-2"
                          >
                            {item.jabatan}
                          </Chip>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => handleEdit(item)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleDelete(item.id)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Bottom Content for Mobile */}
            <div className="mt-4">
              {bottomContent}
            </div>
          </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="top-center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingId ? 'Edit Pengurus' : 'Tambah Pengurus Baru'}
              </ModalHeader>
              <ModalBody>
                {!editingId && (
                  <div className="text-sm text-default-500 p-3 bg-warning-50 rounded-lg border border-warning-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <strong>Informasi Penting:</strong>
                        <ul className="mt-1 ml-4 list-disc text-xs space-y-1">
                          <li>Pengurus akan ditambahkan dengan status <span className="font-semibold text-warning-700">"Belum Terdaftar"</span></li>
                          <li>Ketika user dengan NIM ini mendaftar, jabatan akan <span className="font-semibold text-success-700">otomatis aktif</span></li>
                          <li>Hanya perlu memasukkan NIM dan jabatan yang diinginkan</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <Input
                  autoFocus
                  label="NIM"
                  placeholder="Masukkan NIM pengurus"
                  variant="bordered"
                  value={formData.nim}
                  onValueChange={(value: string) => setFormData({ ...formData, nim: value })}
                  isDisabled={!!editingId}
                  description={editingId ? "NIM tidak dapat diubah" : "NIM pengurus yang akan ditambahkan"}
                />
                
                <div className="text-sm text-default-500 p-2 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Role akan otomatis diatur sebagai <strong>Moderator</strong>
                  </div>
                </div>
                
                <Select
                  label="Jabatan"
                  placeholder="Pilih jabatan"
                  selectedKeys={[formData.jabatan]}
                  onSelectionChange={(keys) => {
                    const jabatan = Array.from(keys)[0] as string;
                    setFormData({ ...formData, jabatan, customJabatan: '' });
                  }}
                >
                  {jabatanOptions.map((jabatan) => (
                    <SelectItem key={jabatan}>
                      {jabatan}
                    </SelectItem>
                  ))}
                </Select>
                
                {formData.jabatan === 'Lainnya' && (
                  <Input
                    label="Jabatan Lainnya"
                    placeholder="Masukkan jabatan custom"
                    variant="bordered"
                    value={formData.customJabatan}
                    onValueChange={(value: string) => setFormData({ ...formData, customJabatan: value })}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button color="primary" onPress={submitForm}>
                  {editingId ? 'Update' : 'Tambah'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
        </>
      )}
    </AdminLayout>
  );
}
