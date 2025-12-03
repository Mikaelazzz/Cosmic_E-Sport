"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EventImageUpload from "@/components/EventImageUpload";
import ModeratorLayout from "@/components/ModeratorLayout";
import { getEventImageUrlWithCache } from '@/lib/event-image';
import { getPaymentProofUrl } from '@/lib/payment-proof';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Alert,
  Spinner,
  Badge,
  Image,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  TrophyIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface Event {
  id: number;
  nama_event: string;
  gambar: string | null;
  tanggal_pelaksanaan: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  deskripsi: string;
  syarat_dan_ketentuan: string;
  anggota_participant: number;
  max_participant: number;
  biaya: number;
  participant_type: 'individual' | 'team';
  status: 'open' | 'closed' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  current_participants_count?: number;
  pending_participants_count?: number;
}

interface EventParticipant {
  id: number;
  event_id: number;
  user_id: string;
  team_id: number | null;
  nim: string;
  participant_type: 'individual' | 'team';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  bukti_pembayaran: string | null;
  catatan: string | null;
  rejection_reason?: string | null;
  tanggal_daftar: string;
  tanggal_approve: string | null;
  team_member_count?: number;
  users: {
    id: string;
    nama_lengkap: string;
    email: string;
    nim: string;
    role: string;
    profile_image: string | null;
  };
  teams?: {
    id: number;
    nama_team: string;
    deskripsi: string;
    max_participants: number;
    win_rate: number;
  } | null;
}

interface EventFormData {
  nama_event: string;
  tanggal_pelaksanaan: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  deskripsi: string;
  syarat_dan_ketentuan: string;
  max_participant: number;
  biaya: number;
  participant_type: 'individual' | 'team';
  status: 'open' | 'closed' | 'ongoing' | 'completed' | 'cancelled';
}

const statusColorMap = {
  open: "success",
  closed: "warning", 
  ongoing: "primary",
  completed: "secondary",
  cancelled: "danger",
} as const;

const participantStatusColorMap = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
} as const;

const rejectionReasons = [
  { key: "slot_penuh", label: "Slot telah penuh" },
  { key: "bukti_tidak_valid", label: "Bukti pendaftaran tidak valid" },
  { key: "team_tidak_lengkap", label: "Team tidak lengkap" },
  { key: "syarat_tidak_terpenuhi", label: "Syarat dan ketentuan tidak terpenuhi" },
  { key: "dokumen_kurang", label: "Dokumen pendukung kurang lengkap" },
  { key: "pembayaran_gagal", label: "Pembayaran tidak sesuai" },
  { key: "lainnya", label: "Lainnya" },
];

const statusOptions = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "completed", label: "Completed" },
];

const participantTypeOptions = [
  { key: "individual", label: "Individual" },
  { key: "team", label: "Team" },
];

