"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Event {
  id: number;
  nama_event: string;
  gambar: string | null;
  tanggal_pelaksanaan: string;
  tanggal_awal: string;
  tanggal_akhir: string;
  tanggal_mulai_daftar?: string;
  tanggal_selesai_daftar?: string;
  deskripsi: string;
  syarat_dan_ketentuan: string;
  anggota_participant: number;
  max_participant: number;
  biaya: number;
  participant_type: 'individual' | 'team';
  status: 'open' | 'closed' | 'cancelled' | 'completed' | 'deleted';
  created_at: string;
  current_participants_count?: number;
  pending_participants_count?: number;
}

interface MyEventParticipant {
  id: number;
  event_id: number;
  team_id: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  bukti_pembayaran: string | null;
  catatan: string | null;
  rejection_reason?: string | null;
  tanggal_daftar: string;
  tanggal_approve: string | null;
  events: Event;
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

export default function UserEventsPage() {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<MyEventParticipant[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("available");

  // Modal states
  const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  
  // Form states
  const [buktiPembayaran, setBuktiPembayaran] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Fetch available events
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filter only open events and exclude cancelled events (treated as deleted)
          const openEvents = result.data.filter((event: Event) => 
            event.status === 'open'
          );
          setEvents(openEvents);
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
    }
  };

