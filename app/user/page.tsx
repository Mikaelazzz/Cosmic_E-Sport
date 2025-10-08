"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Alert } from '@heroui/react';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import QRScannerModal from '@/components/QRScannerModal';
import UserLayout from '@/components/UserLayout';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth(); // Get current user with NIM
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<number | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentPertemuanId, setCurrentPertemuanId] = useState<number | null>(null);
  
  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    color: 'success' as 'success' | 'danger' | 'warning',
    variant: 'faded' as 'faded' | 'flat' | 'bordered'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showAlertMessage = (title: string, description: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setAlertConfig({ title, description, color, variant: 'faded' });
    setShowAlert(true);
  };

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
    
    // console.log('🔍 User data check:', { user, nim: user?.nim });
    
    // Get NIM from user or use fallback for testing
    let userNim = user?.nim;
    
    if (!user || !userNim) {
      console.warn('⚠️ User not logged in or no NIM, using fallback for testing');
      // For testing: use a default NIM (you can replace this with actual logged user)
      userNim = '213100002'; // Use Odo G's NIM for testing
      
      showAlertMessage(
        'Info Testing',
        `Menggunakan NIM fallback: ${userNim} (Odo G) untuk testing. Silakan login dengan user yang benar.`,
        'warning'
      );
    }
    
    // console.log('📤 Sending absen request:', {
    //   pertemuan_id: currentPertemuanId,
    //   nim: userNim,
    //   qr_data_preview: qrData.substring(0, 100) + '...'
    // });
    
    try {
      setScanningId(currentPertemuanId);
      
      const response = await fetch('/api/user/absen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertemuan_id: currentPertemuanId,
          qr_data: qrData,
          nim: userNim  // Send user's NIM or fallback
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showAlertMessage(
          'Absensi Berhasil!', 
          'Kehadiran Anda telah berhasil dicatat dalam sistem.',
          'success'
        );
        
        // Emit real-time event untuk update moderator dashboard
        if (result.real_time?.pertemuan_id) {
          // console.log('🔔 Broadcasting attendance update event');
          const customEvent = new CustomEvent('absensi-updated', {
            detail: { 
              pertemuanId: result.real_time.pertemuan_id,
              timestamp: result.real_time.timestamp,
              nim: userNim,
              status: result.data?.status
            }
          });
          window.dispatchEvent(customEvent);
        }
        
        fetchDashboardData();
      } else {
        showAlertMessage(
          'Absensi Gagal',
          result.message || 'Gagal melakukan absen. Silakan coba lagi.',
          'danger'
        );
      }
    } catch (err) {
      showAlertMessage(
        'Terjadi Kesalahan',
        'Terjadi kesalahan saat melakukan absen. Silakan periksa koneksi internet Anda.',
        'danger'
      );
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format tanggal untuk perbandingan (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    let dayInfo = '';
    if (dateStr === todayStr) {
      dayInfo = 'Hari Ini • ';
    } else if (dateStr === tomorrowStr) {
      dayInfo = 'Besok • ';
    }
    
    return dayInfo + date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWaktu = (jamMulai: string, jamAkhir: string) => {
    return `${jamMulai.substring(0, 5)} - ${jamAkhir.substring(0, 5)} WIB`;
  };

  const getStatusColor = (status: string, tanggal: string, jamMulai: string, jamAkhir: string) => {
    const now = new Date();
    const pertemuanDate = new Date(tanggal);
    const today = now.toISOString().split('T')[0];
    const pertemuanDateStr = pertemuanDate.toISOString().split('T')[0];
    
    // Set waktu pertemuan
    const jamMulaiTime = new Date(`${tanggal}T${jamMulai}`);
    const jamAkhirTime = new Date(`${tanggal}T${jamAkhir}`);
    
    // Logic untuk menentukan status real-time
    if (pertemuanDateStr === today) {
      if (now >= jamMulaiTime && now <= jamAkhirTime) {
        return 'success'; // sedang berlangsung
      } else if (now < jamMulaiTime) {
        return 'warning'; // akan dimulai hari ini
      } else {
        return 'default'; // sudah selesai
      }
    } else if (pertemuanDate > now) {
      return 'primary'; // akan datang
    } else {
      return 'default'; // sudah lewat
    }
  };

  const getStatusText = (status: string, tanggal: string, jamMulai: string, jamAkhir: string) => {
    const now = new Date();
    const pertemuanDate = new Date(tanggal);
    const today = now.toISOString().split('T')[0];
    const pertemuanDateStr = pertemuanDate.toISOString().split('T')[0];
    
    // Set waktu pertemuan
    const jamMulaiTime = new Date(`${tanggal}T${jamMulai}`);
    const jamAkhirTime = new Date(`${tanggal}T${jamAkhir}`);
    
    // Logic untuk menentukan status real-time
    if (pertemuanDateStr === today) {
      if (now >= jamMulaiTime && now <= jamAkhirTime) {
        return 'Berlangsung';
      } else if (now < jamMulaiTime) {
        const diffMinutes = Math.floor((jamMulaiTime.getTime() - now.getTime()) / (1000 * 60));
        if (diffMinutes <= 60) {
          return `Dimulai ${diffMinutes}m lagi`;
        }
        return 'Hari Ini';
      } else {
        return 'Selesai';
      }
    } else if (pertemuanDate > now) {
      const diffDays = Math.floor((pertemuanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        return 'Besok';
      } else if (diffDays <= 7) {
        return `${diffDays} hari lagi`;
      }
      return 'Akan Datang';
    } else {
      return 'Sudah Lewat';
    }
  };

  if (loading) {
    return (
      <UserLayout
        title="Dashboard"
        description="Selamat datang di dashboard user"
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout
        title="Dashboard"
        description="Selamat datang di dashboard user"
      >
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
      </UserLayout>
    );
  }

  return (
    <UserLayout
      title="Jadwal Pertemuan"
      description={`Jadwal minggu ini (${new Date().toLocaleDateString('id-ID')} - ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')})`}
    >
      <div className="flex justify-end mb-4">
        <Chip 
          color="primary" 
          variant="flat" 
          className="bg-yellow-100 text-yellow-800 font-semibold"
        >
          Periode {data?.currentPeriod?.semester} {data?.currentPeriod?.tahun}
        </Chip>
      </div>

      {/* Alert Notification */}
      <div className="mb-6">
        {showAlert && (
          <Alert
            color={alertConfig.color}
            description={alertConfig.description}
            isVisible={showAlert}
            title={alertConfig.title}
            variant={alertConfig.variant}
            onClose={() => setShowAlert(false)}
          />
        )}
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
                    color={getStatusColor(pertemuan.status, pertemuan.tanggal, pertemuan.jam_mulai, pertemuan.jam_akhir)}
                    variant="flat"
                    size="sm"
                    className="uppercase tracking-wide font-medium"
                  >
                    {getStatusText(pertemuan.status, pertemuan.tanggal, pertemuan.jam_mulai, pertemuan.jam_akhir)}
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
                Tidak Ada Jadwal Pertemuan
              </h3>
              <p className="text-gray-500">
                Belum ada jadwal pertemuan untuk minggu ini
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Refresh Button */}
      {/* <div className="flex justify-center mt-8">
        <Button
          variant="bordered"
          onClick={fetchDashboardData}
          className="border-gray-300 hover:border-blue-500 hover:text-blue-600 rounded-lg px-6"
          startContent={<RefreshCcw size={18} />}
        >
          Refresh Data
        </Button>
      </div> */}

      {/* QR Scanner Modal */}
      {currentPertemuanId && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={handleCloseScannerModal}
          onSuccess={handleQRScanSuccess}
          pertemuanId={currentPertemuanId.toString()}
        />
      )}
    </UserLayout>
  );
}