export default function EventsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [historyEvents, setHistoryEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [activeTab, setActiveTab] = useState("management");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isParticipantsOpen, onOpen: onParticipantsOpen, onClose: onParticipantsClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  
  // Form states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    nama_event: "",
    tanggal_pelaksanaan: "",
    tanggal_awal: "",
    tanggal_akhir: "",
    deskripsi: "",
    syarat_dan_ketentuan: "",
    max_participant: 50,
    biaya: 0,
    participant_type: "individual",
    status: "open",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUploadKey, setImageUploadKey] = useState(0); // Force re-render key for image upload

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    color: "success" | "warning" | "danger";
    title: string;
    description: string;
  } | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  // Rejection modal state
  const [selectedParticipantForReject, setSelectedParticipantForReject] = useState<EventParticipant | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");

  const showAlert = (color: "success" | "warning" | "danger", title: string, description: string) => {
    setAlertConfig({ color, title, description });
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 5000);
  };

  // Auto update event status based on date
  const autoUpdateEventStatus = async (events: Event[]) => {
    const now = new Date();
    const eventsToUpdate: Event[] = [];

    events.forEach(event => {
      const eventDate = new Date(event.tanggal_pelaksanaan);
      
      // If event date has passed and status is still 'open', change to 'closed'
      if (now >= eventDate && event.status === 'open') {
        eventsToUpdate.push(event);
      }
    });

    // Update events that need status change
    for (const event of eventsToUpdate) {
      try {
        await fetch(`/api/events/${event.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'closed' })
        });
      } catch (error) {
        console.error('Error auto-updating event status:', error);
      }
    }

    // If any events were updated, refresh the data
    if (eventsToUpdate.length > 0) {
      return true; // Indicates refresh needed
    }
    return false;
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events/moderator', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Auto-update event status if needed
          const needsRefresh = await autoUpdateEventStatus(result.data);
          
          if (needsRefresh) {
            // Refresh data after auto-update
            const refreshResponse = await fetch('/api/events/moderator', {
              method: 'GET',
              credentials: 'include'
            });
            
            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json();
              if (refreshResult.success) {
                const activeEvents = refreshResult.data.filter((event: Event) => event.status !== 'cancelled');
                setEvents(activeEvents);
              }
            }
          } else {
            // For moderator view, we can show all events except cancelled ones (soft deleted)
            const activeEvents = result.data.filter((event: Event) => event.status !== 'cancelled');
            setEvents(activeEvents);
          }
          setError("");
        } else {
          setError(result.message || "Failed to fetch events");
        }
      } else {
        setError("Failed to fetch events");
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError("An error occurred while fetching events");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch history events (cancelled/deleted events)
  const fetchHistoryEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events/moderator', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show only cancelled events (deleted events)
          const deletedEvents = result.data.filter((event: Event) => event.status === 'cancelled');
          setHistoryEvents(deletedEvents);
          setError("");
        } else {
          setError(result.message || "Failed to fetch history events");
        }
      } else {
        setError("Failed to fetch history events");
      }
    } catch (error) {
      console.error('Error fetching history events:', error);
      setError("An error occurred while fetching history events");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch event participants
  const fetchEventParticipants = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setParticipants(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (activeTab === "management") {
        fetchEvents();
      } else if (activeTab === "history") {
        fetchHistoryEvents();
      }
    }
  }, [isAuthenticated, user, activeTab]);

  // Handle form submission for create/edit
  const handleSubmit = async () => {
    if (!formData.nama_event || !formData.tanggal_pelaksanaan || !formData.tanggal_awal || !formData.tanggal_akhir) {
      showAlert("warning", "Validation Error", "Please fill in all required fields");
      return;
    }

    // Validate dates
    const startDate = new Date(formData.tanggal_awal);
    const endDate = new Date(formData.tanggal_akhir);
    const eventDate = new Date(formData.tanggal_pelaksanaan);

    if (startDate > endDate) {
      showAlert("warning", "Date Error", "Start date cannot be after end date");
      return;
    }

    if (eventDate < startDate || eventDate > endDate) {
      showAlert("warning", "Date Error", "Event date must be between start and end date");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedEvent) {
        // Update existing event
        const url = `/api/events/${selectedEvent.id}`;
        const submitData = {
          ...formData,
          gambar: uploadedImage
        };

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });

        const result = await response.json();

        if (result.success) {
          showAlert("success", "Event Updated", "Event has been updated successfully");
          fetchEvents();
          resetForm();
          onEditClose();
        } else {
          showAlert("danger", "Error", result.message || "Failed to update event");
        }
      } else {
        // Create new event
        const submitData = {
          ...formData,
          gambar: null // Initially null, will be updated after image upload
        };

        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });

        const result = await response.json();

        if (result.success) {
          const newEventId = result.data.id;
          
          // If there's an uploaded image, upload it to the proper path
          if (uploadedImage && uploadedImage.startsWith('blob:')) {
            try {
              // Get the file from the blob URL
              const response = await fetch(uploadedImage);
              const blob = await response.blob();
              
              // Determine file extension from blob type
              let extension = 'jpg'; // default
              const mimeType = blob.type;
              if (mimeType === 'image/png') extension = 'png';
              else if (mimeType === 'image/webp') extension = 'webp';
              else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = 'jpg';
              
              const file = new File([blob], `event-${newEventId}.${extension}`, { type: mimeType });
              
              // Upload to proper path structure
              const formData = new FormData();
              formData.append('file', file);
              formData.append('eventId', newEventId.toString());

              const uploadResponse = await fetch('/api/events/upload-image', {
                method: 'POST',
                credentials: 'include',
                body: formData
              });

              const uploadResult = await uploadResponse.json();

              if (uploadResult.success) {
                // Update the event with the proper image path
                const updateResponse = await fetch(`/api/events/${newEventId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    ...submitData,
                    gambar: uploadResult.data.filePath
                  })
                });

                if (!updateResponse.ok) {
                  console.warn('Failed to update event with image path');
                }
              } else {
                console.warn('Failed to upload image:', uploadResult.message);
              }
            } catch (imageError) {
              console.warn('Error handling image upload:', imageError);
            }
          }

          showAlert("success", "Event Created", "Event has been created successfully");
          fetchEvents();
          resetForm();
          onCreateClose();
        } else {
          showAlert("danger", "Error", result.message || "Failed to create event");
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showAlert("danger", "Error", "An error occurred while saving event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle restore event
  const handleRestoreEvent = async (event: Event) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/restore`, {
        method: 'PUT',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Event Restored", "Event has been restored successfully");
        if (activeTab === "history") {
          fetchHistoryEvents();
        }
        fetchEvents(); // Refresh management tab as well
      } else {
        showAlert("danger", "Restore Failed", result.message || "Failed to restore event");
      }
    } catch (error) {
      console.error('Error restoring event:', error);
      showAlert("danger", "Restore Error", "An error occurred while restoring event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete event
  const handleDelete = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Event Deleted", "Event has been deleted successfully");
        fetchEvents();
        onDeleteClose();
        setSelectedEvent(null);
      } else {
        showAlert("danger", "Delete Failed", result.message || "Failed to delete event");
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showAlert("danger", "Delete Error", "An error occurred while deleting event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle participant status change
  const handleParticipantStatusChange = async (participantId: number, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/participants/${participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: newStatus === 'rejected' ? rejectionReason : null
        })
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Status Updated", `Participant ${newStatus} successfully`);
        fetchEventParticipants(selectedEvent.id);
        fetchEvents(); // Refresh to update participant count
      } else {
        showAlert("danger", "Update Failed", result.message || "Failed to update participant status");
      }
    } catch (error) {
      console.error('Error updating participant status:', error);
      showAlert("danger", "Update Error", "An error occurred while updating participant status");
    }
  };

  // Handle rejection with reason
  const handleRejectWithReason = () => {
    if (!selectedParticipantForReject) return;

    const finalReason = rejectionReason === "lainnya" ? customRejectionReason : 
                       rejectionReasons.find(r => r.key === rejectionReason)?.label || rejectionReason;

    handleParticipantStatusChange(selectedParticipantForReject.id, 'rejected', finalReason);
    
    // Reset modal state
    setSelectedParticipantForReject(null);
    setRejectionReason("");
    setCustomRejectionReason("");
    onRejectClose();
  };

  // Open rejection modal
  const openRejectModal = (participant: EventParticipant) => {
    setSelectedParticipantForReject(participant);
    setRejectionReason("");
    setCustomRejectionReason("");
    onRejectOpen();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_event: "",
      tanggal_pelaksanaan: "",
      tanggal_awal: "",
      tanggal_akhir: "",
      deskripsi: "",
      syarat_dan_ketentuan: "",
      max_participant: 50,
      biaya: 0,
      participant_type: "individual",
      status: "open",
    });
    setSelectedEvent(null);
    setUploadedImage(null);
    setImageUploadKey(prev => prev + 1); // Force re-render when resetting
  };

  // Handle edit
  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      nama_event: event.nama_event,
      tanggal_pelaksanaan: event.tanggal_pelaksanaan,
      tanggal_awal: event.tanggal_awal,
      tanggal_akhir: event.tanggal_akhir,
      deskripsi: event.deskripsi,
      syarat_dan_ketentuan: event.syarat_dan_ketentuan,
      max_participant: event.max_participant,
      biaya: event.biaya,
      participant_type: event.participant_type,
      status: event.status,
    });
    setUploadedImage(event.gambar);
    setImageUploadKey(prev => prev + 1); // Force re-render when editing
    onEditOpen();
  };

  // Handle view
  const handleView = (event: Event) => {
    setSelectedEvent(event);
    onViewOpen();
  };

  // Handle participants view
  const handleViewParticipants = (event: Event) => {
    setSelectedEvent(event);
    fetchEventParticipants(event.id);
    onParticipantsOpen();
  };

  // Handle bracket view
  const handleViewBracket = (event: Event) => {
    router.push(`/moderator/events/${event.id}/bracket`);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (event: Event) => {
    setSelectedEvent(event);
    onDeleteOpen();
  };

  // Handle start event (workaround: use 'closed' status for ongoing events)
  const handleStartEvent = async (event: Event) => {
    try {
      // For now, we'll use 'closed' status to represent ongoing events
      // until database constraint is fixed
      const response = await fetch(`/api/events/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'ongoing' // Try 'ongoing' first
        }),
      });

      if (!response.ok) {
        // If 'ongoing' fails due to constraint, try 'closed' as workaround
        const fallbackResponse = await fetch(`/api/events/${event.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'closed'
          }),
        });

        if (fallbackResponse.ok) {
          await fetchEvents();
          showAlert('warning', 'Event Dimulai!', 'Event berhasil dimulai (menggunakan status sementara)');
          return;
        } else {
          showAlert('danger', 'Gagal!', 'Gagal memulai event');
          return;
        }
      }

      const result = await response.json();
      if (result.success) {
        await fetchEvents();
        showAlert('success', 'Berhasil!', 'Event berhasil dimulai');
      } else {
        showAlert('danger', 'Gagal!', result.message || 'Gagal memulai event');
      }
    } catch (error) {
      console.error('Error starting event:', error);
      showAlert('danger', 'Error!', 'Terjadi kesalahan saat memulai event');
    }
  };

  // Handle complete event
  const handleCompleteEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'completed'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchEvents(); // Refresh events list
          showAlert('success', 'Berhasil!', 'Event berhasil diselesaikan');
        } else {
          showAlert('danger', 'Gagal!', result.message || 'Gagal menyelesaikan event');
        }
      } else {
        showAlert('danger', 'Gagal!', 'Gagal menyelesaikan event');
      }
    } catch (error) {
      console.error('Error completing event:', error);
      showAlert('danger', 'Error!', 'Terjadi kesalahan saat menyelesaikan event');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="warning" title="Access Denied">
          Please login to access events management.
        </Alert>
      </div>
    );
  }

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Access Denied">
          You don't have permission to access events management.
        </Alert>
      </div>
    );
  }

  return (
    <ModeratorLayout
      title="Events Management"
      description="Manage events and competitions"
    >
      <section>

      {/* Alert */}
      {alertVisible && alertConfig && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert
            color={alertConfig.color}
            title={alertConfig.title}
            description={alertConfig.description}
            isVisible={alertVisible}
            variant="faded"
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        {activeTab === "management" && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
          >
            Create Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary"
          }}
        >
          <Tab
            key="management"
            title={
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                <span>Management</span>
                <Chip size="sm" variant="flat" color="primary">
                  {events.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="history"
            title={
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <span>History Event</span>
                <Chip size="sm" variant="flat" color="danger">
                  {historyEvents.length}
                </Chip>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Error Message */}
      {error && (
        <Alert color="danger" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {/* Management Tab Content */}
      {activeTab === "management" && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner size="lg" color="primary" />
              <span className="ml-3 text-gray-400">Loading events...</span>
            </div>
          ) : (
            <>
              {/* Mobile Card View - Hidden on desktop */}
              <div className="lg:hidden space-y-4">
                {events.length === 0 ? (
                  <Card className="bg-[#111020] border-2 border-[#FFD700]">
                    <CardBody className="text-center py-8">
                      <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No events found</p>
                      <p className="text-gray-500 text-sm">Create your first event to get started</p>
                    </CardBody>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card key={event.id} className="bg-[#111020] border-2 border-[#FFD700]/50 hover:border-[#FFD700] transition-colors">
                      <CardBody className="p-4">
                        <div className="space-y-4">
                          {/* Header with Image and Status */}
                          <div className="flex gap-3">
                            {event.gambar && (
                              <div className="w-20 h-11 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                <Image
                                  src={getEventImageUrlWithCache(event.gambar) || '/placeholder-event.jpg'}
                                  alt={event.nama_event}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#FFD700] text-lg mb-1 truncate">
                                {event.nama_event}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Chip
                                  color={statusColorMap[event.status]}
                                  size="sm"
                                  variant="flat"
                                >
                                  {event.status.toUpperCase()}
                                </Chip>
                                <Badge color="primary" variant="flat" className="text-xs">
                                  {event.participant_type}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-400">Date:</span>
                              <p className="text-gray-300 font-medium">
                                {new Date(event.tanggal_pelaksanaan).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Cost:</span>
                              <p className="text-[#FFD700] font-medium">
                                {formatCurrency(event.biaya)}
                              </p>
                            </div>
                          </div>

                          {/* Participants Info */}
                          <div className="bg-[#1a1a2e] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-sm">Participants:</span>
                              <div className="flex items-center gap-2">
                                <UsersIcon className="w-4 h-4 text-[#FFD700]" />
                                <Badge color="primary" variant="flat">
                                  {event.anggota_participant}/{event.max_participant}
                                </Badge>
                              </div>
                            </div>
                            {event.pending_participants_count && event.pending_participants_count > 0 && (
                              <Badge color="warning" variant="flat" size="sm">
                                +{event.pending_participants_count} pending
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#FFD700]/20">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<EyeIcon className="w-4 h-4" />}
                              onPress={() => handleView(event)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              startContent={<UsersIcon className="w-4 h-4" />}
                              onPress={() => handleViewParticipants(event)}
                            >
                              Participants
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              startContent={<TrophyIcon className="w-4 h-4" />}
                              onPress={() => handleViewBracket(event)}
                            >
                              Bracket
                            </Button>
                            
                            {/* Start/Complete Event Buttons */}
                            {event.status === 'closed' && (
                              <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                startContent={<PlayIcon className="w-4 h-4" />}
                                onPress={() => handleStartEvent(event)}
                              >
                                Start
                              </Button>
                            )}
                            {event.status === 'ongoing' && (
                              <Button
                                size="sm"
                                color="secondary"
                                variant="flat"
                                startContent={<CheckIcon className="w-4 h-4" />}
                                onPress={() => handleCompleteEvent(event)}
                              >
                                Complete
                              </Button>
                            )}

                            {/* Edit and Delete */}
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              startContent={<PencilIcon className="w-4 h-4" />}
                              onPress={() => handleEdit(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDeleteConfirm(event)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Events Table - Hidden on mobile */}
              <div className="hidden lg:block">
              <Card className="bg-[#111020] border-2 border-[#FFD700]">
            <CardBody className="p-0">
              <Table
                aria-label="Events table"
                classNames={{
                  wrapper: "bg-transparent",
                  th: "bg-[#1a1a2e] text-[#FFD700] border-b border-[#FFD700]/20",
                  td: "border-b border-[#FFD700]/10 text-gray-300",
                  tr: "hover:bg-[#1a1a2e]/50",
                }}
              >
                <TableHeader>
                  <TableColumn>EVENT NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>PARTICIPANTS</TableColumn>
                  <TableColumn>COST</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent={
                  <div className="text-center py-8">
                    <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No events found</p>
                    <p className="text-gray-500 text-sm">Create your first event to get started</p>
                  </div>
                }>
                  {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.gambar && (
                        <div className="w-20 h-11 rounded-lg overflow-hidden bg-gray-800">
                          <Image
                            src={getEventImageUrlWithCache(event.gambar) || '/placeholder-event.jpg'}
                            alt={event.nama_event}
                            width={80}
                            height={44}
                            className="w-full h-full object-cover"
                            style={{ aspectRatio: '16/9' }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{event.nama_event}</p>
                        <p className="text-sm text-gray-400">
                          Registration: {formatDate(event.tanggal_awal)} - {formatDate(event.tanggal_akhir)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={event.participant_type === 'team' ? "secondary" : "primary"}
                      size="sm"
                      variant="flat"
                    >
                      {event.participant_type.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#FFD700]" />
                      <span>{formatDate(event.tanggal_pelaksanaan)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-[#FFD700]" />
                      <Badge color="primary" variant="flat">
                        {event.anggota_participant}/{event.max_participant}
                      </Badge>
                      {event.pending_participants_count && event.pending_participants_count > 0 && (
                        <Badge color="warning" variant="flat" size="sm">
                          +{event.pending_participants_count} pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-[#FFD700]" />
                      <span>{formatCurrency(event.biaya)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={statusColorMap[event.status]}
                      size="sm"
                      variant="flat"
                    >
                      {event.status.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleView(event)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewParticipants(event)}
                      >
                        <UsersIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="warning"
                        onPress={() => handleViewBracket(event)}
                        className="text-[#FFD700] hover:text-[#FFE55C]"
                      >
                        <TrophyIcon className="w-4 h-4" />
                      </Button>
                      
                      {/* Start/Stop Event Buttons */}
                      {event.status === 'closed' && (
                        <Button
                          isIconOnly
                          size="sm"
                          color="success"
                          variant="flat"
                          onPress={() => handleStartEvent(event)}
                          title="Start Event"
                        >
                          <PlayIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {event.status === 'ongoing' && (
                        <Button
                          isIconOnly
                          size="sm"
                          color="secondary"
                          variant="flat"
                          onPress={() => handleCompleteEvent(event)}
                          title="Complete Event"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEdit(event)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteConfirm(event)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      </div>
            </>
          )}
        </>
      )}

      {/* History Tab Content */}
      {activeTab === "history" && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spinner size="lg" color="primary" />
              <span className="ml-3 text-gray-400">Loading history...</span>
            </div>
          ) : (
            <>
              {/* History Events Table */}
              <Card className="bg-[#111020] border-2 border-[#FFD700]">
            <CardBody className="p-0">
              <Table
                aria-label="History events table"
                classNames={{
                  wrapper: "bg-transparent",
                  th: "bg-[#1a1a2e] text-[#FFD700] border-b border-[#FFD700]/20",
                  td: "border-b border-[#FFD700]/10 text-gray-300",
                  tr: "hover:bg-[#1a1a2e]/50",
                }}
              >
                <TableHeader>
                  <TableColumn>EVENT NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>PARTICIPANTS</TableColumn>
                  <TableColumn>COST</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>DELETED AT</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent={
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No deleted events found</p>
                    <p className="text-gray-500 text-sm">Events that have been deleted will appear here</p>
                  </div>
                }>
                  {historyEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.gambar && (
                            <div className="w-20 h-11 rounded-lg overflow-hidden bg-gray-800 opacity-60">
                              <Image
                                src={getEventImageUrlWithCache(event.gambar) || '/placeholder-event.jpg'}
                                alt={event.nama_event}
                                width={80}
                                height={44}
                                className="w-full h-full object-cover grayscale"
                                style={{ aspectRatio: '16/9' }}
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-400 line-through">{event.nama_event}</p>
                            <p className="text-sm text-gray-500">
                              Registration: {formatDate(event.tanggal_awal)} - {formatDate(event.tanggal_akhir)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color="default"
                          size="sm"
                          variant="flat"
                        >
                          {event.participant_type}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-400">
                            {formatDate(event.tanggal_pelaksanaan)}
                          </p>
                          <p className="text-xs text-gray-500">Event Date</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-400">
                            {event.anggota_participant || 0} / {event.max_participant}
                          </p>
                          <p className="text-xs text-gray-500">participants</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-400">
                          {event.biaya > 0 ? `Rp ${event.biaya.toLocaleString()}` : 'Free'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color="danger"
                          size="sm"
                          variant="flat"
                        >
                          Deleted
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-400">
                            {formatDate(event.updated_at)}
                          </p>
                          <p className="text-xs text-gray-500">Deleted Date</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<CheckIcon className="w-4 h-4" />}
                            onPress={() => handleRestoreEvent(event)}
                            isLoading={isSubmitting}
                          >
                            Restore
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
            </>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          if (isCreateOpen) onCreateClose();
          if (isEditOpen) onEditClose();
          resetForm();
        }}
        size="4xl"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-[#FFD700]",
          header: "border-b border-[#FFD700]/20",
          footer: "border-t border-[#FFD700]/20",
        }}
      >
        <ModalContent
          className="max-h-[80vh] overflow-y-auto">
          <ModalHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">
              {selectedEvent ? "Edit Event" : "Create New Event"}
            </h3>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Event Name"
                placeholder="Enter event name"
                value={formData.nama_event}
                onValueChange={(value) => setFormData(prev => ({ ...prev, nama_event: value }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                isRequired
              />
              <Select
                label="Participant Type"
                selectedKeys={[formData.participant_type]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData(prev => ({ ...prev, participant_type: selectedKey as any }));
                }}
                variant="bordered"
                classNames={{ value: "text-white" }}
              >
                {participantTypeOptions.map((type) => (
                  <SelectItem key={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Event Image</label>
              <EventImageUpload
                key={imageUploadKey}
                value={uploadedImage}
                onChange={(value) => {
                  setUploadedImage(value);
                  setImageUploadKey(prev => prev + 1); // Force re-render when image changes
                }}
                eventId={selectedEvent?.id}
                disabled={isUploading || isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Registration Start Date"
                type="date"
                value={formData.tanggal_awal}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tanggal_awal: value }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                isRequired
              />
              <Input
                label="Registration End Date"
                type="date"
                value={formData.tanggal_akhir}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tanggal_akhir: value }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                isRequired
              />
              <Input
                label="Event Date"
                type="date"
                value={formData.tanggal_pelaksanaan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tanggal_pelaksanaan: value }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Max Participants"
                type="number"
                value={formData.max_participant.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, max_participant: parseInt(value) || 0 }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                min="1"
              />
              <Input
                label="Registration Fee (IDR)"
                type="number"
                value={formData.biaya.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, biaya: parseFloat(value) || 0 }))}
                variant="bordered"
                classNames={{ input: "text-white" }}
                min="0"
                step="1000"
              />
              {selectedEvent && (
                <Select
                  label="Status"
                  selectedKeys={[formData.status]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFormData(prev => ({ ...prev, status: selectedKey as any }));
                  }}
                  variant="bordered"
                  classNames={{ value: "text-white" }}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.key}>
                      {status.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <Textarea
              label="Description"
              placeholder="Enter event description"
              value={formData.deskripsi}
              onValueChange={(value) => setFormData(prev => ({ ...prev, deskripsi: value }))}
              variant="bordered"
              classNames={{ input: "text-white" }}
              minRows={3}
            />

            <Textarea
              label="Terms and Conditions"
              placeholder="Enter terms and conditions"
              value={formData.syarat_dan_ketentuan}
              onValueChange={(value) => setFormData(prev => ({ ...prev, syarat_dan_ketentuan: value }))}
              variant="bordered"
              classNames={{ input: "text-white" }}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                if (isCreateOpen) onCreateClose();
                if (isEditOpen) onEditClose();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {selectedEvent ? "Update Event" : "Create Event"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Participants Management Modal */}
      <Modal
        isOpen={isParticipantsOpen}
        onClose={onParticipantsClose}
        size="5xl"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-[#FFD700]",
          header: "border-b border-[#FFD700]/20",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">
              Participants Management - {selectedEvent?.nama_event}
            </h3>
          </ModalHeader>
          <ModalBody className="max-h-[600px] overflow-auto">
            <Table
              aria-label="Participants table"
              classNames={{
                wrapper: "bg-transparent",
                th: "bg-[#1a1a2e] text-[#FFD700] border-b border-[#FFD700]/20",
                td: "border-b border-[#FFD700]/10 text-gray-300",
                tr: "hover:bg-[#1a1a2e]/50",
              }}
            >
              <TableHeader>
                <TableColumn>PARTICIPANT</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>TEAM INFO</TableColumn>
                <TableColumn>NOTE</TableColumn>
                <TableColumn>REGISTRATION</TableColumn>
                <TableColumn>PAYMENT PROOF</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No participants found">
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">
                          {participant.participant_type === 'team' 
                            ? participant.teams?.nama_team 
                            : participant.users.nama_lengkap}
                        </p>
                        <p className="text-sm text-gray-400">
                          {participant.participant_type === 'team' 
                            ? `Leader: ${participant.users.nama_lengkap}` 
                            : participant.users.nim}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={participant.participant_type === 'team' ? "secondary" : "primary"}
                        size="sm"
                        variant="flat"
                      >
                        {participant.participant_type.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {participant.participant_type === 'team' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#FFD700]">
                            {participant.team_member_count || 0}
                          </div>
                          <div className="text-xs text-gray-400">
                            Anggota
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Individual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.catatan ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-300 truncate" title={participant.catatan}>
                            {participant.catatan}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No note</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(participant.tanggal_daftar)}</span>
                    </TableCell>
                    <TableCell>
                      {participant.bukti_pembayaran ? (
                        <Image
                          src={getPaymentProofUrl(participant.bukti_pembayaran) || '/placeholder-image.jpg'}
                          alt="Payment proof"
                          width={50}
                          height={50}
                          className="rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(getPaymentProofUrl(participant.bukti_pembayaran)!, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400">No proof</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Chip
                          color={participantStatusColorMap[participant.status]}
                          size="sm"
                          variant="flat"
                        >
                          {participant.status.toUpperCase()}
                        </Chip>
                        {participant.rejection_reason && (
                          <div className="flex items-center gap-1">
                            <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                              Re-registration
                            </div>
                          </div>
                        )}
                        {participant.rejection_reason && (
                          <div className="text-xs text-red-400 max-w-xs truncate" title={`Previous rejection: ${participant.rejection_reason}`}>
                            Previous: {participant.rejection_reason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => handleParticipantStatusChange(participant.id, 'approved')}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => openRejectModal(participant)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                          {participant.rejection_reason && (
                            <div className="text-xs text-orange-500 ml-2">
                              Re-registration
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onParticipantsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="4xl"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-[#FFD700]",
          header: "border-b border-[#FFD700]/20",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">Event Details</h3>
          </ModalHeader>
          <ModalBody className="space-y-6">
            {selectedEvent && (
              <>
                {selectedEvent.gambar && (
                  <div className="w-full rounded-lg overflow-hidden bg-gray-800" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={getEventImageUrlWithCache(selectedEvent.gambar) || '/placeholder-event.jpg'}
                      alt={selectedEvent.nama_event}
                      className="w-full h-full object-cover"
                      width={640}
                      height={360}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Event Name</p>
                      <p className="text-white font-medium">{selectedEvent.nama_event}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Participant Type</p>
                      <Chip color={selectedEvent.participant_type === 'team' ? "secondary" : "primary"} size="sm" variant="flat">
                        {selectedEvent.participant_type.toUpperCase()}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Event Date</p>
                      <p className="text-white">{formatDate(selectedEvent.tanggal_pelaksanaan)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Registration Period</p>
                      <p className="text-white">{formatDate(selectedEvent.tanggal_awal)} - {formatDate(selectedEvent.tanggal_akhir)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <Chip color={statusColorMap[selectedEvent.status]} size="sm" variant="flat">
                        {selectedEvent.status.toUpperCase()}
                      </Chip>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Participants</p>
                      <p className="text-white">{selectedEvent.anggota_participant}/{selectedEvent.max_participant}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Registration Fee</p>
                      <p className="text-white">{formatCurrency(selectedEvent.biaya)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{formatDate(selectedEvent.created_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedEvent.deskripsi && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white whitespace-pre-wrap">{selectedEvent.deskripsi}</p>
                  </div>
                )}

                {selectedEvent.syarat_dan_ketentuan && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Terms and Conditions</p>
                    <p className="text-white whitespace-pre-wrap">{selectedEvent.syarat_dan_ketentuan}</p>
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <div className="flex gap-2">
              {/* Close Registration Button - only show if event is open and event date has passed */}
              {selectedEvent?.status === 'open' && new Date() >= new Date(selectedEvent.tanggal_pelaksanaan) && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<XMarkIcon className="w-4 h-4" />}
                  onPress={async () => {
                    try {
                      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'closed' })
                      });

                      if (response.ok) {
                        await fetchEvents();
                        showAlert('success', 'Berhasil!', 'Pendaftaran telah ditutup');
                        onViewClose();
                      } else {
                        showAlert('danger', 'Gagal!', 'Gagal menutup pendaftaran');
                      }
                    } catch (error) {
                      console.error('Error closing registration:', error);
                      showAlert('danger', 'Error!', 'Terjadi kesalahan');
                    }
                  }}
                >
                  Tutup Pendaftaran
                </Button>
              )}
              
              {/* Start Event Button - only show if event is closed */}
              {selectedEvent?.status === 'closed' && (
                <Button
                  color="success"
                  variant="flat"
                  startContent={<PlayIcon className="w-4 h-4" />}
                  onPress={() => {
                    handleStartEvent(selectedEvent);
                    onViewClose();
                  }}
                >
                  Mulai Event
                </Button>
              )}
              
              {/* Complete Event Button - only show if event is ongoing */}
              {selectedEvent?.status === 'ongoing' && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<CheckIcon className="w-4 h-4" />}
                  onPress={() => {
                    handleCompleteEvent(selectedEvent);
                    onViewClose();
                  }}
                >
                  Akhiri Event
                </Button>
              )}
            </div>
            
            <Button color="default" variant="light" onPress={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={onRejectClose}
        size="md"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-red-500",
          header: "border-b border-red-500/20",
          footer: "border-t border-red-500/20",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-red-500">Reject Participant</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-white mb-4">
              Reject participant "{selectedParticipantForReject?.participant_type === 'team' 
                ? selectedParticipantForReject?.teams?.nama_team
                : selectedParticipantForReject?.users.nama_lengkap}"?
            </p>
            
            <Select
              label="Alasan Penolakan"
              placeholder="Pilih alasan penolakan"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              classNames={{
                label: "text-gray-300",
                trigger: "bg-slate-800 border-slate-600 data-[hover=true]:border-[#FFD700]/50",
                value: "text-white",
              }}
            >
              {rejectionReasons.map((reason) => (
                <SelectItem key={reason.key}>
                  {reason.label}
                </SelectItem>
              ))}
            </Select>
            
            {rejectionReason === "lainnya" && (
              <Textarea
                label="Alasan Khusus"
                placeholder="Masukkan alasan penolakan..."
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                minRows={3}
                classNames={{
                  label: "text-gray-300",
                  input: "bg-slate-800 border-slate-600 text-white",
                  inputWrapper: "bg-slate-800 border-slate-600 data-[hover=true]:border-[#FFD700]/50",
                }}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onRejectClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleRejectWithReason}
              isDisabled={!rejectionReason || (rejectionReason === "lainnya" && !customRejectionReason.trim())}
            >
              Reject Participant
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        size="md"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-red-500",
          header: "border-b border-red-500/20",
          footer: "border-t border-red-500/20",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-red-500">Confirm Delete</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-white">
              Are you sure you want to delete the event "{selectedEvent?.nama_event}"? 
              This action cannot be undone and will also delete all participant data.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isSubmitting}
            >
              Delete Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </section>
    </ModeratorLayout>
  );
}