  // Fetch user's teams
  const fetchUserTeams = async () => {
    try {
      const response = await fetch('/api/user/teams', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserTeams(result.data);
        }
      } else {
        console.error('❌ Error response from /api/user/teams:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('💥 Error fetching user teams:', error);
    }
  };

  // Fetch user's events
  const fetchMyEvents = async () => {
    try {
      const response = await fetch('/api/user/events', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMyEvents(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      Promise.all([fetchEvents(), fetchMyEvents(), fetchUserTeams()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isAuthenticated, user]);

  // Handle join event
  const handleJoinEvent = async () => {
    if (!selectedEvent) return;

    // Validate required fields
    if (selectedEvent.biaya > 0 && !buktiPembayaran) {
      showAlert("warning", "Payment Proof Required", "Please upload payment proof for this event");
      return;
    }

    // For team events, validate team selection
    if (selectedEvent.participant_type === 'team' && !selectedTeamId) {
      showAlert("warning", "Team Selection Required", "Please select a team for this team event");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestBody: any = {
        bukti_pembayaran: buktiPembayaran,
        catatan: catatan,
        participant_type: selectedEvent.participant_type
      };

      // Add team_id for team events
      if (selectedEvent.participant_type === 'team' && selectedTeamId) {
        requestBody.team_id = selectedTeamId;
      }

      const response = await fetch(`/api/events/${selectedEvent.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Registration Successful", result.message);
        fetchEvents();
        fetchMyEvents();
        onJoinClose();
        resetJoinForm();
      } else {
        showAlert("danger", "Registration Failed", result.message || "Failed to register for event");
      }
    } catch (error) {
      console.error('Error joining event:', error);
      showAlert("danger", "Registration Error", "An error occurred while registering for event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert("warning", "Invalid File Type", "Only image files are allowed (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showAlert("warning", "File Too Large", "File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', file);

      const response = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setBuktiPembayaran(result.data.filePath);
        setSelectedFile(file);
        showAlert("success", "Upload Successful", "Payment proof uploaded successfully");
      } else {
        showAlert("danger", "Upload Failed", result.message || "Failed to upload payment proof");
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showAlert("danger", "Upload Error", "An error occurred while uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Reset join form
  const resetJoinForm = () => {
    setBuktiPembayaran("");
    setCatatan("");
    setSelectedEvent(null);
    setSelectedTeamId(null);
    setSelectedFile(null);
  };

  // Handle join button click
  const handleJoinClick = (event: Event) => {
    setSelectedEvent(event);
    onJoinOpen();
  };

  // Handle image preview
  const handleImagePreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    onImageOpen();
  };

  // Format event image path
  const formatEventImagePath = (eventId: number, imagePath: string | null) => {
    if (!imagePath) return null;
    
    // If already a relative path starting with /src/, use as is
    if (imagePath.startsWith('/src/')) {
      return imagePath;
    }
    
    // If it's a localhost URL, extract filename and construct proper path
    if (imagePath.includes('localhost') || imagePath.startsWith('http')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        // Extract file extension
        const extension = filename.split('.').pop();
        return `/src/events/event-${eventId}/event-${eventId}.${extension}`;
      }
    }
    
    // If it's just a filename, construct proper path
    if (!imagePath.includes('/')) {
      const extension = imagePath.split('.').pop();
      return `/src/events/event-${eventId}/event-${eventId}.${extension}`;
    }
    
    // Return as is if none of above conditions match
    return imagePath;
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

  // Check if user can join team event (only team leaders can register)
  const canJoinTeamEvent = (event: Event) => {
    
    if (event.participant_type !== 'team') {
      return true;
    }
    
    if (userTeams.length === 0) {
      return false;
    }

    // Check if user's team is already registered for this event
    const isTeamAlreadyRegistered = isTeamRegistered(event.id);
    
    if (isTeamAlreadyRegistered) {
      return false; // Can't join because team is already registered
    }
    
    // For team events, check if user is a team leader (only leaders can register teams)
    const leaderTeams = userTeams.filter(team => {
      return team.is_leader === true;
    });
    return leaderTeams.length > 0;
  };

  // Get teams where user is leader
  const getLeaderTeams = () => {
    return userTeams.filter(team => team.is_leader === true);
  };

  // Check if registration is open
  const isRegistrationOpen = (event: Event) => {
    const now = new Date();
    
    // Simple logic: registration is open until event ends
    const eventEndDate = new Date(event.tanggal_akhir);
    eventEndDate.setHours(23, 59, 59, 999);
    
    const isBeforeEnd = now <= eventEndDate;
    const isStatusOpen = event.status === 'open';
    const hasSpace = event.anggota_participant < event.max_participant;
    
    const finalResult = isBeforeEnd && isStatusOpen && hasSpace;
    
    return finalResult;
  };

  // Check if user already registered (approved only)
  const isUserRegistered = (eventId: number) => {
    return myEvents.some(myEvent => 
      myEvent.event_id === eventId && myEvent.status === 'approved'
    );
  };

  // Check if user's team is already registered for a team event (approved only)
  const isTeamRegistered = (eventId: number) => {
    // Check if any of user's teams are registered for this event with approved status
    return myEvents.some(myEvent => 
      myEvent.event_id === eventId && 
      myEvent.team_id !== null && 
      myEvent.status === 'approved'
    );
  };

  // Check if user has pending registration (including rejected with auto re-registration)
  const hasPendingRegistration = (eventId: number) => {
    return myEvents.some(myEvent => 
      myEvent.event_id === eventId && myEvent.status === 'pending'
    );
  };

  // Get registration status for display
  const getRegistrationStatus = (eventId: number) => {
    const registration = myEvents.find(myEvent => myEvent.event_id === eventId);
    if (!registration) return null;
    
    return {
      status: registration.status,
      rejection_reason: registration.rejection_reason,
      canReRegister: registration.status === 'rejected'
    };
  };

  // Check if user can register for event (considers only approved registrations)
  const canRegisterForEvent = (event: Event) => {
    if (event.participant_type === 'team') {
      // For team events, check if user's team is already registered and approved
      return !isTeamRegistered(event.id);
    } else {
      // For individual events, check if user is already registered and approved
      return !isUserRegistered(event.id);
    }
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
          Please login to access events.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <p className="text-gray-400 mt-2">Join competitions and events</p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert color="danger" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          classNames={{
            tabList: "bg-[#111020] border border-[#FFD700]/20",
            tab: "text-white data-[selected=true]:text-[#FFD700]",
            cursor: "bg-[#FFD700]",
          }}
        >
          <Tab key="available" title="Available Events" />
          <Tab key="my-events" title="My Events" />
        </Tabs>
      </div>

      {/* Available Events Tab */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="bg-[#111020] border-2 border-[#FFD700] hover:border-[#FFE55C] transition-colors"
            >
              <CardBody className="p-6">
                {/* Event Image */}
                {event.gambar && (
                  <div className="w-full rounded-lg overflow-hidden mb-4 bg-gray-800" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={formatEventImagePath(event.id, event.gambar) || event.gambar}
                      alt={event.nama_event}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Event image failed to load:', event.gambar);
                        const img = e.target as HTMLImageElement;
                        // Try original path as fallback
                        if (img.src !== event.gambar && event.gambar) {
                          img.src = event.gambar;
                        } else {
                          img.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}

                {/* Event Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-[#FFD700] mb-2">{event.nama_event}</h2>
                  <div className="flex items-center gap-2">
                    <Chip color={statusColorMap[event.status]} size="sm" variant="flat">
                      {event.status.toUpperCase()}
                    </Chip>
                    <Chip 
                      color={event.participant_type === 'team' ? "secondary" : "primary"} 
                      size="sm" 
                      variant="bordered"
                    >
                      {event.participant_type.toUpperCase()}
                    </Chip>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-gray-300 text-sm">{formatDate(event.tanggal_pelaksanaan)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-gray-300 text-sm">
                      Registration: {formatDate(event.tanggal_awal)} - {formatDate(event.tanggal_akhir)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-[#FFD700]" />
                    <Badge color="primary" variant="flat">
                      {event.anggota_participant}/{event.max_participant}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-gray-300 text-sm">
                      {event.biaya > 0 ? formatCurrency(event.biaya) : "Free"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {event.deskripsi && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{event.deskripsi}</p>
                )}

                {/* Action Button */}
                <div className="space-y-2">
                  
                  {event.participant_type === 'team' ? (
                    // Team event logic
                    canJoinTeamEvent(event) ? (
                      <Button
                        color={isTeamRegistered(event.id) ? "default" : "primary"}
                        variant={isTeamRegistered(event.id) ? "flat" : "solid"}
                        className="w-full"
                        onPress={() => handleJoinClick(event)}
                        isDisabled={!isRegistrationOpen(event) || isTeamRegistered(event.id)}
                      >
                        {isTeamRegistered(event.id) 
                          ? "Team Already Registered" 
                          : !isRegistrationOpen(event) 
                            ? "Registration Closed" 
                            : "Register Team"}
                      </Button>
                    ) : isTeamRegistered(event.id) ? (
                      // Member of team that's already registered
                      <Button
                        color="success"
                        variant="flat"
                        className="w-full"
                        isDisabled
                      >
                        Registered Leader Team
                      </Button>
                    ) : (
                      <div className="text-center">
                        <Button
                          color="warning"
                          variant="flat"
                          className="w-full"
                          isDisabled
                        >
                          Only Team Leaders Can Register
                        </Button>
                        <p className="text-sm text-gray-400 mt-1">
                          Ask your team leader to register this team event
                        </p>
                      </div>
                    )
                  ) : (
                    // Individual event logic
                    (() => {
                      const regStatus = getRegistrationStatus(event.id);
                      const canRegister = canRegisterForEvent(event);
                      const hasPending = hasPendingRegistration(event.id);
                      
                      if (regStatus?.status === 'approved') {
                        return (
                          <Button
                            color="success"
                            variant="flat"
                            className="w-full"
                            isDisabled
                          >
                            Registered
                          </Button>
                        );
                      } else if (hasPending) {
                        return (
                          <Button
                            color="warning"
                            variant="flat"
                            className="w-full"
                            isDisabled
                          >
                            ⏳ Pending Review
                            {regStatus?.rejection_reason && (
                              <div className="text-xs mt-1">
                                Re-review: {regStatus.rejection_reason}
                              </div>
                            )}
                          </Button>
                        );
                      } else if (!isRegistrationOpen(event)) {
                        return (
                          <Button
                            color="default"
                            variant="flat"
                            className="w-full"
                            isDisabled
                          >
                            Registration Closed
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            color="primary"
                            variant="solid"
                            className="w-full"
                            onPress={() => handleJoinClick(event)}
                          >
                            Join Event
                          </Button>
                        );
                      }
                    })()
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* My Events Tab */}
      {activeTab === "my-events" && (
        <Card className="bg-[#111020] border-2 border-[#FFD700]">
          <CardBody className="p-0">
            <Table
              aria-label="My events table"
              classNames={{
                wrapper: "bg-transparent",
                th: "bg-[#1a1a2e] text-[#FFD700] border-b border-[#FFD700]/20",
                td: "border-b border-[#FFD700]/10 text-gray-300",
                tr: "hover:bg-[#1a1a2e]/50",
              }}
            >
              <TableHeader>
                <TableColumn>EVENT</TableColumn>
                <TableColumn>EVENT DATE</TableColumn>
                <TableColumn>REGISTRATION</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>PAYMENT</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No events registered">
                {myEvents.map((myEvent) => (
                  <TableRow key={myEvent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {myEvent.events.gambar && (
                          <img
                            src={formatEventImagePath(myEvent.events.id, myEvent.events.gambar) || myEvent.events.gambar}
                            alt={myEvent.events.nama_event}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                            onError={(e) => {
                              console.error('My event image failed to load:', myEvent.events.gambar);
                              const img = e.target as HTMLImageElement;
                              // Try original path as fallback
                              if (img.src !== myEvent.events.gambar && myEvent.events.gambar) {
                                img.src = myEvent.events.gambar;
                              } else {
                                img.style.display = 'none';
                              }
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-white">{myEvent.events.nama_event}</p>
                          <p className="text-sm text-gray-400">
                            {formatCurrency(myEvent.events.biaya)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{formatDate(myEvent.events.tanggal_pelaksanaan)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(myEvent.tanggal_daftar)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Chip
                          color={participantStatusColorMap[myEvent.status]}
                          size="sm"
                          variant="flat"
                        >
                          {myEvent.status.toUpperCase()}
                        </Chip>
                        {myEvent.rejection_reason && myEvent.status === 'pending' && (
                          <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded max-w-xs">
                            Re-review: {myEvent.rejection_reason}
                          </div>
                        )}
                        {myEvent.rejection_reason && myEvent.status === 'pending' && (
                          <div className="text-xs text-blue-400">
                            Sedang ditinjau ulang
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {myEvent.bukti_pembayaran ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={myEvent.bukti_pembayaran} 
                              alt="Payment proof"
                              className="w-8 h-8 object-cover rounded border border-green-500 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => handleImagePreview(myEvent.bukti_pembayaran!)}
                              onError={(e) => {
                                console.error('Payment proof image failed to load:', myEvent.bukti_pembayaran);
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                // Show fallback chip
                                const parentDiv = img.parentNode as HTMLElement;
                                if (parentDiv && !parentDiv.querySelector('.fallback-chip')) {
                                  const chip = document.createElement('span');
                                  chip.className = 'fallback-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
                                  chip.textContent = 'Submitted';
                                  parentDiv.appendChild(chip);
                                }
                              }}
                            />
                            <Chip color="success" size="sm" variant="flat">
                              Submitted
                            </Chip>
                          </div>
                        ) : myEvent.events.biaya > 0 ? (
                          <Chip color="warning" size="sm" variant="flat">
                            Pending
                          </Chip>
                        ) : (
                          <Chip color="default" size="sm" variant="flat">
                            Free Event
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Join Event Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => {
          onJoinClose();
          resetJoinForm();
        }}
        size="2xl"
        classNames={{
          backdrop: "bg-black/80",
          base: "bg-[#111020] border border-[#FFD700]",
          header: "border-b border-[#FFD700]/20",
          footer: "border-t border-[#FFD700]/20",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">Join Event</h3>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedEvent && (
              <>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-white mb-2">{selectedEvent.nama_event}</h4>
                  <div className="flex items-center justify-center gap-4">
                    <Chip color={selectedEvent.participant_type === 'team' ? "secondary" : "primary"} size="sm" variant="flat">
                      {selectedEvent.participant_type.toUpperCase()} EVENT
                    </Chip>
                    <p className="text-gray-400">
                      Registration Fee: {selectedEvent.biaya > 0 ? formatCurrency(selectedEvent.biaya) : "Free"}
                    </p>
                  </div>
                </div>

                {/* Team Selection for Team Events */}
                {selectedEvent.participant_type === 'team' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Select Team</label>
                    <div className="grid gap-2">
                      {getLeaderTeams().map((team) => (
                        <div 
                          key={team.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTeamId === team.id 
                              ? 'border-[#FFD700] bg-[#FFD700]/10' 
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedTeamId(team.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{team.nama_team}</p>
                              <p className="text-sm text-gray-400">{team.deskripsi}</p>
                            </div>
                            <Badge color="primary" variant="flat">
                              {team.current_members}/{team.max_participants} members
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {getLeaderTeams().length === 0 && (
                      <Alert color="warning" title="No Teams Available">
                        You need to be a team leader to register for team events. Please create a team first.
                      </Alert>
                    )}
                  </div>
                )}

                {selectedEvent.biaya > 0 && (
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
                            <div className="mt-2">
                              <img 
                                src={buktiPembayaran} 
                                alt="Payment proof preview"
                                className="max-w-full max-h-32 object-contain rounded-lg border border-gray-600"
                                onError={(e) => {
                                  console.error('Image failed to load:', buktiPembayaran);
                                  const img = e.target as HTMLImageElement;
                                  // Try reloading without query params
                                  const cleanUrl = buktiPembayaran.split('?')[0];
                                  if (img.src !== cleanUrl) {
                                    img.src = cleanUrl;
                                  } else {
                                    // Show placeholder or error message
                                    img.style.display = 'none';
                                    const parentDiv = img.parentNode as HTMLElement;
                                    if (parentDiv && !parentDiv.querySelector('.image-error')) {
                                      const errorDiv = document.createElement('div');
                                      errorDiv.className = 'image-error text-yellow-400 text-sm p-2 border border-yellow-600 rounded bg-yellow-900/20';
                                      errorDiv.textContent = 'Image preview not available. File uploaded successfully.';
                                      parentDiv.appendChild(errorDiv);
                                    }
                                  }
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', buktiPembayaran);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Upload your payment proof image (Max 5MB, formats: JPEG, PNG, GIF, WebP)
                      </p>
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

                {selectedEvent.syarat_dan_ketentuan && (
                  <div className="bg-[#1a1a2e]/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Terms and Conditions:</p>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {selectedEvent.syarat_dan_ketentuan}
                    </p>
                  </div>
                )}
              </>
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
                  alt="Payment proof full size"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-600"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder-image.jpg'; // fallback image
                  }}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onImageClose}
            >
              Close
            </Button>
            <Button
              color="primary"
              onPress={() => window.open(selectedImageUrl, '_blank')}
            >
              Open in New Tab
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
