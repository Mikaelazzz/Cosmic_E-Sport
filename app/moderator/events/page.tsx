"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import EventImageUpload from "@/components/EventImageUpload";
import {
  Card,
  CardBody,
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
  status: 'open' | 'closed' | 'cancelled' | 'completed';
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
  tanggal_daftar: string;
  tanggal_approve: string | null;
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
  status: 'open' | 'closed' | 'cancelled' | 'completed';
}

const statusColorMap = {
  open: "success",
  closed: "warning", 
  cancelled: "danger",
  completed: "primary",
} as const;

const participantStatusColorMap = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
} as const;

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
  const { user, isAuthenticated, loading } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isParticipantsOpen, onOpen: onParticipantsOpen, onClose: onParticipantsClose } = useDisclosure();
  
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

  const showAlert = (color: "success" | "warning" | "danger", title: string, description: string) => {
    setAlertConfig({ color, title, description });
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 5000);
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvents(result.data);
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
      fetchEvents();
    }
  }, [isAuthenticated, user]);

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
      const url = selectedEvent ? `/api/events/${selectedEvent.id}` : '/api/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        gambar: uploadedImage
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", selectedEvent ? "Event Updated" : "Event Created", 
                 selectedEvent ? "Event has been updated successfully" : "Event has been created successfully");
        
        fetchEvents();
        resetForm();
        if (selectedEvent) {
          onEditClose();
        } else {
          onCreateClose();
        }
      } else {
        showAlert("danger", "Error", result.message || "Failed to save event");
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showAlert("danger", "Error", "An error occurred while saving event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
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
  const handleParticipantStatusChange = async (participantId: number, newStatus: 'approved' | 'rejected', catatan?: string) => {
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
          catatan: catatan || null
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

  // Handle delete confirmation
  const handleDeleteConfirm = (event: Event) => {
    setSelectedEvent(event);
    onDeleteOpen();
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

  if (loading || isLoading) {
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
    <div className="max-w-7xl mx-auto p-6">
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
        <div>
          <h1 className="text-3xl font-bold text-white">Events Management</h1>
          <p className="text-gray-400 mt-2">Manage events and competitions</p>
        </div>
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
      </div>

      {/* Error Message */}
      {error && (
        <Alert color="danger" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {/* Events Table */}
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
            <TableBody emptyContent="No events found">
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.gambar && (
                        <div className="w-20 h-11 rounded-lg overflow-hidden bg-gray-800">
                          <Image
                            src={event.gambar.startsWith('/src/events/') 
                              ? `/api/images/events/${event.gambar.replace('/src/events/', '')}?t=${Date.now()}` 
                              : event.gambar}
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
                  <SelectItem key={type.key} value={type.key}>
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
                    <SelectItem key={status.key} value={status.key}>
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
                            : participant.users.email}
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
                      <span className="text-sm">{formatDate(participant.tanggal_daftar)}</span>
                    </TableCell>
                    <TableCell>
                      {participant.bukti_pembayaran ? (
                        <Image
                          src={participant.bukti_pembayaran}
                          alt="Payment proof"
                          width={50}
                          height={50}
                          className="rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(participant.bukti_pembayaran!, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400">No proof</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={participantStatusColorMap[participant.status]}
                        size="sm"
                        variant="flat"
                      >
                        {participant.status.toUpperCase()}
                      </Chip>
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
                            onPress={() => handleParticipantStatusChange(participant.id, 'rejected')}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
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
                      src={selectedEvent.gambar.startsWith('/src/events/') 
                        ? `/api/images/events/${selectedEvent.gambar.replace('/src/events/', '')}?t=${Date.now()}` 
                        : selectedEvent.gambar}
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
          <ModalFooter>
            <Button color="default" variant="light" onPress={onViewClose}>
              Close
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
    </div>
  );
}
