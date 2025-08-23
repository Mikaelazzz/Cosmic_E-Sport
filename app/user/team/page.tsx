"use client";
import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";
import { Badge } from "@heroui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getUserAvatarUrl, generateInitials } from "@/lib/avatar";
import { Eye as EyeIcon, Star as StarIcon, Plus as PlusIcon, Search as SearchIcon } from "lucide-react";

interface Team {
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
  participants: Array<{
    id: string;
    nama_lengkap: string;
    email?: string;
    nim?: string;
    role?: string;
    role_in_team: 'leader' | 'member';
  }>;
}

interface MyTeamData {
  count: number;
  teams: Team[];
}

export default function TeamPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeamData, setMyTeamData] = useState<MyTeamData>({ count: 0, teams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyTeamsModal, setShowMyTeamsModal] = useState(false);
  const [createTeamData, setCreateTeamData] = useState({
    nama_team: "",
    deskripsi: "",
    requirements: "",
    max_participants: 10,
    event_name: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  
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
    if (isAuthenticated && user) {
      fetchTeams();
      fetchMyTeams();
    }
  }, [isAuthenticated, user]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Teams data received:', result.data);
          // Debug first team participants
          if (result.data.length > 0) {
            console.log('First team participants:', result.data[0].participants);
          }
          setTeams(result.data);
        } else {
          setError(result.message || "Failed to fetch teams");
        }
      } else {
        setError("Failed to fetch teams");
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError("An error occurred while fetching teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const response = await fetch('/api/teams/my-teams', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMyTeamData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching my teams:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!createTeamData.nama_team.trim() || !createTeamData.deskripsi.trim()) {
      showAlert("warning", "Validation Error", "Team name and description are required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(createTeamData)
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        setCreateTeamData({
          nama_team: "",
          deskripsi: "",
          requirements: "",
          max_participants: 10,
          event_name: ""
        });
        fetchTeams();
        fetchMyTeams();
        setError("");
        showAlert("success", "Team Created Successfully", `Team "${createTeamData.nama_team}" has been created and you are now the leader.`);
      } else {
        showAlert("danger", "Create Team Failed", result.message || "Failed to create team");
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showAlert("danger", "Create Team Error", "An error occurred while creating team");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRequestToJoin = async (teamId: number) => {
    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ teamId })
      });

      const result = await response.json();

      if (result.success) {
        setError("");
        fetchTeams(); // Refresh teams list
        fetchMyTeams(); // Refresh my teams count
        showAlert("success", "Join Request Sent", "Your request to join the team has been sent successfully. Please wait for the team leader's approval.");
      } else {
        showAlert("danger", "Join Request Failed", result.message || "Failed to send join request");
      }
    } catch (error) {
      console.error('Error joining team:', error);
      showAlert("danger", "Join Request Error", "An error occurred while sending join request");
    }
  };

  const filteredTeams = teams.filter(team =>
    team.nama_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Please login to access teams.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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

      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button
          color="warning"
          variant="solid"
          size="lg"
          className="bg-[#FFD700] text-black font-bold"
          onPress={() => setShowCreateModal(true)}
        >
          Create Team
        </Button>
        <Button
          color="default"
          variant="bordered"
          size="lg"
          className="border-gray-600 text-white"
          onPress={() => setShowMyTeamsModal(true)}
        >
          My Team ({myTeamData.count})
        </Button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          startContent={<SearchIcon className="w-5 h-5 text-gray-400" />}
          className="max-w-md"
          variant="bordered"
        />
      </div>

      {/* Error Message */}
      {error && (
        <Alert color="danger" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {/* Available Teams */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Available Team</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="bg-[#111020] border-2 border-[#FFD700] hover:border-[#FFE55C] transition-colors"
            >
              <CardBody className="p-6">
                {/* Team Header */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-[#FFD700]">{team.nama_team}</h2>
                  <Badge color="warning" variant="flat">
                    {team.current_participants}/{team.max_participants}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{team.deskripsi}</p>

                {/* Win Rate */}
                <div className="flex items-center gap-2 mb-4">
                  <StarIcon className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-white font-medium">{team.win_rate}%</span>
                  <span className="text-gray-400 text-sm">Win Rate</span>
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Team Members</h3>
                  <div className="flex items-center gap-2">
                    <AvatarGroup max={6} className="flex">
                      {team.participants.map((participant) => (
                        <Avatar
                          key={participant.id}
                          src={getUserAvatarUrl(participant, 200, true)}
                          name={participant.nama_lengkap}
                          size="sm"
                          className="border-2 border-[#FFD700]"
                        />
                      ))}
                    </AvatarGroup>
                    {team.current_participants < team.max_participants && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#FFD700] border-dashed flex items-center justify-center">
                        <PlusIcon className="w-4 h-4 text-[#FFD700]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    color="primary"
                    variant="solid"
                    size="sm"
                    className="flex-1"
                    onPress={() => handleRequestToJoin(team.id)}
                    isDisabled={team.current_participants >= team.max_participants}
                  >
                    Request To Join
                  </Button>
                  <Button
                    color="default"
                    variant="light"
                    size="sm"
                    isIconOnly
                    onPress={() => router.push(`/user/team/${team.id}`)}
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No teams available</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <h3>Create New Team</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Team Name"
                placeholder="Enter team name"
                value={createTeamData.nama_team}
                onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, nama_team: value }))}
                variant="bordered"
                isRequired
              />
              <Input
                label="Description"
                placeholder="Enter team description"
                value={createTeamData.deskripsi}
                onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, deskripsi: value }))}
                variant="bordered"
                isRequired
              />
              <Input
                label="Requirements"
                placeholder="Enter team requirements (optional)"
                value={createTeamData.requirements}
                onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, requirements: value }))}
                variant="bordered"
              />
              <Input
                label="Max Participants"
                type="number"
                min={1}
                max={10}
                value={createTeamData.max_participants.toString()}
                onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, max_participants: parseInt(value) || 10 }))}
                variant="bordered"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              className="bg-[#FFD700] text-black"
              onPress={handleCreateTeam}
              isLoading={isCreating}
            >
              Create Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* My Teams Modal */}
      <Modal
        isOpen={showMyTeamsModal}
        onClose={() => setShowMyTeamsModal(false)}
        size="lg"
        classNames={{
          base: "bg-[#1a1a2e]",
          header: "border-b border-gray-700",
          body: "py-6"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <h3>My Teams ({myTeamData.count})</h3>
          </ModalHeader>
          <ModalBody>
            {myTeamData.teams.length > 0 ? (
              <div className="space-y-4">
                {myTeamData.teams.map((team) => (
                  <Card key={team.id} className="bg-[#111020] border border-gray-700">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-[#FFD700]">{team.nama_team}</h4>
                          <p className="text-sm text-gray-400">{team.deskripsi}</p>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => router.push(`/user/team/${team.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">You haven't joined any teams yet.</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}