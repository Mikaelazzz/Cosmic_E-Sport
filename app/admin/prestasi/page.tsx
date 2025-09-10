'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { IconTrophy, IconUpload, IconEdit, IconTrash, IconPlus, IconSearch } from '@/components/icons';
import AdminLayout from '@/components/AdminLayout';

interface Prestasi {
  id: number;
  nama_tournament: string;
  tingkat_acara: 'Kampus' | 'Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  tanggal_acara: string;
  juara: number;
  jumlah_anggota: number;
  gambar_pemenang?: string;
  deskripsi?: string;
  created_at: string;
  updated_at: string;
}

const TINGKAT_ACARA = [
  { key: 'Kampus', label: 'Kampus' },
  { key: 'Kota', label: 'Kota' },
  { key: 'Provinsi', label: 'Provinsi' },
  { key: 'Nasional', label: 'Nasional' },
  { key: 'Internasional', label: 'Internasional' }
];

const JUARA_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  key: (i + 1).toString(),
  label: `Juara ${i + 1}`,
  value: i + 1
}));

const getTingkatColor = (tingkat: string) => {
  switch (tingkat) {
    case 'Kampus': return 'default';
    case 'Kota': return 'primary';
    case 'Provinsi': return 'secondary';
    case 'Nasional': return 'success';
    case 'Internasional': return 'warning';
    default: return 'default';
  }
};

const getJuaraColor = (juara: number) => {
  switch (juara) {
    case 1: return 'warning';
    case 2: return 'default';
    case 3: return 'success';
    default: return 'primary';
  }
};

