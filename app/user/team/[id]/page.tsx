"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";
import { Badge } from "@heroui/badge";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getUserAvatarUrl, generateInitials } from "@/lib/avatar";
// Using lucide-react icons instead of heroicons
import { 
  Star as StarIcon, 
  Users as UsersIcon, 
  Clock as ClockIcon,
  Trash2 as TrashIcon,
  Check as CheckIcon,
  X as XMarkIcon,
  ArrowLeft as ArrowLeftIcon,
  UserMinus as UserMinusIcon,
  Crown as CrownIcon,
  Edit as EditIcon
} from "lucide-react";

interface TeamMember {
  id: string;
  nama_lengkap: string;
  email: string;
  nim?: string;
  role?: string;
  role_in_team: 'Leader' | 'Member';
  joined_at: string;
}

interface JoinRequest {
  id: number;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user_info: {
    id: string;
    nama_lengkap: string;
    email: string;
    nim?: string;
    role?: string;
  };
}

interface EventResult {
  id: number;
  team_id: number;
  event_name: string;
  event_date: string;
  result: 'win' | 'lose' | 'draw';
  position?: number;
  total_participants?: number;
  created_at: string;
}

interface EventStats {
  total_events: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
}

interface TeamDetail {
  id: number;
  nama_team: string;
  deskripsi: string;
  requirements?: string;
  max_participants: number;
  current_participants: number;
  win_rate: number;
  status: 'open' | 'closed' | 'full';
  created_by: string;
  created_at: string;
  event_name?: string;
  members: TeamMember[];
  join_requests: JoinRequest[];
  is_member: boolean;
  is_leader: boolean;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Event management states
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [eventStats, setEventStats] = useState<EventStats>({
    total_events: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    win_rate: 0
  });
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [addEventData, setAddEventData] = useState({
    event_name: "",
    event_date: "",
    result: "win" as "win" | "lose" | "draw",
    position: "",
    total_participants: ""
  });
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Edit team states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTeamData, setEditTeamData] = useState({
    nama_team: "",
    deskripsi: "",
    requirements: "",
    max_participants: 10,
    event_name: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    color: "success" as "success" | "warning" | "danger",
    title: "",
    description: ""
  });

  // Function to show alert
  const showAlert = (color: "success" | "warning" | "danger", title: string, description: string) => {
    setAlertConfig({ color, title, description });
    setAlertVisible(true);
    // Auto hide after 5 seconds
    setTimeout(() => setAlertVisible(false), 5000);
  };

  useEffect(() => {
    if (isAuthenticated && user && teamId) {
      fetchTeamDetail();
      fetchEventResults();
    }
  }, [isAuthenticated, user, teamId]);

  const fetchTeamDetail = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeam(result.data);
        } else {
          setError(result.message || "Failed to fetch team details");
        }
      } else {
        setError("Failed to fetch team details");
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      setError("An error occurred while fetching team details");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventResults = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/events`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEventResults(result.data.events || []);
          setEventStats(result.data.statistics || {
            total_events: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            win_rate: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching event results:', error);
    }
  };

  // Function to open edit modal with current team data
  const openEditModal = () => {
    if (team) {
      setEditTeamData({
        nama_team: team.nama_team,
        deskripsi: team.deskripsi,
        requirements: team.requirements || "",
        max_participants: team.max_participants,
        event_name: team.event_name || ""
      });
      setShowEditModal(true);
    }
  };

  // Function to handle team update
  const handleUpdateTeam = async () => {
    if (!editTeamData.nama_team.trim() || !editTeamData.deskripsi.trim()) {
      showAlert("warning", "Validation Error", "Team name and description are required");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editTeamData)
      });

      const result = await response.json();

      if (result.success) {
        setShowEditModal(false);
        fetchTeamDetail(); // Refresh team data
        showAlert("success", "Team Updated", "Team details have been updated successfully.");
      } else {
        showAlert("danger", "Update Failed", result.message || "Failed to update team");
      }
    } catch (error) {
      console.error('Error updating team:', error);
      showAlert("danger", "Update Error", "An error occurred while updating team");
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to handle add event result
  const handleAddEvent = async () => {
    if (!addEventData.event_name.trim()) {
      showAlert("warning", "Validation Error", "Event name is required");
      return;
    }

    setIsAddingEvent(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          event_name: addEventData.event_name,
          event_date: addEventData.event_date || new Date().toISOString().split('T')[0],
          result: addEventData.result,
          position: addEventData.position ? parseInt(addEventData.position) : null,
          total_participants: addEventData.total_participants ? parseInt(addEventData.total_participants) : null
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowAddEventModal(false);
        setAddEventData({
          event_name: "",
          event_date: "",
          result: "win",
          position: "",
          total_participants: ""
        });
        fetchEventResults(); // Refresh event data
        fetchTeamDetail(); // Refresh team data to update win rate
        showAlert("success", "Event Added", "Event result has been added successfully and win rate updated.");
      } else {
        showAlert("danger", "Add Event Failed", result.message || "Failed to add event result");
      }
    } catch (error) {
      console.error('Error adding event:', error);
      showAlert("danger", "Add Event Error", "An error occurred while adding event result");
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleJoinRequest = async (requestId: number, action: 'approve' | 'reject') => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/teams/join-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ requestId, action })
      });

      const result = await response.json();

      if (result.success) {
        fetchTeamDetail(); // Refresh team data
        setError("");
        showAlert("success", `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`, 
          `The join request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      } else {
        showAlert("danger", `${action === 'approve' ? 'Approve' : 'Reject'} Request Failed`, 
          result.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      showAlert("danger", `${action === 'approve' ? 'Approve' : 'Reject'} Request Error`, 
        `An error occurred while ${action}ing request`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setIsActionLoading(true);
    try {
      const response = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          teamId: team?.id, 
          userId: selectedMember.id 
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowRemoveModal(false);
        setSelectedMember(null);
        fetchTeamDetail(); // Refresh team data
        setError("");
        showAlert("success", "Member Removed", `${selectedMember.nama_lengkap} has been removed from the team successfully.`);
      } else {
        showAlert("danger", "Remove Member Failed", result.message || "Failed to remove member");
      }
    } catch (error) {
      console.error('Error removing member:', error);
      showAlert("danger", "Remove Member Error", "An error occurred while removing member");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'leader' | 'member') => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/teams/members/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          teamId: team?.id, 
          userId: memberId, 
          role: newRole 
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchTeamDetail(); // Refresh team data
        setError("");
        const memberName = team?.members.find(m => m.id === memberId)?.nama_lengkap || "Member";
        showAlert("success", "Role Changed", `${memberName}'s role has been changed to ${newRole} successfully.`);
      } else {
        showAlert("danger", "Change Role Failed", result.message || "Failed to change role");
      }
    } catch (error) {
      console.error('Error changing role:', error);
      showAlert("danger", "Change Role Error", "An error occurred while changing role");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Team Deleted", "The team has been deleted successfully.");
        // Delay navigation to show the alert
        setTimeout(() => router.push('/user/team'), 2000);
      } else {
        showAlert("danger", "Delete Team Failed", result.message || "Failed to delete team");
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showAlert("danger", "Delete Team Error", "An error occurred while deleting team");
    } finally {
      setIsActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleLeaveTeam = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ teamId: team?.id })
      });

      const result = await response.json();

      if (result.success) {
        showAlert("success", "Left Team", "You have left the team successfully.");
        // Delay navigation to show the alert
        setTimeout(() => router.push('/user/team'), 2000);
      } else {
        showAlert("danger", "Leave Team Failed", result.message || "Failed to leave team");
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      showAlert("danger", "Leave Team Error", "An error occurred while leaving team");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || loading) {
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
          Please login to access team details.
        </Alert>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Team Not Found">
          The team you're looking for doesn't exist.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="light"
        className="mb-6"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push('/user/team')}
      >
        Back to Teams
      </Button>

      {/* Alert Notification */}
      {alertVisible && (
        <div className="mb-6">
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

      {/* Error Message */}
      {error && (
        <Alert color="danger" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {/* Team Header */}
      <Card className="bg-[#111020] border-2 border-[#FFD700] mb-8">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#FFD700]">{team.nama_team}</h1>
                <Badge 
                  color={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}
                  variant="flat"
                >
                  {team.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-300 mb-4">{team.deskripsi}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-white">{team.current_participants}/{team.max_participants} Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-white">{team.win_rate}% Win Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-white">Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              {team.is_leader && (
                <>
                  <Button
                    color="warning"
                    variant="bordered"
                    size="sm"
                    startContent={<EditIcon className="w-4 h-4" />}
                    onPress={openEditModal}
                  >
                    Edit Team
                  </Button>
                  <Button
                    color="danger"
                    variant="bordered"
                    size="sm"
                    startContent={<TrashIcon className="w-4 h-4" />}
                    onPress={() => setShowDeleteModal(true)}
                  >
                    Delete Team
                  </Button>
                </>
              )}
              {team.is_member && !team.is_leader && (
                <Button
                  color="warning"
                  variant="bordered"
                  size="sm"
                  startContent={<UserMinusIcon className="w-4 h-4" />}
                  onPress={handleLeaveTeam}
                  isLoading={isActionLoading}
                >
                  Leave Team
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
        classNames={{
          tabList: "bg-[#1a1a2e] border border-gray-700",
          tab: "text-white data-[selected=true]:text-[#FFD700]",
          cursor: "bg-[#FFD700]"
        }}
      >
        <Tab key="overview" title="Overview">
          <Card className="bg-[#111020]">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Information */}
                <div>
                  <h3 className="text-xl font-bold text-[#FFD700] mb-4">Team Information</h3>
                  <div className="space-y-3">
                    {team.event_name && (
                      <div>
                        <span className="text-gray-400">Event:</span>
                        <p className="text-white">{team.event_name}</p>
                      </div>
                    )}
                    {team.requirements && (
                      <div>
                        <span className="text-gray-400">Requirements:</span>
                        <p className="text-white">{team.requirements}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Created by:</span>
                        <p className="text-white">
                            {team.members.find(m => m.id === team.created_by)?.nama_lengkap || 
                            team.members.find(m => m.role_in_team === 'Leader')?.nama_lengkap || 
                            'Unknown'}
                        </p>
                    </div>
                  </div>
                </div>

                {/* Team Stats */}
                <div>
                  <h3 className="text-xl font-bold text-[#FFD700] mb-4">Statistics</h3>
                  <div className="space-y-4">
                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="text-2xl font-bold text-[#FFD700]">{team.win_rate}%</span>
                      </div>
                    </div>
                    <div className="bg-[#1a1a2e] p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Members</span>
                        <span className="text-2xl font-bold text-white">{team.current_participants}/{team.max_participants}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="members" title={`Members (${team.members.length})`}>
          <Card className="bg-[#111020]">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.members
                  .slice()
                  .sort((a, b) => {
                    // Debug: log the role values
                    console.log('Member A:', a.nama_lengkap, 'Role:', a.role_in_team);
                    console.log('Member B:', b.nama_lengkap, 'Role:', b.role_in_team);
                    
                    // Sort leaders first - try different variations
                    if (a.role_in_team?.toLowerCase() === 'leader' && b.role_in_team?.toLowerCase() !== 'leader') return -1;
                    if (a.role_in_team?.toLowerCase() !== 'leader' && b.role_in_team?.toLowerCase() === 'leader') return 1;
                    
                    // Alternative check if role_in_team is inconsistent
                    const isALeader = a.role_in_team === 'Leader' || a.role_in_team === 'leader' || a.id === team.created_by;
                    const isBLeader = b.role_in_team === 'Leader' || b.role_in_team === 'leader' || b.id === team.created_by;
                    
                    if (isALeader && !isBLeader) return -1;
                    if (!isALeader && isBLeader) return 1;
                    
                    return 0;
                  })
                  .map((member) => (
                  <Card key={member.id} className="bg-[#1a1a2e] border border-gray-700">
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          src={getUserAvatarUrl(member, 200, true)}
                          name={member.nama_lengkap}
                          size="md"
                          className="border-2 border-[#FFD700]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{member.nama_lengkap}</h4>
                            {(member.role_in_team === 'Leader' || member.role_in_team === 'leader' || member.id === team.created_by) && (
                              <CrownIcon className="w-4 h-4 text-[#FFD700]" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{member.email}</p>
                          <div className="flex items-center gap-1">
                            {(member.role_in_team === 'Leader' || member.role_in_team === 'leader' || member.id === team.created_by) && (
                              <CrownIcon className="w-3 h-3 text-[#FFD700]" />
                            )}
                            <p className={`text-sm font-medium ${
                              (member.role_in_team === 'Leader' || member.role_in_team === 'leader' || member.id === team.created_by) ? 'text-[#FFD700]' : 'text-gray-300'
                            }`}>
                              {(member.role_in_team === 'Leader' || member.role_in_team === 'leader' || member.id === team.created_by) ? 'Leader' : 'Member'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Member Actions (Only for leaders) */}
                      {team.is_leader && member.id !== user?.id && (
                        <div className="flex gap-2">
                          <Select
                            placeholder="Change Role"
                            size="sm"
                            variant="bordered"
                            defaultSelectedKeys={[member.role_in_team]}
                            onSelectionChange={(keys) => {
                              const role = Array.from(keys)[0] as 'Leader' | 'Member';
                              if (role && role !== member.role_in_team) {
                                handleChangeRole(member.id, role.toLowerCase() as 'leader' | 'member');
                              }
                            }}
                          >
                            <SelectItem key="Member">Member</SelectItem>
                            <SelectItem key="Leader">Leader</SelectItem>
                          </Select>
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => {
                              setSelectedMember(member);
                              setShowRemoveModal(true);
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>

        {team.is_leader && (
          <Tab key="requests" title={`Join Requests (${team.join_requests.length})`}>
            <Card className="bg-[#111020]">
              <CardBody className="p-6">
                {team.join_requests.length > 0 ? (
                  <div className="space-y-4">
                    {team.join_requests.map((request) => (
                      <Card key={request.id} className="bg-[#1a1a2e] border border-gray-700">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={getUserAvatarUrl(request.user_info as any, 40, true)}
                                name={request.user_info?.nama_lengkap}
                                size="md"
                              />
                              <div>
                                <h4 className="font-medium text-white">{request.user_info?.nama_lengkap}</h4>
                                <p className="text-sm text-gray-400">{request.user_info?.email}</p>
                                <p className="text-xs text-gray-500">
                                  Requested {new Date(request.requested_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                color="success"
                                size="sm"
                                variant="flat"
                                startContent={<CheckIcon className="w-4 h-4" />}
                                onPress={() => handleJoinRequest(request.id, 'approve')}
                                isLoading={isActionLoading}
                              >
                                Approve
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                variant="flat"
                                startContent={<XMarkIcon className="w-4 h-4" />}
                                onPress={() => handleJoinRequest(request.id, 'reject')}
                                isLoading={isActionLoading}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No pending join requests.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        )}

        <Tab key="events" title={`Events (${eventResults.length})`}>
          <Card className="bg-[#111020]">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#FFD700]">Event History</h3>
                {team.is_leader && (
                  <Button
                    color="warning"
                    variant="solid"
                    className="bg-[#FFD700] text-black"
                    onPress={() => setShowAddEventModal(true)}
                  >
                    Add Event Result
                  </Button>
                )}
              </div>

              {/* Event Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-[#1a1a2e] border border-gray-700">
                  <CardBody className="p-4 text-center">
                    <p className="text-2xl font-bold text-white">{eventStats.total_events}</p>
                    <p className="text-sm text-gray-400">Total Events</p>
                  </CardBody>
                </Card>
                <Card className="bg-[#1a1a2e] border border-green-500">
                  <CardBody className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{eventStats.wins}</p>
                    <p className="text-sm text-gray-400">Wins</p>
                  </CardBody>
                </Card>
                <Card className="bg-[#1a1a2e] border border-red-500">
                  <CardBody className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{eventStats.losses}</p>
                    <p className="text-sm text-gray-400">Losses</p>
                  </CardBody>
                </Card>
                <Card className="bg-[#1a1a2e] border border-[#FFD700]">
                  <CardBody className="p-4 text-center">
                    <p className="text-2xl font-bold text-[#FFD700]">{eventStats.win_rate}%</p>
                    <p className="text-sm text-gray-400">Win Rate</p>
                  </CardBody>
                </Card>
              </div>

              {/* Event Results List */}
              {eventResults.length > 0 ? (
                <div className="space-y-4">
                  {eventResults.map((event) => (
                    <Card key={event.id} className="bg-[#1a1a2e] border border-gray-700">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-white">{event.event_name}</h4>
                            <p className="text-sm text-gray-400">
                              {new Date(event.event_date).toLocaleDateString()}
                            </p>
                            {event.position && event.total_participants && (
                              <p className="text-xs text-gray-500">
                                Position: {event.position} of {event.total_participants}
                              </p>
                            )}
                          </div>
                          <Badge 
                            color={
                              event.result === 'win' ? 'success' : 
                              event.result === 'lose' ? 'danger' : 
                              'warning'
                            }
                            variant="flat"
                            size="lg"
                          >
                            {event.result.toUpperCase()}
                          </Badge>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No event results recorded yet.</p>
                  {team.is_leader && (
                    <p className="text-sm text-gray-500 mt-2">
                      Add your first event result to start tracking win rate.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Event Result Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        size="lg"
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            Add Event Result
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Event Name"
                placeholder="Enter event name"
                value={addEventData.event_name}
                onChange={(e) => setAddEventData({...addEventData, event_name: e.target.value})}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Input
                label="Event Date"
                type="date"
                value={addEventData.event_date}
                onChange={(e) => setAddEventData({...addEventData, event_date: e.target.value})}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Select
                label="Result"
                placeholder="Select result"
                selectedKeys={[addEventData.result]}
                onSelectionChange={(keys) => {
                  const result = Array.from(keys)[0] as "win" | "lose" | "draw";
                  setAddEventData({...addEventData, result});
                }}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white"
                }}
              >
                <SelectItem key="win" textValue="Win">
                  <span className="text-green-400">Win</span>
                </SelectItem>
                <SelectItem key="lose" textValue="Lose">
                  <span className="text-red-400">Lose</span>
                </SelectItem>
                <SelectItem key="draw" textValue="Draw">
                  <span className="text-yellow-400">Draw</span>
                </SelectItem>
              </Select>
              
              <Input
                label="Position (Optional)"
                type="number"
                placeholder="Final position/rank"
                value={addEventData.position}
                onChange={(e) => setAddEventData({...addEventData, position: e.target.value})}
                variant="bordered"
                min={1}
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Input
                label="Total Participants (Optional)"
                type="number"
                placeholder="Number of teams participated"
                value={addEventData.total_participants}
                onChange={(e) => setAddEventData({...addEventData, total_participants: e.target.value})}
                variant="bordered"
                min={1}
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setShowAddEventModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              className="bg-[#FFD700] text-black"
              onPress={handleAddEvent}
              isLoading={isAddingEvent}
            >
              Add Result
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            Remove Member
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              Are you sure you want to remove <strong>{selectedMember?.nama_lengkap}</strong> from the team?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setShowRemoveModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleRemoveMember}
              isLoading={isActionLoading}
            >
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            Edit Team Details
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Team Name"
                placeholder="Enter team name"
                value={editTeamData.nama_team}
                onChange={(e) => setEditTeamData({...editTeamData, nama_team: e.target.value})}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Textarea
                label="Description"
                placeholder="Enter team description"
                value={editTeamData.deskripsi}
                onChange={(e) => setEditTeamData({...editTeamData, deskripsi: e.target.value})}
                variant="bordered"
                rows={3}
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Textarea
                label="Requirements (Optional)"
                placeholder="Enter team requirements"
                value={editTeamData.requirements}
                onChange={(e) => setEditTeamData({...editTeamData, requirements: e.target.value})}
                variant="bordered"
                rows={2}
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Input
                label="Max Participants"
                type="number"
                placeholder="Enter maximum participants"
                value={editTeamData.max_participants.toString()}
                onChange={(e) => setEditTeamData({...editTeamData, max_participants: parseInt(e.target.value) || 0})}
                variant="bordered"
                min={1}
                max={10}
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
              
              <Input
                label="Event Name (Optional)"
                placeholder="Enter event name"
                value={editTeamData.event_name}
                onChange={(e) => setEditTeamData({...editTeamData, event_name: e.target.value})}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300"
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              className="bg-[#FFD700] text-black"
              onPress={handleUpdateTeam}
              isLoading={isUpdating}
            >
              Update Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Team Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            Delete Team
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              Are you sure you want to delete <strong>{team.nama_team}</strong>? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteTeam}
              isLoading={isActionLoading}
            >
              Delete Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
