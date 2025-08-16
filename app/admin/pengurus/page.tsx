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

const INITIAL_VISIBLE_COLUMNS = ["nim", "name", "role", "jabatan", "status", "actions"];

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
    role: 'moderator',
    jabatan: 'Ketua',
    customJabatan: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

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
      const response = await fetch('/api/admin/pengurus');
      if (response.ok) {
        const data = await response.json();
        setPengurus(data);
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
    
    if (!statusFilter.has("all") && statusFilter.size !== statusOptions.length) {
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
      
      const url = editingId 
        ? `/api/admin/pengurus/${editingId}` 
        : '/api/admin/pengurus';
      
      const method = editingId ? 'PUT' : 'POST';
      
      // Use custom jabatan if "Lainnya" is selected
      const finalJabatan = formData.jabatan === 'Lainnya' ? formData.customJabatan : formData.jabatan;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nim: formData.nim,
          role: formData.role,
          jabatan: finalJabatan,
        }),
      });

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: editingId ? 'Pengurus berhasil diupdate' : 'Pengurus berhasil ditambahkan' 
        });
        loadPengurus();
        onOpenChange();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Operasi gagal');
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
        const avatarUrl = pengurus.email === 'Belum terdaftar' 
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(pengurus.nim)}&background=9ca3af&color=ffffff`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(pengurus.name)}&background=random`;
          
        return (
          <User
            avatarProps={{
              radius: "full",
              size: "sm",
              src: avatarUrl
            }}
            description={pengurus.email}
            name={pengurus.name}
            classNames={{
              description: pengurus.email === 'Belum terdaftar' ? "text-warning" : "text-default-500"
            }}
          />
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-bold text-tiny capitalize text-default-500">{pengurus.jabatan}</p>
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
            <Button 
              className="bg-foreground text-background" 
              endContent={<PlusIcon />} 
              size="sm"
              onPress={handleAdd}
            >
              Tambah Pengurus
            </Button>
          </div>
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manajemen Pengurus</h1>
        <p className="text-default-500">Kelola data pengurus dan anggota organisasi untuk periode yang sedang berlangsung.</p>
      </div>

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
                  <h3 className="text-lg font-semibold text-success">Periode Aktif</h3>
                  <p className="text-sm text-default-600">
                    {currentPeriod.nama} ({currentPeriod.tahun_akademik} - {currentPeriod.semester.toUpperCase()})
                  </p>
                </div>
              </div>
              <Chip color="success" variant="flat">Berlangsung</Chip>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-default-600">
              💡 Pengurus dapat ditambahkan meskipun belum terdaftar di website. 
              Ketika pengguna dengan NIM yang sudah ditambahkan mendaftar, mereka akan otomatis mendapat jabatan yang telah ditetapkan.
            </p>
          </CardBody>
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
          {/* Table */}
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
                <div className="text-sm text-default-500 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <strong>Catatan:</strong> Anda dapat menambahkan pengurus meskipun mereka belum mendaftar di website. 
                  Ketika mereka mendaftar dengan NIM ini, jabatan akan otomatis teraplikasi.
                </div>
                <Input
                  autoFocus
                  label="NIM"
                  placeholder="Masukkan NIM"
                  variant="bordered"
                  value={formData.nim}
                  onValueChange={(value: string) => setFormData({ ...formData, nim: value })}
                />
                <div className="text-sm text-default-500 p-2 bg-default-100 rounded-lg">
                  Role akan otomatis diatur sebagai <strong>Moderator</strong>
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
    </div>
  );
}
