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
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'expired', label: 'Expired' }
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
      inactive: 'warning' as const,
      expired: 'danger' as const
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Kelola Informasi</h1>
          <p className="text-gray-400 mt-2">Kelola informasi dan pengumuman untuk anggota</p>
        </div>
        <Button
          color="primary"
          onPress={() => router.push('/moderator/informasi/create')}
        >
          + Tambah Informasi
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Input
          placeholder="Cari informasi..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select
          placeholder="Status"
          selectedKeys={[selectedStatus]}
          onSelectionChange={(keys: any) => setSelectedStatus(Array.from(keys)[0] as string)}
          className="max-w-xs"
        >
          {statusList.map((status) => (
            <SelectItem key={status.key}>
              {status.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Table */}
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
                    {item.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-gray-300">
                    {new Date(item.tanggal_publish).toLocaleDateString('id-ID')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-300">
                    {new Date(item.tanggal_berakhir).toLocaleDateString('id-ID')}
                  </span>
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

      {/* Pagination */}
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
    </div>
  );
};

export default InformasiPage;