export default function PrestasiPage() {
  const [prestasi, setPrestasi] = useState<Prestasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_tournament: '',
    tingkat_acara: '',
    tanggal_acara: '',
    juara: '',
    jumlah_anggota: '',
    deskripsi: '',
    gambar_pemenang: null as File | null
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchPrestasi();
  }, []);

  const fetchPrestasi = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/prestasi');
      const data = await response.json();
      
      if (data.success) {
        setPrestasi(data.data);
      } else {
        console.error('Error fetching prestasi:', data.message);
      }
    } catch (error) {
      console.error('Error fetching prestasi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Improved search function with useMemo for performance
  const filteredPrestasi = useMemo(() => {
    if (!searchTerm.trim()) {
      return prestasi;
    }

    const searchQuery = searchTerm.toLowerCase().trim();
    
    return prestasi.filter(item => {
      // Search in tournament name
      const tournamentMatch = item.nama_tournament.toLowerCase().includes(searchQuery);
      
      // Search in tingkat acara
      const tingkatMatch = item.tingkat_acara.toLowerCase().includes(searchQuery);
      
      // Search in description if available
      const descriptionMatch = item.deskripsi?.toLowerCase().includes(searchQuery) || false;
      
      // Search in juara (convert to string)
      const juaraMatch = item.juara.toString().includes(searchQuery) || 
                        `juara ${item.juara}`.toLowerCase().includes(searchQuery);
      
      // Search in formatted date
      const formattedDate = new Date(item.tanggal_acara).toLocaleDateString('id-ID');
      const dateMatch = formattedDate.toLowerCase().includes(searchQuery);
      
      // Search in participant count
      const participantMatch = item.jumlah_anggota.toString().includes(searchQuery) ||
                               `${item.jumlah_anggota} orang`.toLowerCase().includes(searchQuery);

      return tournamentMatch || tingkatMatch || descriptionMatch || juaraMatch || dateMatch || participantMatch;
    });
  }, [prestasi, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama_tournament', formData.nama_tournament);
      formDataToSend.append('tingkat_acara', formData.tingkat_acara);
      formDataToSend.append('tanggal_acara', formData.tanggal_acara);
      formDataToSend.append('juara', formData.juara);
      formDataToSend.append('jumlah_anggota', formData.jumlah_anggota);
      formDataToSend.append('deskripsi', formData.deskripsi);
      
      if (formData.gambar_pemenang) {
        formDataToSend.append('gambar_pemenang', formData.gambar_pemenang);
      }

      const url = editingId 
        ? `/api/admin/prestasi/${editingId}` 
        : '/api/admin/prestasi';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        await fetchPrestasi();
        resetForm();
        onClose();
      } else {
        console.error('Error saving prestasi:', data.message);
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving prestasi:', error);
      alert('Terjadi error saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (prestasiItem: Prestasi) => {
    setFormData({
      nama_tournament: prestasiItem.nama_tournament,
      tingkat_acara: prestasiItem.tingkat_acara,
      tanggal_acara: prestasiItem.tanggal_acara,
      juara: prestasiItem.juara.toString(),
      jumlah_anggota: prestasiItem.jumlah_anggota.toString(),
      deskripsi: prestasiItem.deskripsi || '',
      gambar_pemenang: null
    });
    
    // Set existing image preview if available
    if (prestasiItem.gambar_pemenang) {
      setImagePreview(prestasiItem.gambar_pemenang);
    } else {
      setImagePreview(null);
    }
    
    setEditingId(prestasiItem.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus prestasi ini?')) return;

    try {
      const response = await fetch(`/api/admin/prestasi/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchPrestasi();
      } else {
        console.error('Error deleting prestasi:', data.message);
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting prestasi:', error);
      alert('Terjadi error saat menghapus data');
    }
  };

  const resetForm = () => {
    setFormData({
      nama_tournament: '',
      tingkat_acara: '',
      tanggal_acara: '',
      juara: '',
      jumlah_anggota: '',
      deskripsi: '',
      gambar_pemenang: null
    });
    setImagePreview(null);
    setEditingId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({...formData, gambar_pemenang: file});
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    resetForm();
    onOpen();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <AdminLayout
      title="Manajemen Prestasi"
      description="Kelola data prestasi dan pencapaian UKM untuk merekam setiap keberhasilan organisasi."
      subtitle="Daftar Prestasi"
      subtitleDescription="Kelola data prestasi dan pencapaian UKM"
    >

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Input
            placeholder="Cari tournament, tingkat, juara, tanggal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            startContent={<IconSearch className="text-default-400" size={18} />}
            endContent={
              searchTerm && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={clearSearch}
                  className="min-w-unit-6 w-6 h-6"
                >
                  <span className="text-default-400">×</span>
                </Button>
              )
            }
          />
          {/* Search results counter */}
          {searchTerm && (
            <div className="absolute top-full left-0 mt-1 text-xs text-default-500">
              {filteredPrestasi.length} hasil ditemukan untuk "{searchTerm}"
            </div>
          )}
        </div>
        <Button
          color="primary"
          onPress={openAddModal}
          startContent={<IconPlus size={20} />}
        >
          Tambah Prestasi
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardBody className="p-0">
              <Table aria-label="Prestasi table" className="min-h-[400px]">
              <TableHeader>
                <TableColumn>TOURNAMENT</TableColumn>
                <TableColumn>TINGKAT</TableColumn>
                <TableColumn>TANGGAL</TableColumn>
                <TableColumn>JUARA</TableColumn>
                <TableColumn>PESERTA</TableColumn>
                <TableColumn>AKSI</TableColumn>
              </TableHeader>
              <TableBody 
                emptyContent={
                  searchTerm 
                    ? `Tidak ada prestasi yang ditemukan untuk "${searchTerm}"`
                    : "Belum ada data prestasi"
                }
              >
                {filteredPrestasi.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {/* Highlight search term in tournament name */}
                          {searchTerm ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: item.nama_tournament.replace(
                                  new RegExp(`(${searchTerm})`, 'gi'),
                                  '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                                )
                              }}
                            />
                          ) : (
                            item.nama_tournament
                          )}
                        </p>
                        {item.deskripsi && (
                          <p className="text-sm text-foreground-500 truncate max-w-xs">
                            {searchTerm ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.deskripsi.replace(
                                    new RegExp(`(${searchTerm})`, 'gi'),
                                    '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                                  )
                                }}
                              />
                            ) : (
                              item.deskripsi
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        color={getTingkatColor(item.tingkat_acara) as any}
                        variant="flat"
                        size="sm"
                      >
                        {item.tingkat_acara}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(item.tanggal_acara).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        color={getJuaraColor(item.juara) as any}
                        variant="flat"
                        size="sm"
                      >
                        Juara {item.juara}
                      </Chip>
                    </TableCell>
                    <TableCell>{item.jumlah_anggota} orang</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => handleEdit(item)}
                        >
                          <IconEdit size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(item.id)}
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardBody>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredPrestasi.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8">
                  <p className="text-default-500">
                    {searchTerm 
                      ? `Tidak ada prestasi yang ditemukan untuk "${searchTerm}"`
                      : "Belum ada data prestasi"
                    }
                  </p>
                </CardBody>
              </Card>
            ) : (
              filteredPrestasi.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">
                          {searchTerm ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: item.nama_tournament.replace(
                                  new RegExp(`(${searchTerm})`, 'gi'),
                                  '<mark class="bg-yellow-200 text-black rounded px-1">$1</mark>'
                                )
                              }}
                            />
                          ) : (
                            item.nama_tournament
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Chip
                            size="sm"
                            color={getTingkatColor(item.tingkat_acara)}
                            variant="flat"
                          >
                            {item.tingkat_acara}
                          </Chip>
                          <Chip
                            size="sm"
                            color={getJuaraColor(item.juara)}
                            variant="flat"
                          >
                            Juara {item.juara}
                          </Chip>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-default-500 text-xs">Tanggal</p>
                        <p className="font-medium">{new Date(item.tanggal_acara).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-default-500 text-xs">Peserta</p>
                        <p className="font-medium">{item.jumlah_anggota} orang</p>
                      </div>
                    </div>

                    {item.deskripsi && (
                      <div className="mb-4">
                        <p className="text-default-500 text-xs">Deskripsi</p>
                        <p className="text-sm line-clamp-2">{item.deskripsi}</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleEdit(item)}
                        startContent={<IconEdit size={14} />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDelete(item.id)}
                        startContent={<IconTrash size={14} />}
                      >
                        Hapus
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "items-center justify-center p-2 sm:p-4",
          base: "mx-2 sm:mx-4 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] w-full max-w-[95vw] sm:max-w-3xl",
          body: "py-4 sm:py-6",
          backdrop: "bg-black/60"
        }}
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Edit Prestasi' : 'Tambah Prestasi Baru'}
              </h3>
              <p className="text-sm text-foreground-500">
                {editingId ? 'Perbarui informasi prestasi' : 'Isi informasi prestasi yang ingin ditambahkan'}
              </p>
            </ModalHeader>
            
            <ModalBody className="space-y-6">
              {/* Grid Layout for responsive design */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <Input
                    label="Nama Tournament/Kompetisi"
                    placeholder="Masukkan nama tournament"
                    value={formData.nama_tournament}
                    onChange={(e) => setFormData({...formData, nama_tournament: e.target.value})}
                    isRequired
                    classNames={{
                      label: "text-foreground-700 font-medium",
                      input: "text-foreground"
                    }}
                  />
                  
                  <Select
                    label="Tingkat Acara"
                    placeholder="Pilih tingkat acara"
                    selectedKeys={formData.tingkat_acara ? new Set([formData.tingkat_acara]) : new Set()}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({...formData, tingkat_acara: selected});
                    }}
                    isRequired
                    classNames={{
                      label: "text-foreground-700 font-medium",
                      trigger: "min-h-unit-12"
                    }}
                  >
                    {TINGKAT_ACARA.map((tingkat) => (
                      <SelectItem key={tingkat.key} value={tingkat.key}>
                        {tingkat.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    type="date"
                    label="Tanggal Acara"
                    value={formData.tanggal_acara}
                    onChange={(e) => setFormData({...formData, tanggal_acara: e.target.value})}
                    isRequired
                    classNames={{
                      label: "text-foreground-700 font-medium"
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Juara"
                      placeholder="Pilih juara"
                      selectedKeys={formData.juara ? new Set([formData.juara]) : new Set()}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData({...formData, juara: selected});
                      }}
                      isRequired
                      classNames={{
                        label: "text-foreground-700 font-medium",
                        trigger: "min-h-unit-12"
                      }}
                    >
                      {JUARA_OPTIONS.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      type="number"
                      label="Jumlah Participant"
                      placeholder="0"
                      min="1"
                      max="10"
                      value={formData.jumlah_anggota}
                      onChange={(e) => setFormData({...formData, jumlah_anggota: e.target.value})}
                      isRequired
                      classNames={{
                        label: "text-foreground-700 font-medium"
                      }}
                    />
                  </div>

                  <Textarea
                    label="Deskripsi (Opsional)"
                    placeholder="Deskripsi singkat tentang prestasi..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    minRows={3}
                    classNames={{
                      label: "text-foreground-700 font-medium"
                    }}
                  />
                </div>

                {/* Right Column - Image Upload & Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-3">
                      Gambar Pemenang
                    </label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4">
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                          <img 
                            src={imagePreview} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({...formData, gambar_pemenang: null});
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Area */}
                    <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                      imagePreview ? 'border-gray-300 bg-gray-50' : 'border-primary-300 bg-primary-50/30 hover:border-primary-400'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="gambar-upload"
                      />
                      <label 
                        htmlFor="gambar-upload" 
                        className="cursor-pointer flex flex-col items-center text-center"
                      >
                        <IconUpload size={32} className={`mb-3 ${imagePreview ? 'text-gray-400' : 'text-primary-500'}`} />
                        <span className={`text-sm font-medium mb-1 ${imagePreview ? 'text-gray-600' : 'text-primary-700'}`}>
                          {imagePreview ? 'Ganti Gambar' : 'Upload Gambar Pemenang'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formData.gambar_pemenang 
                            ? formData.gambar_pemenang.name 
                            : 'JPG, PNG, GIF hingga 10MB • Ratio 16:9 disarankan'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                color="danger"
                variant="light"
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                isDisabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Prestasi' : 'Simpan Prestasi')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}