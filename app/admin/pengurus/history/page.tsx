'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Accordion,
  AccordionItem,
  Divider
} from "@heroui/react";
import { CalendarIcon, UsersIcon, EyeIcon } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Periode {
  id: string;
  nama: string;
  tahun_akademik: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  total_pengurus: number;
  semesters_completed: string[];
  periods: Array<{
    id: string;
    nama: string;
    semester: string;
    tanggal_mulai: string;
    tanggal_akhir: string;
  }>;
  pengurus_summary: {
    total: number;
    by_role: { [key: string]: number };
    by_jabatan: { [key: string]: number };
  };
}

interface PengurusDetail {
  id: string;
  nim: string;
  name: string;
  email: string;
  role: string;
  jabatan: string;
  joined_periode_at: string;
  periods_active?: Array<{
    periode_id: string;
    nama: string;
    semester: string;
  }>;
}

export default function HistoryPengurusPage() {
  const [periods, setPeriods] = useState<Periode[]>([]);
  const [groupedByYear, setGroupedByYear] = useState<{ [key: string]: Periode[] }>({});
  const [yearsAvailable, setYearsAvailable] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);
  const [pengurusDetail, setPengurusDetail] = useState<PengurusDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchPeriodHistory();
  }, []);

  const fetchPeriodHistory = async () => {
    try {
      const response = await fetch('/api/admin/periode/history');
      const result = await response.json();
      
      if (result.success) {
        setPeriods(result.data.periods);
        setGroupedByYear(result.data.grouped_by_year);
        setYearsAvailable(result.data.years_available);
        if (result.data.years_available.length > 0) {
          setSelectedYear(result.data.years_available[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching period history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPengurusDetail = async (tahunAkademik: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/academic-year/${encodeURIComponent(tahunAkademik)}/pengurus`);
      const result = await response.json();
      
      if (result.success) {
        setPengurusDetail(result.data.pengurus);
      } else {
        console.error('Failed to fetch pengurus detail:', result.message);
      }
    } catch (error) {
      console.error('Error fetching pengurus detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = async (periode: Periode) => {
    setSelectedPeriode(periode);
    onOpen();
    await fetchPengurusDetail(periode.tahun_akademik);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'danger';
      case 'moderator': return 'warning';
      case 'user': return 'default';
      default: return 'default';
    }
  };

  const getJabatanColor = (jabatan: string) => {
    switch (jabatan.toLowerCase()) {
      case 'ketua': return 'primary';
      case 'wakil ketua': return 'secondary';
      case 'sekretaris': return 'success';
      case 'bendahara': return 'warning';
      default: return 'default';
    }
  };

  const filteredPeriods = selectedYear ? (groupedByYear[selectedYear] || []) : periods;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="History Pengurus" 
      description="Lihat riwayat pengurus dari periode sebelumnya untuk referensi dan dokumentasi organisasi."
      subtitle="Lihat riwayat pengurus dari periode sebelumnya"
    >
      <div className="space-y-4 md:space-y-6">

      {/* Filter by Year */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-center">
            <CalendarIcon className="h-5 w-5" />
            <Select
              label="Filter by Tahun Akademik"
              placeholder="Pilih tahun akademik"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="max-w-xs"
            >
              <SelectItem key="">Semua Tahun</SelectItem>
              {yearsAvailable.map((year) => (
                <SelectItem key={year}>
                  {year}
                </SelectItem>
              ))}
            </Select>
            <div className="text-sm text-gray-500">
              Total: {filteredPeriods.length} periode selesai
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Periods List */}
      <div className="grid gap-4">
        {filteredPeriods.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <UsersIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Tidak ada data periode</h3>
              <p className="text-gray-500">Belum ada periode yang telah selesai</p>
            </CardBody>
          </Card>
        ) : (
          <Accordion variant="splitted" selectionMode="multiple">
            {filteredPeriods.map((periode) => (
              <AccordionItem
                key={periode.id}
                aria-label={periode.nama}
                title={
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="text-lg font-semibold">{periode.nama}</h3>
                      <p className="text-sm text-gray-500">
                        Semester: {periode.semesters_completed?.join(' + ') || 'N/A'} 
                        ({periode.semesters_completed?.length === 2 ? 'Lengkap' : 'Tidak Lengkap'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat" color="primary">
                        {periode.total_pengurus} pengurus
                      </Chip>
                    </div>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <h4 className="text-md font-semibold">Informasi Periode</h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Periode Lengkap:</span>
                            <span className="ml-2">{new Date(periode.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(periode.tanggal_akhir).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div>
                            <span className="font-medium">Semester Selesai:</span>
                            <span className="ml-2">{periode.semesters_completed?.join(', ') || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Total Pengurus:</span>
                            <span className="ml-2">{periode.total_pengurus} orang (aktif selama tahun akademik)</span>
                          </div>
                          {periode.periods && periode.periods.length > 0 && (
                            <div>
                              <span className="font-medium">Detail Periode:</span>
                              <div className="ml-2 mt-1">
                                {periode.periods.map((p, index) => (
                                  <div key={p.id} className="text-xs text-gray-600">
                                    {index + 1}. {p.nama} ({p.semester})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <h4 className="text-md font-semibold">Distribusi Pengurus</h4>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">By Role:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(periode.pengurus_summary.by_role).map(([role, count]) => (
                                <Chip 
                                  key={role} 
                                  size="sm" 
                                  variant="flat" 
                                  color={getRoleColor(role)}
                                >
                                  {role}: {count}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">By Jabatan:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(periode.pengurus_summary.by_jabatan).map(([jabatan, count]) => (
                                <Chip 
                                  key={jabatan} 
                                  size="sm" 
                                  variant="flat" 
                                  color={getJabatanColor(jabatan)}
                                >
                                  {jabatan}: {count}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<EyeIcon className="h-4 w-4" />}
                      onPress={() => handleViewDetail(periode)}
                    >
                      Lihat Detail Pengurus
                    </Button>
                  </div>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedPeriode && (
                  <>
                    <h2 className="text-xl font-bold">{selectedPeriode.nama}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedPeriode.tahun_akademik} - Semester {selectedPeriode.semesters_completed?.join(' + ') || 'N/A'}
                    </p>
                  </>
                )}
              </ModalHeader>
              <ModalBody>
                {detailLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">Loading detail pengurus...</span>
                  </div>
                ) : (
                  <Table aria-label="Detail pengurus table">
                    <TableHeader>
                      <TableColumn>NIM</TableColumn>
                      <TableColumn>NAMA</TableColumn>
                      <TableColumn>EMAIL</TableColumn>
                      <TableColumn>ROLE</TableColumn>
                      <TableColumn>JABATAN</TableColumn>
                      <TableColumn>SEMESTER AKTIF</TableColumn>
                      <TableColumn>BERGABUNG</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {pengurusDetail.map((pengurus) => (
                        <TableRow key={pengurus.id}>
                          <TableCell className="font-mono">{pengurus.nim}</TableCell>
                          <TableCell className="font-medium">{pengurus.name}</TableCell>
                          <TableCell>{pengurus.email}</TableCell>
                          <TableCell>
                            <Chip 
                              size="sm" 
                              variant="flat" 
                              color={getRoleColor(pengurus.role)}
                            >
                              {pengurus.role}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="sm" 
                              variant="flat" 
                              color={getJabatanColor(pengurus.jabatan)}
                            >
                              {pengurus.jabatan}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {pengurus.periods_active?.map((period, index) => (
                                <Chip 
                                  key={index}
                                  size="sm" 
                                  variant="bordered" 
                                  color="default"
                                >
                                  {period.semester}
                                </Chip>
                              )) || (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(pengurus.joined_periode_at).toLocaleDateString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Tutup
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      </div>
    </AdminLayout>
  );
}
