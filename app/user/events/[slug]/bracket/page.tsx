"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Alert,
  Chip,
  Divider,
} from "@heroui/react";
import { ArrowLeftIcon, TrophyIcon } from "@heroicons/react/24/outline";

// Types
interface BracketMatch {
  id: string;
  round: number;
  position: number;
  team1_id: number | null;
  team1_name: string | null;
  team2_id: number | null;
  team2_name: string | null;
  winner_id: number | null;
  status: 'pending' | 'ongoing' | 'completed';
  score_team1: number | null;
  score_team2: number | null;
}

interface BracketGroup {
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

interface BracketData {
  id: string;
  type: 'single-elimination' | 'group';
  settings: any;
  matches: BracketMatch[];
  groups?: BracketGroup[];
}

export default function UserBracketPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [eventId, setEventId] = useState<string | null>(null);

  const eventSlug = params.slug as string;

  // First, get event ID from the slug
  const fetchEventId = async (): Promise<string | null> => {
    try {
      console.log('🔍 Fetching event ID for slug:', eventSlug);
      const response = await fetch(`/api/events/detail/${eventSlug}`, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('📋 Detail API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Detail API result:', result);
        if (result.success && result.data.event) {
          console.log('✅ Found event ID:', result.data.event.id);
          return result.data.event.id;
        }
      }
      console.log('❌ No event found');
      return null;
    } catch (error) {
      console.error('❌ Error fetching event ID:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    fetchBracketData();
  }, [isAuthenticated, user, eventSlug]);

  const fetchBracketData = async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log('🔍 Fetching bracket data for slug:', eventSlug);

      // First get the event ID from slug
      const id = await fetchEventId();
      console.log('📋 Event ID from slug:', id);
      
      if (!id) {
        setError("Event not found");
        return;
      }

      setEventId(id);

      // Then fetch bracket data using the ID
      const response = await fetch(`/api/events/${id}/bracket`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBracketData(result.data);
        } else {
          setError(result.message || 'Failed to fetch bracket data');
        }
      } else {
        setError('Failed to fetch bracket data');
      }
    } catch (error) {
      console.error('Error fetching bracket:', error);
      setError('An error occurred while fetching bracket data');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if tournament is completed
  const isTournamentCompleted = () => {
    if (!bracketData) return false;
    
    if (bracketData.type === 'single-elimination') {
      // Check if final match is completed
      if (!bracketData.matches || bracketData.matches.length === 0) return false;
      
      const rounds = Array.from(new Set(bracketData.matches.map(m => m.round))).sort((a, b) => b - a);
      const finalRound = rounds[0];
      const finalMatches = bracketData.matches.filter(m => m.round === finalRound);
      
      return finalMatches.every(m => m.status === 'completed');
    } else if (bracketData.type === 'group') {
      // Check if all matches are completed
      return bracketData.matches ? bracketData.matches.every(m => m.status === 'completed') : false;
    }
    
    return false;
  };

  // Render single elimination bracket
  const renderSingleEliminationBracket = () => {
    if (!bracketData?.matches || bracketData.matches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No matches available</p>
        </div>
      );
    }

    // Group matches by round
    const matchesByRound: { [round: number]: BracketMatch[] } = {};
    bracketData.matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#FFD700] text-center">Single Elimination Bracket</h3>

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
                    className={`bg-[#111020] border-2 ${
                      match.status === 'completed' ? 'border-green-500' :
                      match.status === 'ongoing' ? 'border-yellow-500' :
                      'border-[#FFD700]'
                    }`}
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
    if (!bracketData?.groups || bracketData.groups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No groups available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#FFD700] text-center">Group Stage</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bracketData.groups.map((group) => (
            <Card key={group.id} className="bg-[#111020] border-2 border-[#FFD700]">
              <CardHeader>
                <h4 className="text-lg font-bold text-[#FFD700]">{group.name}</h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {group.teams.map((team, index) => (
                    <div key={team.id} className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-[#FFD700] font-bold">#{index + 1}</span>
                        <span className="text-white">{team.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-white font-semibold">{team.points}pts</div>
                        <div className="text-gray-400">{team.wins}W-{team.losses}L</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Recent Matches */}
        {bracketData.matches && bracketData.matches.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-bold text-[#FFD700] mb-4">Recent Matches</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bracketData.matches.slice(0, 6).map((match) => (
                <Card key={match.id} className="bg-[#111020] border border-gray-700">
                  <CardBody className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">{match.team1_name || 'TBD'}</span>
                        {match.status === 'completed' && (
                          <span className="text-white font-bold">{match.score_team1 || 0}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-[#FFD700] text-xs">VS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">{match.team2_name || 'TBD'}</span>
                        {match.status === 'completed' && (
                          <span className="text-white font-bold">{match.score_team2 || 0}</span>
                        )}
                      </div>
                      <div className="text-center mt-2">
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-white mt-4">Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (error || !bracketData) {
    return (
      <div className="min-h-screen bg-[#0B0D21] flex items-center justify-center">
        <Card className="bg-[#111020] border-2 border-red-500 p-8">
          <CardBody className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-gray-300 mb-6">{error || "Bracket not found"}</p>
            <Button 
              color="primary" 
              onPress={() => router.back()}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D21] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <Button
              variant="light"
              color="primary"
              onPress={() => router.back()}
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back to Event
            </Button>
            
            {/* Rankings Button - Show when tournament is completed */}
            {isTournamentCompleted() && (
              <Button
                color="warning"
                variant="solid"
                onPress={() => router.push(`/user/events/${eventSlug}/rankings`)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600"
              >
                View Rankings
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">
              Tournament Bracket
            </h1>
            <p className="text-gray-300 mt-2">View tournament progress and results</p>
            
            {/* Tournament Status */}
            {isTournamentCompleted() && (
              <div className="mt-4">
                <Chip color="success" variant="solid" size="lg">
                  Tournament Completed
                </Chip>
              </div>
            )}
          </div>
        </div>

        {/* Bracket Content */}
        <Card className="bg-[#111020] border-2 border-[#FFD700]">
          <CardBody className="p-6">
            {bracketData.type === 'single-elimination' 
              ? renderSingleEliminationBracket() 
              : renderGroupStageBracket()
            }
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
