"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Alert,
  Chip,
  Divider,
  Badge,
} from "@heroui/react";
import { 
  ArrowLeftIcon, 
  TrophyIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { 
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid
} from "@heroicons/react/24/solid";

// Types
interface SingleEliminationRanking {
  position: number;
  team_id: number;
  team_name: string;
  status: 'champion' | 'runner_up' | 'semi_finalist' | 'eliminated';
}

interface GroupRanking {
  group_id: string;
  group_name: string;
  teams: Array<{
    group_id: string;
    group_name: string;
    position_in_group: number;
    team_id: number;
    team_name: string;
    matches_played: number;
    wins: number;
    losses: number;
    points: number;
    status: 'group_winner' | 'group_runner_up' | 'group_participant';
  }>;
}

interface RankingData {
  type: 'single-elimination' | 'group';
  rankings: SingleEliminationRanking[] | GroupRanking[];
}

export default function TournamentRankingsPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [rankingData, setRankingData] = useState<RankingData | null>(null);

  useEffect(() => {
    if (params.slug) {
      fetchRankings();
    }
  }, [params.slug]);

  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      
      // Get event ID from slug using the same method as bracket page
      const slug = params.slug as string;
      
      // First, get the event ID from slug using the existing detail API
      const eventIdResponse = await fetch(`/api/events/detail/${slug}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!eventIdResponse.ok) {
        setError("Event not found");
        return;
      }

      const eventIdResult = await eventIdResponse.json();
      if (!eventIdResult.success || !eventIdResult.data.event) {
        setError(eventIdResult.error || "Failed to get event");
        return;
      }

      const eventId = eventIdResult.data.event.id;
      
      // Now fetch rankings using the event ID
      const response = await fetch(`/api/events/${eventId}/rankings`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRankingData(result.data);
          setError("");
        } else {
          // Show more detailed error message from API
          setError(result.message || result.error || "Failed to fetch rankings");
        }
      } else {
        // Handle non-200 responses
        try {
          const errorResult = await response.json();
          setError(errorResult.message || errorResult.error || "Failed to fetch rankings");
        } catch {
          setError("Failed to fetch rankings");
        }
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setError("An error occurred while fetching rankings");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSingleEliminationRankings = (rankings: SingleEliminationRanking[]) => {
    const champion = rankings.find(r => r.position === 1);
    const runnerUp = rankings.find(r => r.position === 2);
    const semiFinalists = rankings.filter(r => r.position === 3);

    return (
      <div className="space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#FFD700] mb-2">🏆 Final Rankings</h2>
          <p className="text-gray-400">Single Elimination Tournament Results ({rankings.length} participants)</p>
        </div>

        {/* Podium Style Rankings - Adaptive for different number of participants */}
        <div className={`grid gap-6 max-w-4xl mx-auto ${rankings.length >= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Runner-up (2nd Place) - Show if available */}
          {runnerUp && (
            <div className={`order-1 ${rankings.length >= 3 ? 'md:order-1' : 'md:order-2'}`}>
              <Card className="bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-400">
                <CardHeader className="text-center pb-2">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <Badge content="2nd" color="default" placement="top-right">
                      <TrophyIconSolid className="w-8 h-8 text-gray-400" />
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="text-center pt-0">
                  <h3 className="text-lg font-bold text-white mb-1">{runnerUp.team_name}</h3>
                  <Chip color="default" variant="flat" size="sm">Runner-up</Chip>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Champion (1st Place) - Position adapts based on participant count */}
          {champion && (
            <div className={`order-2 ${rankings.length >= 3 ? 'md:order-2' : 'md:order-1'}`}>
              <Card className="bg-gradient-to-b from-yellow-400 to-yellow-600 border-4 border-[#FFD700] transform md:scale-110">
                <CardHeader className="text-center pb-2">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#FFD700] rounded-full flex items-center justify-center mb-2 shadow-lg">
                      <TrophyIconSolid className="w-10 h-10 text-yellow-800" />
                    </div>
                    <Badge content="1st" color="warning" placement="top-right">
                      <TrophyIconSolid className="w-10 h-10 text-[#FFD700]" />
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="text-center pt-0">
                  <h3 className="text-xl font-bold text-yellow-900 mb-1">{champion.team_name}</h3>
                  <Chip color="warning" variant="solid" size="sm">🏆 Champion</Chip>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Third Place */}
          {semiFinalists.length > 0 && (
            <div className="order-3 md:order-3">
              <Card className="bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-500">
                <CardHeader className="text-center pb-2">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <Badge content="3rd" color="warning" placement="top-right">
                      <StarIconSolid className="w-8 h-8 text-amber-500" />
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="text-center pt-0">
                  <h3 className="text-lg font-bold text-white mb-1">{semiFinalists[0].team_name}</h3>
                  <Chip color="warning" variant="flat" size="sm">3rd Place</Chip>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Detailed Rankings Table */}
        <Card className="bg-[#111020] border border-gray-700">
          <CardHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">Complete Rankings</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {rankings.map((team, index) => (
                <div key={team.team_id} className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${team.position === 1 ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border border-yellow-400' :
                    team.position === 2 ? 'bg-gradient-to-r from-gray-600/20 to-gray-400/20 border border-gray-400' :
                    team.position === 3 ? 'bg-gradient-to-r from-amber-600/20 to-amber-400/20 border border-amber-400' :
                    'bg-gray-800/50'}
                `}>
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${team.position === 1 ? 'bg-[#FFD700] text-yellow-900' :
                        team.position === 2 ? 'bg-gray-400 text-white' :
                        team.position === 3 ? 'bg-amber-500 text-white' :
                        'bg-gray-600 text-white'}
                    `}>
                      {team.position}
                    </div>
                    <span className="text-white font-medium">{team.team_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.position === 1 && <TrophyIconSolid className="w-5 h-5 text-[#FFD700]" />}
                    {team.position === 2 && <TrophyIconSolid className="w-5 h-5 text-gray-400" />}
                    {team.position === 3 && <StarIconSolid className="w-5 h-5 text-amber-500" />}
                    <Chip 
                      color={
                        team.position === 1 ? "warning" :
                        team.position === 2 ? "default" :
                        team.position === 3 ? "warning" :
                        "secondary"
                      }
                      variant="flat"
                      size="sm"
                    >
                      {team.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderGroupStageRankings = (groupRankings: GroupRanking[]) => {
    return (
      <div className="space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#FFD700] mb-2">🏆 Group Stage Rankings</h2>
          <p className="text-gray-400">Tournament Group Results</p>
        </div>

        {/* Group Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groupRankings.map((group) => (
            <Card key={group.group_id} className="bg-[#111020] border border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-bold text-[#FFD700]">{group.group_name}</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {group.teams.map((team, index) => (
                    <div key={team.team_id} className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${team.position_in_group === 1 ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border border-yellow-400' :
                        team.position_in_group === 2 ? 'bg-gradient-to-r from-gray-600/20 to-gray-400/20 border border-gray-400' :
                        'bg-gray-800/50'}
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold
                          ${team.position_in_group === 1 ? 'bg-[#FFD700] text-yellow-900' :
                            team.position_in_group === 2 ? 'bg-gray-400 text-white' :
                            'bg-gray-600 text-white'}
                        `}>
                          {team.position_in_group}
                        </div>
                        <div>
                          <span className="text-white font-medium block">{team.team_name}</span>
                          <span className="text-gray-400 text-sm">
                            {team.wins}W - {team.losses}L | {team.points} pts
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {team.position_in_group === 1 && <TrophyIconSolid className="w-5 h-5 text-[#FFD700]" />}
                        {team.position_in_group === 2 && <StarIconSolid className="w-5 h-5 text-gray-400" />}
                        <Chip 
                          color={
                            team.position_in_group === 1 ? "warning" :
                            team.position_in_group === 2 ? "default" :
                            "secondary"
                          }
                          variant="flat"
                          size="sm"
                        >
                          {team.status.replace('_', ' ').toUpperCase()}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Overall Top Performers */}
        <Card className="bg-[#111020] border border-gray-700">
          <CardHeader>
            <h3 className="text-xl font-bold text-[#FFD700]">🌟 Top Performers</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groupRankings.map((group) => {
                const winner = group.teams.find(t => t.position_in_group === 1);
                return winner ? (
                  <div key={`winner-${group.group_id}`} className="text-center p-4 bg-gradient-to-b from-yellow-600/20 to-yellow-400/20 rounded-lg border border-yellow-400">
                    <TrophyIconSolid className="w-8 h-8 text-[#FFD700] mx-auto mb-2" />
                    <h4 className="text-white font-bold">{winner.team_name}</h4>
                    <p className="text-gray-400 text-sm">{group.group_name} Winner</p>
                    <p className="text-yellow-400 text-sm">{winner.points} points</p>
                  </div>
                ) : null;
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0E23] p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            color="default"
            variant="light"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            onPress={() => router.back()}
            className="mb-6"
          >
            Back to Event
          </Button>

          {/* Error Card with Information */}
          <Card className="bg-[#111020] border border-gray-700">
            <CardBody className="text-center py-12">
              <div className="flex flex-col items-center space-y-6">
                {/* Icon */}
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                  <TrophyIcon className="w-10 h-10 text-gray-500" />
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-white">Rankings Not Available</h2>
                
                {/* Error Message */}
                <div className="max-w-md">
                  <p className="text-gray-400 mb-4">{error}</p>
                  
                  {/* Helpful Information */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-left">
                    <h3 className="text-blue-300 font-medium mb-2">ℹ️ What you need to know:</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Tournament bracket must be created first</li>
                      <li>• Matches need to be played and completed</li>
                      <li>• Rankings will appear automatically after tournament ends</li>
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => router.push(`/user/events/${params.slug}/bracket`)}
                    startContent={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 3H6V7H2V3ZM18 3H22V7H18V3ZM2 17H6V21H2V17ZM18 17H22V21H18V17ZM7 4H17V6H7V4ZM7 18H17V20H7V18ZM8 8V16H10V13H14V16H16V8H14V11H10V8H8Z"/>
                      </svg>
                    }
                  >
                    View Bracket
                  </Button>
                  
                  <Button
                    color="default"
                    variant="light"
                    onPress={() => router.push('/user/events')}
                    startContent={<ArrowLeftIcon className="w-4 h-4" />}
                  >
                    All Events
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E23] p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            color="default"
            variant="light"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            onPress={() => router.back()}
            className="mb-4"
          >
            Back to Bracket
          </Button>
        </div>

        {/* Rankings Content */}
        {rankingData && (
          <div>
            {rankingData.type === 'single-elimination' 
              ? renderSingleEliminationRankings(rankingData.rankings as SingleEliminationRanking[])
              : renderGroupStageRankings(rankingData.rankings as GroupRanking[])
            }
          </div>
        )}
      </div>
    </div>
  );
}
