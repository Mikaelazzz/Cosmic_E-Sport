"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ModeratorLayout from '@/components/ModeratorLayout';

interface Informasi {
  id: number;
  nama_informasi: string;
  gambar?: string;
  tanggal_publish: string;
  tanggal_berakhir: string;
  deskripsi?: string;
  link?: string;
  status: string;
  created_by_user: {
    nama_lengkap: string;
    email: string;
  };
  created_at: string;
}

const InformasiPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [informasiList, setInformasiList] = useState<Informasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const statusList = [
    { key: 'all', label: 'Semua Status' },
    { key: 'active', label: 'Aktif' },
    { key: 'scheduled', label: 'Terjadwal' },
    { key: 'expired', label: 'Kedaluwarsa' },
    { key: 'inactive', label: 'Tidak Aktif' }
  ];

  const fetchInformasi = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: selectedStatus,
        search: searchTerm
      });

      const response = await fetch(`/api/moderator/informasi?${params}`);
      const result = await response.json();

      if (result.success) {
        setInformasiList(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        console.error('Failed to fetch informasi:', result.message);
      }
    } catch (error) {
      console.error('Error fetching informasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformasi();
  }, [currentPage, selectedStatus, searchTerm]);

  const handleView = (informasi: Informasi) => {
    router.push(`/moderator/informasi/view/${informasi.id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/moderator/informasi/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/moderator/informasi/${deleteId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchInformasi();
        onDeleteClose();
        setDeleteId(null);
      } else {
        console.error('Failed to delete informasi:', result.message);
      }
    } catch (error) {
      console.error('Error deleting informasi:', error);
    }
  };

  const getStatusColor = (status: string): "default" | "success" | "warning" | "primary" | "danger" | "secondary" => {
    const colors = {
      active: 'success' as const,
      scheduled: 'primary' as const,
      expired: 'danger' as const,
      inactive: 'warning' as const
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels = {
      active: 'Aktif',
      scheduled: 'Terjadwal',
      expired: 'Kedaluwarsa',
      inactive: 'Tidak Aktif'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <ModeratorLayout
      title="Kelola Informasi"
      description=""
    >
      <section>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {/* <Button
            variant="bordered"
            onPress={() => {
              setCurrentPage(1);
              fetchInformasi();
            }}
            isLoading={loading}
          >
            Refresh
          </Button> */}
          <Button
            variant="bordered"
            color="secondary"
            onPress={async () => {
              setLoading(true);
              try {
                const response = await fetch('/api/moderator/informasi/update-status', {
                  method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                  // Refresh the list after updating
                  fetchInformasi();
                } else {
                  console.error('Failed to update status:', result.message);
                }
              } catch (error) {
                console.error('Error updating status:', error);
              } finally {
                setLoading(false);
              }
            }}
            isLoading={loading}
          >
            Update Status
          </Button>
          <Button
            color="primary"
            onPress={() => router.push('/moderator/informasi/create')}
          >
            + Tambah Informasi
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Input
          placeholder="Cari informasi..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          placeholder="Status"
          selectedKeys={[selectedStatus]}
          onSelectionChange={(keys: any) => setSelectedStatus(Array.from(keys)[0] as string)}
          className="max-w-sm"
        >
          {statusList.map((status) => (
            <SelectItem key={status.key}>
              {status.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="lg:hidden">
        {/* Mobile Cards */}
        <div className="space-y-4">
          {loading ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardBody className="text-center py-8">
                <p className="text-gray-400">Loading...</p>
              </CardBody>
            </Card>
          ) : informasiList.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardBody className="text-center py-8">
                <p className="text-gray-400">Tidak ada data</p>
              </CardBody>
            </Card>
          ) : (
            informasiList.map((item) => (
              <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-blue-400/50 transition-colors">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    {/* Header with Status */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg mb-1">
                          {item.nama_informasi}
                        </h3>
                        {item.deskripsi && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>
                      <Chip 
                        size="sm" 
                        color={getStatusColor(item.status)}
                        variant="flat"
                      >
                        {getStatusLabel(item.status)}
                      </Chip>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Tanggal Publish:</span>
                        <p className="text-gray-300 font-medium">
                          {new Date(item.tanggal_publish).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Tanggal Berakhir:</span>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${
                            new Date(item.tanggal_berakhir) < new Date() 
                              ? 'text-red-400' 
                              : new Date(item.tanggal_berakhir) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                          }`}>
                            {new Date(item.tanggal_berakhir).toLocaleDateString('id-ID')}
                          </span>
                          {new Date(item.tanggal_berakhir) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
                           new Date(item.tanggal_berakhir) >= new Date() && (
                            <span className="text-xs text-yellow-400">Segera berakhir</span>
                          )}
                          {new Date(item.tanggal_berakhir) < new Date() && (
                            <span className="text-xs text-red-400">Sudah berakhir</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="text-sm border-t border-gray-700 pt-2">
                      <span className="text-gray-400">Dibuat oleh:</span>
                      <p className="text-gray-300 font-medium">
                        {item.created_by_user.nama_lengkap}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleView(item)}
                      >
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleEdit(item.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => {
                          setDeleteId(item.id);
                          onDeleteOpen();
                        }}
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

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 space-y-4">
            {/* Page Info */}
            <div className="flex justify-center text-sm text-gray-400">
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                size="sm"
                classNames={{
                  wrapper: "gap-0 overflow-visible h-8",
                  item: "w-8 h-8 text-small rounded-none bg-transparent text-gray-400",
                  cursor: "bg-blue-400 text-gray-900 font-bold",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table aria-label="Informasi table" className="min-w-full">
          <TableHeader>
            <TableColumn>NAMA INFORMASI</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>TANGGAL PUBLISH</TableColumn>
            <TableColumn>TANGGAL BERAKHIR</TableColumn>
            <TableColumn>DIBUAT OLEH</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent={loading ? "Loading..." : "Tidak ada data"}>
            {informasiList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div className="font-semibold text-white">
                      {item.nama_informasi}
                    </div>
                    {item.deskripsi && (
                      <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {item.deskripsi}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    color={getStatusColor(item.status)}
                    variant="flat"
                  >
                    {getStatusLabel(item.status)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-gray-300">
                    {new Date(item.tanggal_publish).toLocaleDateString('id-ID')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`text-sm ${
                      new Date(item.tanggal_berakhir) < new Date() 
                        ? 'text-red-400' 
                        : new Date(item.tanggal_berakhir) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                    }`}>
                      {new Date(item.tanggal_berakhir).toLocaleDateString('id-ID')}
                    </span>
                    {new Date(item.tanggal_berakhir) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
                     new Date(item.tanggal_berakhir) >= new Date() && (
                      <span className="text-xs text-yellow-400">Segera berakhir</span>
                    )}
                    {new Date(item.tanggal_berakhir) < new Date() && (
                      <span className="text-xs text-red-400">Sudah berakhir</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="text-gray-300">
                      {item.created_by_user.nama_lengkap}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleView(item)}
                    >
                      Lihat
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleEdit(item.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => {
                        setDeleteId(item.id);
                        onDeleteOpen();
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Desktop Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
          />
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalBody>
            <p>Apakah Anda yakin ingin menghapus informasi ini? Tindakan ini tidak dapat dibatalkan.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Batal
            </Button>
            <Button color="danger" onPress={handleDelete}>
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </section>
    </ModeratorLayout>
  );
};

export default InformasiPage;
