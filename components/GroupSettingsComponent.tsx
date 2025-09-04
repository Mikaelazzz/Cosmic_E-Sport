"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
  Alert,
  Spinner,
} from "@heroui/react";
import { UsersIcon, CogIcon } from "@heroicons/react/24/outline";

interface GroupSettingsProps {
  eventId: number;
  onSettingsChange?: (settings: GroupSettings) => void;
}

interface GroupSettings {
  teams_per_group: number;
  total_groups: number;
  auto_generate: boolean;
}

interface ExistingGroup {
  id: string;
  name: string;
  team_count: number;
}

export default function GroupSettingsComponent({ eventId, onSettingsChange }: GroupSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<GroupSettings>({
    teams_per_group: 4,
    total_groups: 2,
    auto_generate: true
  });
  const [existingGroups, setExistingGroups] = useState<ExistingGroup[]>([]);
  const [bracketType, setBracketType] = useState<string>("");

  useEffect(() => {
    fetchGroupSettings();
  }, [eventId]);

  const fetchGroupSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/groups`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBracketType(result.data.bracket_type);
          setSettings(result.data.group_settings);
          setExistingGroups(result.data.existing_groups || []);
          setError("");
        } else {
          setError(result.error || "Failed to fetch group settings");
        }
      } else {
        setError("Failed to fetch group settings");
      }
    } catch (error) {
      console.error('Error fetching group settings:', error);
      setError("An error occurred while fetching group settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/events/${eventId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess("Group settings updated successfully!");
          onSettingsChange?.(settings);
          // Refresh to see new groups
          setTimeout(() => {
            fetchGroupSettings();
            setSuccess("");
          }, 2000);
        } else {
          setError(result.error || "Failed to update group settings");
        }
      } else {
        setError("Failed to update group settings");
      }
    } catch (error) {
      console.error('Error updating group settings:', error);
      setError("An error occurred while updating group settings");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalTeams = () => {
    return settings.teams_per_group * settings.total_groups;
  };

  // Only show this component for group-type brackets
  if (bracketType !== 'group') {
    return null;
  }

  return (
    <Card className="bg-[#111020] border border-gray-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CogIcon className="w-5 h-5 text-[#FFD700]" />
          <h3 className="text-lg font-bold text-[#FFD700]">Group Stage Settings</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {error && (
          <Alert color="danger" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="success" title="Success">
            {success}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" color="warning" />
          </div>
        ) : (
          <>
            {/* Group Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Teams per Group"
                value={settings.teams_per_group.toString()}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  teams_per_group: parseInt(e.target.value) || 1
                }))}
                min={2}
                max={8}
                classNames={{
                  label: "text-gray-300",
                  input: "bg-slate-800 border-slate-600 text-white",
                  inputWrapper: "bg-slate-800 border-slate-600 data-[hover=true]:border-[#FFD700]/50",
                }}
              />

              <Input
                type="number"
                label="Total Groups"
                value={settings.total_groups.toString()}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  total_groups: parseInt(e.target.value) || 1
                }))}
                min={1}
                max={8}
                classNames={{
                  label: "text-gray-300",
                  input: "bg-slate-800 border-slate-600 text-white",
                  inputWrapper: "bg-slate-800 border-slate-600 data-[hover=true]:border-[#FFD700]/50",
                }}
              />
            </div>

            {/* Auto Generate Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium">Auto Generate Groups</h4>
                <p className="text-gray-400 text-sm">
                  Automatically distribute teams into groups randomly
                </p>
              </div>
              <Switch
                isSelected={settings.auto_generate}
                onValueChange={(checked) => setSettings(prev => ({
                  ...prev,
                  auto_generate: checked
                }))}
                color="warning"
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">Configuration Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Teams Needed:</span>
                  <span className="text-white font-bold ml-2">{calculateTotalTeams()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Groups:</span>
                  <span className="text-white font-bold ml-2">{settings.total_groups}</span>
                </div>
                <div>
                  <span className="text-gray-400">Teams per Group:</span>
                  <span className="text-white font-bold ml-2">{settings.teams_per_group}</span>
                </div>
                <div>
                  <span className="text-gray-400">Auto Generate:</span>
                  <span className={`font-bold ml-2 ${settings.auto_generate ? 'text-green-400' : 'text-red-400'}`}>
                    {settings.auto_generate ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Existing Groups */}
            {existingGroups.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Existing Groups</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingGroups.map((group) => (
                    <div key={group.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{group.name}</span>
                        <div className="flex items-center gap-1 text-[#FFD700]">
                          <UsersIcon className="w-4 h-4" />
                          <span className="text-sm">{group.team_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            {settings.auto_generate && existingGroups.length > 0 && (
              <Alert color="warning" title="Warning">
                Updating settings with auto-generate enabled will recreate all groups and redistribute teams randomly.
                Existing groups and their data will be lost.
              </Alert>
            )}

            {/* Update Button */}
            <div className="flex justify-end">
              <Button
                color="warning"
                onPress={handleUpdateSettings}
                isLoading={isLoading}
                isDisabled={isLoading}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600"
              >
                {existingGroups.length > 0 ? 'Update Groups' : 'Create Groups'}
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
