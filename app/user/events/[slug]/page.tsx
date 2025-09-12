"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserLayout from "@/components/UserLayout";
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBuktiPembayaran(result.url);
        } else {
          alert('Failed to upload file');
          setSelectedFile(null);
        }
      } else {
        alert('Failed to upload file');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
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
      alert('Please upload payment proof for paid events');
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
          // Refresh event details to get updated participation
          await fetchEventDetails();
          onJoinClose();
          resetJoinForm();
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
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
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
      description="Lihat detail dan ikut event">
      <div className="min-h-screen bg-[#0B0D21] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            color="primary"
            onPress={() => router.push('/user/events')}
            className="mb-4"
          >
            ← Back to Events
          </Button>
          <h1 className="text-3xl font-bold text-[#FFD700]">Event Details</h1>
        </div>

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
                    <span className="text-gray-400">No image available</span>
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
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {event.deskripsi}
                  </p>
                </div>

                {/* Terms and Conditions */}
                {event.syarat_dan_ketentuan && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Terms and Conditions</h3>
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
                <h3 className="text-xl font-bold text-[#FFD700] mb-4">Event Information</h3>

                <div className="space-y-4">
                  {/* Event Date */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Event Date</h4>
                    <p className="text-white">{formatDate(event.tanggal_pelaksanaan)}</p>
                    {event.tanggal_awal && event.tanggal_akhir && (
                      <p className="text-sm text-gray-400">
                        Registration: {formatDate(event.tanggal_awal)} - {formatDate(event.tanggal_akhir)}
                      </p>
                    )}
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Participant Type */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Participant Type</h4>
                    <Chip
                      color={event.participant_type === 'individual' ? 'primary' : 'secondary'}
                      size="sm"
                      variant="flat"
                    >
                      {event.participant_type === 'individual' ? 'Individual' : 'Team'}
                    </Chip>
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Participants */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Participants</h4>
                    <p className="text-white">
                      {event.current_participants || 0} / {event.max_participant}
                    </p>
                    {event.participant_type === 'team' && (
                      <p className="text-sm text-gray-400">
                        {event.anggota_participant} members per team
                      </p>
                    )}
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Cost */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Registration Fee</h4>
                    <p className="text-xl font-bold text-[#FFD700]">
                      {event.biaya === 0 ? 'FREE' : formatCurrency(event.biaya)}
                    </p>
                  </div>

                  <Divider className="bg-gray-600" />

                  {/* Tournament Bracket */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Tournament Bracket</h4>
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
                        <h4 className="text-sm font-medium text-gray-400 mb-2">My Registration</h4>
                        <Chip
                          color={participantStatusColorMap[myParticipation.status]}
                          size="sm"
                          variant="flat"
                          className="mb-2"
                        >
                          {myParticipation.status.toUpperCase()}
                        </Chip>
                        <p className="text-xs text-gray-400">
                          Registered: {formatDate(myParticipation.tanggal_daftar)}
                        </p>
                        
                        {/* Payment Proof */}
                        {myParticipation.bukti_pembayaran && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-1">Payment Proof:</p>
                            <img 
                              src={myParticipation.bukti_pembayaran} 
                              alt="Payment proof"
                              className="w-16 h-16 object-cover rounded border border-green-500 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => handleImagePreview(myParticipation.bukti_pembayaran!)}
                            />
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {myParticipation.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-600/50 rounded text-xs text-red-400">
                            <strong>Rejection Reason:</strong> {myParticipation.rejection_reason}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Join Button */}
                  {canJoinEvent() && (
                    <>
                      <Divider className="bg-gray-600" />
                      <Button
                        color="primary"
                        size="lg"
                        className="w-full font-bold"
                        onPress={onJoinOpen}
                      >
                        Join Event
                      </Button>
                    </>
                  )}

                  {/* Full indicator */}
                  {event.current_participants && event.current_participants >= event.max_participant && !myParticipation && (
                    <>
                      <Divider className="bg-gray-600" />
                      <div className="text-center">
                        <Chip color="danger" variant="flat" size="sm">
                          Event Full
                        </Chip>
                      </div>
                    </>
                  )}
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
            Join Event: {event?.nama_event}
          </ModalHeader>
          <ModalBody>
            {event && event.biaya > 0 && (
              <Alert color="warning" className="mb-4">
                <strong>Registration Fee:</strong> {formatCurrency(event.biaya)}
                <br />
                Please upload payment proof to complete your registration.
              </Alert>
            )}

            {event && event.biaya > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Payment Proof <span className="text-red-500">*</span>
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
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                    {selectedFile && buktiPembayaran && (
                      <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">File uploaded successfully</span>
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
                <p className="text-sm text-gray-400 mb-2">Terms and Conditions:</p>
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
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleJoinEvent}
              isLoading={isSubmitting || isUploading}
              isDisabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Join Event"}
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
            Payment Proof
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
