"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserLayout from "@/components/UserLayout";
import { getPaymentProofUrl } from '@/lib/payment-proof';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Spinner,
  Alert,
} from "@heroui/react";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface Event {
  id: string;
  nama_event: string;
  gambar: string | null;
  tanggal_pelaksanaan: string;
  tanggal_awal: string | null;
  tanggal_akhir: string | null;
  deskripsi: string;
  syarat_dan_ketentuan: string | null;
  anggota_participant: number;
  max_participant: number;
  biaya: number;
  participant_type: 'individual' | 'team';
  status: 'open' | 'closed' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  current_participants?: number;
}

interface MyEventParticipant {
  id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected';
  bukti_pembayaran: string | null;
  rejection_reason: string | null;
  tanggal_daftar: string;
}

// Component untuk tombol bracket di halaman detail event
const BracketButton: React.FC<{ eventId: string; eventDate: string; eventStatus: string }> = ({ 
  eventId, 
  eventDate, 
  eventStatus 
}) => {
  const [hasBracket, setHasBracket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  // Check if bracket should be accessible
  const isBracketAccessible = () => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    
    // Bracket accessible if:
    // 1. Current date >= event date (registration closed)
    // 2. Event status is not 'open' (registration is closed)
    return now >= eventDateTime && eventStatus !== 'open';
  };

  useEffect(() => {
    const checkBracket = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/bracket`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          setHasBracket(result.success && result.data !== null);
        }
      } catch (error) {
        console.error('Error checking bracket:', error);
        setHasBracket(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      checkBracket();
    }
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="text-center p-2">
        <span className="text-sm text-gray-400">Loading bracket...</span>
      </div>
    );
  }

  // If bracket is not accessible yet
  if (!isBracketAccessible()) {
    const eventDateTime = new Date(eventDate);
    const formattedDate = eventDateTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return (
      <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="text-sm text-gray-400 mb-1">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Bracket tersedia mulai:
        </div>
        <div className="text-sm font-medium text-yellow-400">
          {formattedDate}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          (Setelah registrasi ditutup)
        </div>
      </div>
    );
  }

  if (!hasBracket) {
    return (
      <div className="text-center p-2 bg-gray-800/50 rounded-lg">
        <span className="text-sm text-gray-400">Bracket belum tersedia</span>
      </div>
    );
  }

  return (
    <Button
      color="secondary"
      variant="flat"
      className="w-full"
      startContent={
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 3H6V7H2V3ZM18 3H22V7H18V3ZM2 17H6V21H2V17ZM18 17H22V21H18V17ZM7 4H17V6H7V4ZM7 18H17V20H7V18ZM8 8V16H10V13H14V16H16V8H14V11H10V8H8Z"/>
        </svg>
      }
      onPress={() => router.push(`/user/events/${params.slug}/bracket`)}
    >
      Lihat Bracket
    </Button>
  );
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [myParticipation, setMyParticipation] = useState<MyEventParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join event form states
  const [catatan, setCatatan] = useState("");
  const [buktiPembayaran, setBuktiPembayaran] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Modal
  const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format event image path
  const formatEventImagePath = (eventId: string, imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `/api/events/${eventId}/image?path=${encodeURIComponent(imagePath)}`;
  };

  // Status color mapping
  const statusColorMap = {
    open: "success" as const,
    closed: "warning" as const,
    ongoing: "primary" as const,
    completed: "secondary" as const,
    cancelled: "danger" as const,
  };

  const participantStatusColorMap = {
    pending: "warning" as const,
    approved: "success" as const,
    rejected: "danger" as const,
  };

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      const slug = params.slug as string;
      const response = await fetch(`/api/events/detail/${slug}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvent(result.data.event);
          setMyParticipation(result.data.participation);
        } else {
          setError(result.message || 'Failed to fetch event details');
        }
      } else {
        setError('Failed to fetch event details');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('An error occurred while fetching event details');
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setFileError("");

    // Validate file type - only accept image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak valid! Hanya menerima format gambar (JPG, PNG, WEBP, GIF).');
      // Reset file input
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setFileError('Ukuran file melebihi batas maksimal 5MB! Silakan pilih file yang lebih kecil.');
      // Reset file input
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('payment_proof', file);

      const response = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBuktiPembayaran(result.data.filePath);
          setFileError(""); // Clear any previous errors
        } else {
          setFileError('Gagal mengunggah file: ' + (result.message || 'Unknown error'));
          setSelectedFile(null);
        }
      } else {
        setFileError('Gagal mengunggah file. Silakan coba lagi.');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFileError('Terjadi kesalahan saat mengunggah file. Silakan coba lagi.');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle join event
  const handleJoinEvent = async () => {
    if (!event || !user) return;

    // Validate payment proof for paid events
    if (event.biaya > 0 && !buktiPembayaran) {
      setFileError('Bukti pembayaran wajib diupload terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/events/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          event_id: event.id,
          catatan,
          bukti_pembayaran: buktiPembayaran || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show success message
          setSuccessMessage(
            event.biaya > 0 
              ? "Pendaftaran berhasil! Menunggu persetujuan moderator."
              : "Pendaftaran berhasil! Anda telah terdaftar di event ini."
          );
          
          // Refresh event details to get updated participation
          await fetchEventDetails();
          onJoinClose();
          resetJoinForm();
          
          // Auto hide success message after 5 seconds
          setTimeout(() => setSuccessMessage(""), 5000);
        } else {
          alert(result.message || 'Failed to join event');
        }
      } else {
        alert('Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('An error occurred while joining the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset join form
  const resetJoinForm = () => {
    setCatatan("");
    setBuktiPembayaran("");
    setSelectedFile(null);
    setFileError("");
  };

  // Handle image preview
  const handleImagePreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    onImageOpen();
  };

  // Check if user can join event
  const canJoinEvent = () => {
    if (!event || !isAuthenticated) return false;
    if (event.status !== 'open') return false;
    if (myParticipation) return false; // Already registered
    if (event.current_participants && event.current_participants >= event.max_participant) return false;
    return true;
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetchEventDetails().finally(() => setIsLoading(false));
    }
  }, [params.slug, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <Card className="bg-[#111020] border-2 border-[#FFD700] p-8">
          <CardBody className="text-center">
            <h2 className="text-2xl font-bold text-[#FFD700] mb-4">Authentication Required</h2>
            <p className="text-gray-300 mb-6">Please login to view event details</p>
            <Button
              color="primary"
              onPress={() => router.push('/auth/login')}
            >
              Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <Card className="bg-[#111020] border-2 border-red-500 p-8">
          <CardBody className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-gray-300 mb-6">{error || 'Event not found'}</p>
            <Button
              color="primary"
              onPress={() => router.push('/user/events')}
            >
              Back to Events
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <UserLayout 
      title="Event Details"
      description=""
      >
        
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <Alert color="success" className="mb-6 animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <strong>{successMessage}</strong>
            </div>
          </Alert>
        )}

        {/* Header
        <div className="mb-6">
          <Button
            variant="light"
            color="primary"
            onPress={() => router.push('/user/events')}
            className="mb-4"
          >
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-[#FFD700]">Detail Event</h1>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Image and Basic Info */}
          <div className="lg:col-span-2">
            <Card className="bg-[#111020] border-2 border-[#FFD700] mb-6">
              <CardBody className="p-6">
                {/* Event Image */}
                {event.gambar ? (
                  <img
                    src={formatEventImagePath(event.id, event.gambar) || event.gambar}
                    alt={event.nama_event}
                    className="w-full h-64 md:h-80 object-cover rounded-lg mb-6"
                    onError={(e) => {
                      console.error('Event image failed to load:', event.gambar);
                      const img = e.target as HTMLImageElement;
                      if (img.src !== event.gambar && event.gambar) {
                        img.src = event.gambar;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-64 md:h-80 bg-gray-700 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-gray-400">Tidak ada gambar yang tersedia</span>
                  </div>
                )}

                {/* Event Title and Status */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#FFD700] mb-2 md:mb-0">
                    {event.nama_event}
                  </h2>
                  <Chip
                    color={statusColorMap[event.status]}
                    size="lg"
                    variant="flat"
                    className="font-medium w-fit"
                  >
                    {event.status.toUpperCase()}
                  </Chip>
                </div>

                {/* Event Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Deskripsi</h3>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {event.deskripsi}
                  </p>
                </div>

                {/* Terms and Conditions */}
                {event.syarat_dan_ketentuan && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Syarat dan Ketentuan</h3>
                    <div className="bg-[#1a1a2e]/50 p-4 rounded-lg">
                      <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {event.syarat_dan_ketentuan}
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Event Details Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#111020] border-2 border-[#FFD700] sticky top-6">
              <CardBody className="p-6">
                <h3 className="text-xl font-bold text-[#FFD700] mb-4">Informasi Event</h3>

                <div className="space-y-4">
                  {/* Event Date */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Tanggal Event</h4>
                    <p className="text-white">{formatDate(event.tanggal_pelaksanaan)}</p>
                    {event.tanggal_awal && event.tanggal_akhir && (
                      <p className="text-sm text-gray-400">
                        Pendaftaran : {formatDate(event.tanggal_awal)} - {formatDate(event.tanggal_akhir)}
                      </p>
                    )}
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Participant Type */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Tipe Peserta</h4>
                    <Chip
                      color={event.participant_type === 'individual' ? 'primary' : 'secondary'}
                      size="sm"
                      variant="flat"
                    >
                      {event.participant_type === 'individual' ? 'Individual' : 'Team'}
                    </Chip>
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Peserta */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Peserta</h4>
                    <p className="text-white">
                      {event.current_participants || 0} / {event.max_participant}
                    </p>
                    {event.participant_type === 'team' && (
                      <p className="text-sm text-gray-400">
                        {event.anggota_participant} anggota per tim
                      </p>
                    )}
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Cost */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Biaya Pendaftaran</h4>
                    <p className="text-xl font-bold text-[#FFD700]">
                      {event.biaya === 0 ? 'Gratis' : formatCurrency(event.biaya)}
                    </p>
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Turnamen Bracket */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Turnamen Bracket</h4>
                    <BracketButton 
                      eventId={event.id} 
                      eventDate={event.tanggal_pelaksanaan}
                      eventStatus={event.status}
                    />
                  </div>

                  {/* My Participation Status */}
                  {myParticipation && (
                    <>
                      <Divider className="bg-gray-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Status</h4>
                        <Chip
                          color={participantStatusColorMap[myParticipation.status]}
                          size="sm"
                          variant="flat"
                          className="mb-2"
                        >
                          {myParticipation.status.toUpperCase()}
                        </Chip>
                        <p className="text-xs text-gray-400">
                          Terdaftar : {formatDate(myParticipation.tanggal_daftar)}
                        </p>
                        
                        {/* Payment Proof */}
                        {myParticipation.bukti_pembayaran && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-1">Bukti Pembayaran :</p>
                            <img 
                              src={getPaymentProofUrl(myParticipation.bukti_pembayaran) || '/placeholder-image.jpg'} 
                              alt="Payment proof"
                              className="w-16 h-16 object-cover rounded border border-green-500 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => handleImagePreview(getPaymentProofUrl(myParticipation.bukti_pembayaran)!)}
                            />
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {myParticipation.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-600/50 rounded text-xs text-red-400">
                            <strong>Alasan Penolakan :</strong> {myParticipation.rejection_reason}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Join Button or Already Registered Notice */}
                  {canJoinEvent() ? (
                    <>
                      <Divider className="bg-gray-600" />
                      <Button
                        color="primary"
                        size="lg"
                        className="w-full font-bold"
                        onPress={onJoinOpen}
                      >
                        Ikuti Event
                      </Button>
                    </>
                  ) : myParticipation ? (
                    <>
                      <Divider className="bg-gray-600" />
                      <div className="text-center p-4 bg-blue-900/20 rounded-lg border-2 border-blue-500">
                        <div className="mb-2">
                          <svg className="w-12 h-12 mx-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-white font-bold text-lg mb-1">Anda Sudah Terdaftar!</p>
                        <p className="text-sm text-blue-300">
                          Status: <span className="font-semibold capitalize">{myParticipation.status}</span>
                        </p>
                        {myParticipation.status === 'pending' && (
                          <p className="text-xs text-gray-400 mt-2">
                            Menunggu persetujuan moderator
                          </p>
                        )}
                        {myParticipation.status === 'approved' && (
                          <p className="text-xs text-green-400 mt-2">
                            ✅ Pendaftaran Anda telah disetujui
                          </p>
                        )}
                      </div>
                    </>
                  ) : event.status !== 'open' ? (
                    <>
                      <Divider className="bg-gray-600" />
                      <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                        <Chip color="warning" variant="flat" size="sm">
                          Pendaftaran Ditutup
                        </Chip>
                        <p className="text-xs text-gray-400 mt-2">
                          Event ini tidak menerima pendaftaran baru
                        </p>
                      </div>
                    </>
                  ) : event.current_participants && event.current_participants >= event.max_participant ? (
                    <>
                      <Divider className="bg-gray-600" />
                      <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-600/50">
                        <Chip color="danger" variant="flat" size="sm">
                          Slot Penuh
                        </Chip>
                        <p className="text-xs text-red-400 mt-2">
                          Semua slot sudah terisi
                        </p>
                      </div>
                    </>
                  ) : null}

                  {/* Full indicator */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Status Slot Turnamen</h4>
                    {(() => {
                      const currentParticipants = event.current_participants || 0;
                      const maxParticipants = event.max_participant;
                      const percentage = (currentParticipants / maxParticipants) * 100;

                      if (percentage >= 100) {
                        return (
                          <div className="text-center p-2 bg-red-900/20 rounded-lg border border-red-600/50">
                            <Chip color="danger" variant="flat" size="sm" className="font-semibold">
                              🔥 Event Penuh
                            </Chip>
                            <p className="text-xs text-red-400 mt-1">Slot sudah terisi penuh</p>
                          </div>
                        );
                      } else if (percentage >= 70) {
                        return (
                          <div className="text-center p-2 bg-orange-900/20 rounded-lg border border-orange-600/50">
                            <Chip color="warning" variant="flat" size="sm" className="font-semibold">
                              ⚡ Hot - Hampir Penuh!
                            </Chip>
                            <p className="text-xs text-orange-400 mt-1">
                              {maxParticipants - currentParticipants} slot tersisa
                            </p>
                          </div>
                        );
                      } else if (percentage >= 50) {
                        return (
                          <div className="text-center p-2 bg-yellow-900/20 rounded-lg border border-yellow-600/50">
                            <Chip color="warning" variant="flat" size="sm" className="font-semibold">
                              🔥 On Fire - Ayo Buruan!
                            </Chip>
                            <p className="text-xs text-yellow-400 mt-1">
                              {maxParticipants - currentParticipants} slot tersisa
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center p-2 bg-green-900/20 rounded-lg border border-green-600/50">
                            <Chip color="success" variant="flat" size="sm" className="font-semibold">
                              ✨ Slot Masih Tersedia
                            </Chip>
                            <p className="text-xs text-green-400 mt-1">
                              {maxParticipants - currentParticipants} dari {maxParticipants} slot
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Join Event Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => {
          onJoinClose();
          resetJoinForm();
        }}
        size="2xl"
        className="bg-[#111020]"
      >
        <ModalContent>
          <ModalHeader className="text-[#FFD700]">
            Ikuti Event : {event?.nama_event}
          </ModalHeader>
          <ModalBody>
            {event && event.biaya > 0 && (
              <Alert color="warning" className="mb-4">
                <strong>Biaya Pendaftaran:</strong> {formatCurrency(event.biaya)}
                <br />
                Silakan unggah bukti pembayaran untuk menyelesaikan pendaftaran Anda.
                <br />
                <span className="text-sm">Format: JPG, PNG, WEBP, GIF | Maksimal: 5MB</span>
              </Alert>
            )}

            {fileError && (
              <Alert color="danger" className="mb-4">
                <strong>Error Upload File:</strong>
                <br />
                {fileError}
              </Alert>
            )}

            {event && event.biaya > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Bukti Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700
                        file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Spinner size="sm" />
                        <span className="text-sm">Mengunggah...</span>
                      </div>
                    )}
                    {selectedFile && buktiPembayaran && (
                      <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">File berhasil diunggah</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <img 
                          src={buktiPembayaran} 
                          alt="Payment proof preview"
                          className="w-32 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Textarea
              label="Notes (Optional)"
              placeholder="Any additional notes or comments"
              value={catatan}
              onValueChange={setCatatan}
              variant="bordered"
              classNames={{ input: "text-white" }}
              minRows={3}
            />

            {event && event.syarat_dan_ketentuan && (
              <div className="bg-[#1a1a2e]/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Syarat dan Ketentuan:</p>
                <p className="text-sm text-white whitespace-pre-wrap">
                  {event.syarat_dan_ketentuan}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                onJoinClose();
                resetJoinForm();
              }}
            >
              Batal
            </Button>
            <Button
              color="primary"
              onPress={handleJoinEvent}
              isLoading={isSubmitting || isUploading}
              isDisabled={isUploading}
            >
              {isUploading ? "Mengunggah..." : "Ikuti Event"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isImageOpen}
        onClose={onImageClose}
        size="3xl"
        className="bg-[#111020]"
      >
        <ModalContent>
          <ModalHeader className="text-[#FFD700]">
            Bukti Pembayaran
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedImageUrl && (
              <div className="flex justify-center">
                <img 
                  src={selectedImageUrl} 
                  alt="Payment proof"
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  </UserLayout>
  );
}
