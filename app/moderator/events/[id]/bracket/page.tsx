"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
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
  Input,
  Textarea,
  Tabs,
  Tab,
  Divider,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Event {
  id: number;
  nama_event: string;
  participant_type: 'individual' | 'team';
  max_participant: number;
  status: string;
}

interface Team {
  id: number;
  nama_team: string;
  description?: string;
  logo?: string;
}

interface Participant {
  id: number;
  event_id: number;
  team_id?: number;
  user_id?: number;
  status: 'pending' | 'approved' | 'rejected';
  teams?: Team;
  users?: {
    id: number;
    full_name: string;
    username: string;
  };
}

interface Match {
  id: string;
  round: number;
  position: number;
  team1_id?: number;
  team2_id?: number;
  team1_name?: string;
  team2_name?: string;
  winner_id?: number;
  status: 'pending' | 'ongoing' | 'completed';
  score_team1?: number;
  score_team2?: number;
}

interface Group {
  id: string;
  name: string;
  teams: Array<{
    id: number;
    name: string;
    matches_played: number;
    wins: number;
    losses: number;
    points: number;
  }>;
}

export default function EventBracketPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bracketType, setBracketType] = useState<'group' | 'single-elimination'>('single-elimination');
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // Modal states
  const { isOpen: isMatchOpen, onOpen: onMatchOpen, onClose: onMatchClose } = useDisclosure();
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isWinRateOpen, onOpen: onWinRateOpen, onClose: onWinRateClose } = useDisclosure();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState("");
  const [scoreTeam2, setScoreTeam2] = useState("");
  
  // Win rate calculation states
  const [finalRankings, setFinalRankings] = useState<{[teamId: number]: number}>({});
  const [isCalculatingWinRate, setIsCalculatingWinRate] = useState(false);

  // Group settings
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);

  const eventId = params.id as string;

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/moderator/events/${eventId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvent(result.data);
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

  // Fetch approved participants
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/moderator/events/${eventId}/participants?status=approved`, {
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

  // Fetch existing bracket
  const fetchBracket = async () => {
    try {
      const response = await fetch(`/api/moderator/events/${eventId}/bracket`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBracketType(result.data.type);
          if (result.data.type === 'group') {
            setGroups(result.data.groups || []);
          }
          setMatches(result.data.matches || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bracket:', error);
    }
  };

  // Generate bracket
  const generateBracket = async () => {
    if (participants.length === 0) {
      alert('No approved participants found');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/moderator/events/${eventId}/bracket/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: bracketType,
          numberOfGroups: bracketType === 'group' ? numberOfGroups : undefined,
          teamsPerGroup: bracketType === 'group' ? teamsPerGroup : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchBracket(); // Refresh bracket data
          onGenerateClose();
        } else {
          alert(result.message || 'Failed to generate bracket');
        }
      } else {
        alert('Failed to generate bracket');
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('An error occurred while generating bracket');
    } finally {
      setIsSaving(false);
    }
  };

  // Update match result
  const updateMatchResult = async () => {
    if (!selectedMatch) return;

    const team1Score = parseInt(scoreTeam1);
    const team2Score = parseInt(scoreTeam2);

    if (isNaN(team1Score) || isNaN(team2Score)) {
      alert('Please enter valid scores');
      return;
    }

    const winnerId = team1Score > team2Score ? selectedMatch.team1_id : selectedMatch.team2_id;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/moderator/events/${eventId}/bracket/match/${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          score_team1: team1Score,
          score_team2: team2Score,
          winner_id: winnerId,
          status: 'completed'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchBracket(); // Refresh bracket data
          onMatchClose();
          setScoreTeam1("");
          setScoreTeam2("");
        } else {
          alert(result.message || 'Failed to update match result');
        }
      } else {
        alert('Failed to update match result');
      }
    } catch (error) {
      console.error('Error updating match result:', error);
      alert('An error occurred while updating match result');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle win rate calculation
  const handleCalculateWinRate = async () => {
    if (event?.participant_type !== 'team') {
      alert('Win rate calculation is only available for team events');
      return;
    }

    setIsCalculatingWinRate(true);
    try {
      const response = await fetch(`/api/events/${eventId}/calculate-win-rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          final_rankings: finalRankings
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Win rates calculated successfully!');
          onWinRateClose();
          setFinalRankings({});
        } else {
          alert(result.message || 'Failed to calculate win rates');
        }
      } else {
        alert('Failed to calculate win rates');
      }
    } catch (error) {
      console.error('Error calculating win rates:', error);
      alert('An error occurred while calculating win rates');
    } finally {
      setIsCalculatingWinRate(false);
    }
  };

  // Handle ranking change
  const handleRankingChange = (teamId: number, position: number) => {
    setFinalRankings(prev => ({
      ...prev,
      [teamId]: position
    }));
  };

  // Handle match click
  const handleMatchClick = (match: Match) => {
    if (match.team1_id && match.team2_id && match.status !== 'completed') {
      setSelectedMatch(match);
      setScoreTeam1(match.score_team1?.toString() || "");
      setScoreTeam2(match.score_team2?.toString() || "");
      onMatchOpen();
    }
  };

  // Render single elimination bracket
  const renderSingleEliminationBracket = () => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No bracket generated yet</p>
          <Button color="primary" onPress={onGenerateOpen}>
            Generate Bracket
          </Button>
        </div>
      );
    }

    // Group matches by round
    const matchesByRound: { [round: number]: Match[] } = {};
    matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#FFD700]">Single Elimination Bracket</h3>
          <Button color="primary" variant="bordered" onPress={onGenerateOpen}>
            Regenerate Bracket
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max p-4">
            {rounds.map((round, roundIndex) => (
              <div key={round} className="flex flex-col gap-4 min-w-[280px]">
                <h4 className="text-center font-semibold text-white">
                  {roundIndex === rounds.length - 1 ? 'Final' : 
                   roundIndex === rounds.length - 2 ? 'Semifinal' : 
                   `Round ${round}`}
                </h4>
                {matchesByRound[parseInt(round)].map((match) => (
                  <Card
                    key={match.id}
                    className={`bg-[#111020] border-2 transition-colors cursor-pointer ${
                      match.status === 'completed' ? 'border-green-500' :
                      match.status === 'ongoing' ? 'border-yellow-500' :
                      'border-[#FFD700] hover:border-[#FFE55C]'
                    }`}
                    isPressable
                    onPress={() => handleMatchClick(match)}
                  >
                    <CardBody className="p-4">
                      <div className="space-y-2">
                        {/* Team 1 */}
                        <div className={`flex justify-between items-center p-2 rounded ${
                          match.winner_id === match.team1_id ? 'bg-green-900/30' : 'bg-gray-800/30'
                        }`}>
                          <span className="text-white font-medium">
                            {match.team1_name || 'TBD'}
                          </span>
                          {match.status === 'completed' && (
                            <span className="text-white font-bold">
                              {match.score_team1 || 0}
                            </span>
                          )}
                        </div>

                        {/* VS */}
                        <div className="text-center">
                          <span className="text-[#FFD700] font-bold">VS</span>
                        </div>

                        {/* Team 2 */}
                        <div className={`flex justify-between items-center p-2 rounded ${
                          match.winner_id === match.team2_id ? 'bg-green-900/30' : 'bg-gray-800/30'
                        }`}>
                          <span className="text-white font-medium">
                            {match.team2_name || 'TBD'}
                          </span>
                          {match.status === 'completed' && (
                            <span className="text-white font-bold">
                              {match.score_team2 || 0}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Status */}
                      <div className="mt-3 text-center">
                        <Chip
                          color={
                            match.status === 'completed' ? 'success' :
                            match.status === 'ongoing' ? 'warning' : 'default'
                          }
                          size="sm"
                          variant="flat"
                        >
                          {match.status.toUpperCase()}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render group stage bracket
  const renderGroupStageBracket = () => {
    if (groups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No group stage generated yet</p>
          <Button color="primary" onPress={onGenerateOpen}>
            Generate Groups
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#FFD700]">Group Stage</h3>
          <Button color="primary" variant="bordered" onPress={onGenerateOpen}>
            Regenerate Groups
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="bg-[#111020] border-2 border-[#FFD700]">
              <CardHeader className="pb-2">
                <h4 className="text-lg font-bold text-[#FFD700]">{group.name}</h4>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-2">
                  {group.teams.map((team, index) => (
                    <div
                      key={team.id}
                      className={`flex justify-between items-center p-2 rounded ${
                        index < 2 ? 'bg-green-900/20 border border-green-600/30' : 'bg-gray-800/30'
                      }`}
                    >
                      <div>
                        <span className="text-white font-medium">{team.name}</span>
                        <div className="text-xs text-gray-400">
                          {team.wins}W - {team.losses}L
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#FFD700] font-bold">{team.points}</div>
                        <div className="text-xs text-gray-400">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Group Matches */}
        {matches.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-bold text-[#FFD700] mb-4">Group Matches</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className={`bg-[#111020] border-2 transition-colors cursor-pointer ${
                    match.status === 'completed' ? 'border-green-500' :
                    match.status === 'ongoing' ? 'border-yellow-500' :
                    'border-[#FFD700] hover:border-[#FFE55C]'
                  }`}
                  isPressable
                  onPress={() => handleMatchClick(match)}
                >
                  <CardBody className="p-4">
                    <div className="space-y-2">
                      {/* Team 1 */}
                      <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner_id === match.team1_id ? 'bg-green-900/30' : 'bg-gray-800/30'
                      }`}>
                        <span className="text-white font-medium">
                          {match.team1_name || 'TBD'}
                        </span>
                        {match.status === 'completed' && (
                          <span className="text-white font-bold">
                            {match.score_team1 || 0}
                          </span>
                        )}
                      </div>

                      {/* VS */}
                      <div className="text-center">
                        <span className="text-[#FFD700] font-bold">VS</span>
                      </div>

                      {/* Team 2 */}
                      <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner_id === match.team2_id ? 'bg-green-900/30' : 'bg-gray-800/30'
                      }`}>
                        <span className="text-white font-medium">
                          {match.team2_name || 'TBD'}
                        </span>
                        {match.status === 'completed' && (
                          <span className="text-white font-bold">
                            {match.score_team2 || 0}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Status */}
                    <div className="mt-3 text-center">
                      <Chip
                        color={
                          match.status === 'completed' ? 'success' :
                          match.status === 'ongoing' ? 'warning' : 'default'
                        }
                        size="sm"
                        variant="flat"
                      >
                        {match.status.toUpperCase()}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (isAuthenticated && eventId) {
      setIsLoading(true);
      Promise.all([
        fetchEventDetails(),
        fetchParticipants(),
        fetchBracket()
      ]).finally(() => setIsLoading(false));
    }
  }, [eventId, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <Card className="bg-[#111020] border-2 border-[#FFD700] p-8">
          <CardBody className="text-center">
            <h2 className="text-2xl font-bold text-[#FFD700] mb-4">Authentication Required</h2>
            <p className="text-gray-300 mb-6">Please login as moderator to access this page</p>
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
          <p className="text-gray-300">Loading bracket...</p>
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
              onPress={() => router.push('/moderator/events')}
            >
              Back to Events
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            color="primary"
            onPress={() => router.push('/moderator/events')}
            className="mb-4"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back to Events
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">
                Event Bracket
              </h1>
              <p className="text-gray-300 mt-1">{event.nama_event}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge color="primary" variant="flat">
                {participants.length} Participants
              </Badge>
              <Chip color="secondary" variant="flat">
                {event.participant_type === 'team' ? 'Team Event' : 'Individual Event'}
              </Chip>
              {event.participant_type === 'team' && matches.length > 0 && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<TrophyIcon className="w-4 h-4" />}
                  onPress={onWinRateOpen}
                  size="sm"
                >
                  Calculate Win Rate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bracket Type Selector */}
        <Card className="bg-[#111020] border-2 border-[#FFD700] mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Bracket Type:</h3>
              <Tabs
                selectedKey={bracketType}
                onSelectionChange={(key) => setBracketType(key as 'group' | 'single-elimination')}
                color="primary"
                variant="bordered"
              >
                <Tab key="single-elimination" title="Single Elimination" />
                <Tab key="group" title="Group Stage" />
              </Tabs>
            </div>
          </CardBody>
        </Card>

        {/* Bracket Content */}
        <Card className="bg-[#111020] border-2 border-[#FFD700]">
          <CardBody className="p-6">
            {bracketType === 'single-elimination' 
              ? renderSingleEliminationBracket() 
              : renderGroupStageBracket()
            }
          </CardBody>
        </Card>
      </div>

      {/* Generate Bracket Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={onGenerateClose}
        size="2xl"
        className="bg-[#111020]"
      >
        <ModalContent>
          <ModalHeader className="text-[#FFD700]">
            Generate {bracketType === 'group' ? 'Group Stage' : 'Single Elimination'} Bracket
          </ModalHeader>
          <ModalBody>
            <Alert color="warning" className="mb-4">
              <strong>Warning:</strong> Generating a new bracket will replace any existing bracket data.
            </Alert>

            <div className="space-y-4">
              <div>
                <p className="text-white mb-2">
                  <strong>Approved Participants:</strong> {participants.length}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {participants.map((participant) => (
                    <Chip key={participant.id} size="sm" variant="flat">
                      {participant.teams?.nama_team || participant.users?.full_name || 'Unknown'}
                    </Chip>
                  ))}
                </div>
              </div>

              {bracketType === 'group' && (
                <div className="space-y-4">
                  <Divider />
                  <h4 className="text-lg font-semibold text-white">Group Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Number of Groups
                      </label>
                      <Select
                        value={numberOfGroups.toString()}
                        onSelectionChange={(value) => setNumberOfGroups(parseInt(value as string))}
                        variant="bordered"
                      >
                        <SelectItem key="2">2 Groups</SelectItem>
                        <SelectItem key="4">4 Groups</SelectItem>
                        <SelectItem key="6">6 Groups</SelectItem>
                        <SelectItem key="8">8 Groups</SelectItem>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Teams per Group
                      </label>
                      <Select
                        value={teamsPerGroup.toString()}
                        onSelectionChange={(value) => setTeamsPerGroup(parseInt(value as string))}
                        variant="bordered"
                      >
                        <SelectItem key="3">3 Teams</SelectItem>
                        <SelectItem key="4">4 Teams</SelectItem>
                        <SelectItem key="5">5 Teams</SelectItem>
                        <SelectItem key="6">6 Teams</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <Alert color="primary">
                    <strong>Info:</strong> Total slots needed: {numberOfGroups * teamsPerGroup}
                    {numberOfGroups * teamsPerGroup > participants.length && (
                      <span className="text-warning"> (More slots than participants!)</span>
                    )}
                  </Alert>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onGenerateClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={generateBracket}
              isLoading={isSaving}
              isDisabled={participants.length === 0}
            >
              Generate Bracket
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Match Result Modal */}
      <Modal
        isOpen={isMatchOpen}
        onClose={onMatchClose}
        size="lg"
        className="bg-[#111020]"
      >
        <ModalContent>
          <ModalHeader className="text-[#FFD700]">
            Update Match Result
          </ModalHeader>
          <ModalBody>
            {selectedMatch && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {selectedMatch.team1_name} vs {selectedMatch.team2_name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedMatch.team1_name} Score
                    </label>
                    <Input
                      type="number"
                      value={scoreTeam1}
                      onValueChange={setScoreTeam1}
                      variant="bordered"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedMatch.team2_name} Score
                    </label>
                    <Input
                      type="number"
                      value={scoreTeam2}
                      onValueChange={setScoreTeam2}
                      variant="bordered"
                      min="0"
                    />
                  </div>
                </div>

                {scoreTeam1 && scoreTeam2 && (
                  <Alert
                    color={parseInt(scoreTeam1) === parseInt(scoreTeam2) ? "warning" : "success"}
                  >
                    {parseInt(scoreTeam1) === parseInt(scoreTeam2) 
                      ? "Draw! Please enter different scores." 
                      : `Winner: ${parseInt(scoreTeam1) > parseInt(scoreTeam2) 
                          ? selectedMatch.team1_name 
                          : selectedMatch.team2_name}`
                    }
                  </Alert>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onMatchClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={updateMatchResult}
              isLoading={isSaving}
              isDisabled={!scoreTeam1 || !scoreTeam2 || scoreTeam1 === scoreTeam2}
            >
              Update Result
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Calculate Win Rate Modal */}
      <Modal
        isOpen={isWinRateOpen}
        onClose={onWinRateClose}
        size="2xl"
        className="bg-[#111020]"
      >
        <ModalContent>
          <ModalHeader className="text-[#FFD700]">
            Calculate Team Win Rates
          </ModalHeader>
          <ModalBody>
            <Alert color="primary" className="mb-4">
              <strong>Information:</strong> Set final tournament positions for each team. 
              Teams in positions 1-3 will get 100% win rate, positions 4+ will get 0% win rate.
            </Alert>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Final Team Positions</h4>
              
              {event?.participant_type === 'team' && participants.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Chip size="sm" variant="flat" color="secondary">
                          {participant.teams?.nama_team || 'Unknown Team'}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm">Position:</span>
                        <Input
                          type="number"
                          min="1"
                          max={participants.length}
                          placeholder="Position"
                          value={finalRankings[participant.team_id!]?.toString() || ""}
                          onChange={(e) => {
                            const position = parseInt(e.target.value);
                            if (position > 0 && position <= participants.length) {
                              handleRankingChange(participant.team_id!, position);
                            }
                          }}
                          className="w-20"
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">No team participants found</p>
              )}

              {Object.keys(finalRankings).length > 0 && (
                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                  <h5 className="text-sm font-semibold text-blue-300 mb-2">Preview:</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(finalRankings).map(([teamId, position]) => {
                      const participant = participants.find(p => p.team_id === parseInt(teamId));
                      const winRate = position <= 3 ? 100 : 0;
                      return (
                        <div key={teamId} className="flex justify-between">
                          <span className="text-gray-300">
                            {participant?.teams?.nama_team || 'Unknown Team'}
                          </span>
                          <span className={`font-semibold ${winRate === 100 ? 'text-green-400' : 'text-red-400'}`}>
                            Position {position} → {winRate}% win rate
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onWinRateClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCalculateWinRate}
              isLoading={isCalculatingWinRate}
              isDisabled={Object.keys(finalRankings).length === 0 || Object.keys(finalRankings).length !== participants.length}
            >
              Calculate Win Rates
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
