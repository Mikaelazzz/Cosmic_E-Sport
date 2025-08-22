"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import QRScannerModal from '@/components/QRScannerModal';
import { Calendar, Clock, Users, RefreshCcw, QrCode, Loader2 } from "lucide-react";

interface Pertemuan {
  id: number;
  nama_topik: string;
  hari: string;
  tanggal: string;
  kelas: string;
  jam_mulai: string;
  jam_akhir: string;
  status: string;
  qr_code?: string;
}

interface DashboardData {
  pertemuan: Pertemuan[];
  currentPeriod: {
    semester: string;
    tahun: string;
  };
}

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<number | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentPertemuanId, setCurrentPertemuanId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError('Gagal mengambil data dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanAbsen = async (pertemuanId: number) => {
    setCurrentPertemuanId(pertemuanId);
    setShowQRScanner(true);
  };

  const handleQRScanSuccess = async (qrData: string) => {
    if (!currentPertemuanId) return;
    
    try {
      setScanningId(currentPertemuanId);
      
      const response = await fetch('/api/user/absen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertemuan_id: currentPertemuanId,
          qr_data: qrData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Absensi berhasil dicatat!');
        fetchDashboardData();
      } else {
        alert(`❌ ${result.message || 'Gagal melakukan absen'}`);
      }
    } catch (err) {
      alert('❌ Terjadi kesalahan saat melakukan absen');
      console.error('Absen error:', err);
    } finally {
      setScanningId(null);
      setCurrentPertemuanId(null);
    }
  };

  const handleCloseScannerModal = () => {
    setShowQRScanner(false);
    setCurrentPertemuanId(null);
    setScanningId(null);
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWaktu = (jamMulai: string, jamAkhir: string) => {
    return `${jamMulai.substring(0, 5)} - ${jamAkhir.substring(0, 5)} WIB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'berlangsung':
        return 'success';
      case 'akan_dimulai':
        return 'warning';
      case 'selesai':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'berlangsung':
        return 'Berlangsung';
      case 'akan_dimulai':
        return 'Akan Dimulai';
      case 'selesai':
        return 'Selesai';
      case 'belum_mulai':
        return 'Belum Dimulai';
      default:
        return status;
    }
  };

  if (loading) {
  return (
    <section className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    </section>
  );
}

  if (error) {
    return (
      <section className="p-6">
        <Card className="border-red-200 shadow-md">
          <CardBody className="text-center py-10">
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button 
              color="primary" 
              onClick={fetchDashboardData}
              className="bg-blue-600 hover:bg-blue-700"
              startContent={<RefreshCcw size={18} />}
            >
              Coba Lagi
            </Button>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Jadwal Hari Ini</h1>
          <p className="mt-1 text-gray-600">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Chip 
          color="primary" 
          variant="flat" 
          className="bg-yellow-100 text-yellow-800 font-semibold"
        >
          Periode {data?.currentPeriod?.semester} {data?.currentPeriod?.tahun}
        </Chip>
      </div>

      {/* Pertemuan List */}
      <div className="space-y-6">
        {data?.pertemuan && data.pertemuan.length > 0 ? (
          data.pertemuan.map((pertemuan) => (
            <Card 
              key={pertemuan.id} 
              className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
            >
              <CardHeader className=" border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-white rounded-t-2xl">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {pertemuan.nama_topik}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <Users size={16} className="text-gray-500" />
                      <span className="text-sm">Ruang {pertemuan.kelas}</span>
                    </div>
                  </div>
                  <Chip 
                    color={getStatusColor(pertemuan.status)}
                    variant="flat"
                    size="sm"
                    className="uppercase tracking-wide font-medium"
                  >
                    {getStatusText(pertemuan.status)}
                  </Chip>
                </div>
              </CardHeader>
              
              <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Calendar className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal</p>
                      <p className="font-semibold text-gray-800">
                        {formatTanggal(pertemuan.tanggal)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-xl">
                      <Clock className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="font-semibold text-gray-800">
                        {formatWaktu(pertemuan.jam_mulai, pertemuan.jam_akhir)}
                      </p>
                    </div>
                  </div>
                </div>

                <Divider className="my-4" />
                
                <div className="flex justify-center">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                    isLoading={scanningId === pertemuan.id}
                    onClick={() => handleScanAbsen(pertemuan.id)}
                    startContent={
                      scanningId === pertemuan.id 
                        ? <Loader2 className="animate-spin" size={18} /> 
                        : <QrCode size={18} />
                    }
                  >
                    {scanningId === pertemuan.id ? 'Sedang Scan...' : 'Scan QR Code Absen'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card className="border-gray-200">
            <CardBody className="text-center py-12">
              <Calendar className="mx-auto text-gray-300 mb-4" size={56} />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Tidak Ada Pertemuan Hari Ini
              </h3>
              <p className="text-gray-500">
                Silakan cek jadwal untuk hari-hari selanjutnya
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center mt-8">
        <Button
          variant="bordered"
          onClick={fetchDashboardData}
          className="border-gray-300 hover:border-blue-500 hover:text-blue-600 rounded-lg px-6"
          startContent={<RefreshCcw size={18} />}
        >
          Refresh Data
        </Button>
      </div>

      {/* QR Scanner Modal */}
      {currentPertemuanId && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={handleCloseScannerModal}
          onSuccess={handleQRScanSuccess}
          pertemuanId={currentPertemuanId.toString()}
        />
      )}
    </section>
  );
}
