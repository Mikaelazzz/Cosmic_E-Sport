import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';

interface AdvancedFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterCriteria) => void;
  currentFilters: FilterCriteria;
}

export interface FilterCriteria {
  dateRange?: {
    start: string;
    end: string;
  };
  kelas?: string[];
  status?: string[];
  hari?: string[];
  createdBy?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

const kelasOptions = [
  { value: "pemrograman_web", label: "Pemrograman Web" },
  { value: "database", label: "Database" },
  { value: "mobile_development", label: "Mobile Development" },
  { value: "ui_ux_design", label: "UI/UX Design" },
  { value: "cyber_security", label: "Cyber Security" },
  { value: "game_development", label: "Game Development" },
  { value: "data_science", label: "Data Science" },
];

const statusOptions = [
  { value: "belum_mulai", label: "Belum Mulai" },
  { value: "berlangsung", label: "Berlangsung" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const hariOptions = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
  { value: "minggu", label: "Minggu" },
];

export default function AdvancedFilterModal({ isOpen, onClose, onApplyFilter, currentFilters }: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: FilterCriteria = {};
    setFilters(emptyFilters);
    onApplyFilter(emptyFilters);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-gray-900/50 backdrop-blur-sm",
        base: "bg-gray-800 border border-gray-700",
        header: "border-b border-gray-700",
        body: "text-gray-200",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent>
        <ModalHeader className="text-white">
          Filter Lanjutan Jadwal Pertemuan
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Rentang Tanggal</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  label="Dari Tanggal"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value,
                      end: filters.dateRange?.end || ''
                    }
                  })}
                  classNames={{
                    input: "bg-gray-900/50 text-gray-200",
                    inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                    label: "text-gray-300",
                  }}
                />
                <Input
                  type="date"
                  label="Sampai Tanggal"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      start: filters.dateRange?.start || '',
                      end: e.target.value
                    }
                  })}
                  classNames={{
                    input: "bg-gray-900/50 text-gray-200",
                    inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                    label: "text-gray-300",
                  }}
                />
              </div>
            </div>

            {/* Kelas Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Kelas</label>
              <Select
                placeholder="Pilih kelas..."
                selectionMode="multiple"
                selectedKeys={filters.kelas || []}
                onSelectionChange={(keys) => setFilters({
                  ...filters,
                  kelas: Array.from(keys) as string[]
                })}
                classNames={{
                  trigger: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                  value: "text-gray-200",
                  popoverContent: "bg-gray-800 border-gray-700",
                }}
              >
                {kelasOptions.map((kelas) => (
                  <SelectItem key={kelas.value} className="text-gray-200">
                    {kelas.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <Select
                placeholder="Pilih status..."
                selectionMode="multiple"
                selectedKeys={filters.status || []}
                onSelectionChange={(keys) => setFilters({
                  ...filters,
                  status: Array.from(keys) as string[]
                })}
                classNames={{
                  trigger: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                  value: "text-gray-200",
                  popoverContent: "bg-gray-800 border-gray-700",
                }}
              >
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} className="text-gray-200">
                    {status.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Hari Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Hari</label>
              <Select
                placeholder="Pilih hari..."
                selectionMode="multiple"
                selectedKeys={filters.hari || []}
                onSelectionChange={(keys) => setFilters({
                  ...filters,
                  hari: Array.from(keys) as string[]
                })}
                classNames={{
                  trigger: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                  value: "text-gray-200",
                  popoverContent: "bg-gray-800 border-gray-700",
                }}
              >
                {hariOptions.map((hari) => (
                  <SelectItem key={hari.value} className="text-gray-200">
                    {hari.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Rentang Waktu</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  label="Dari Jam"
                  value={filters.timeRange?.start || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    timeRange: {
                      ...filters.timeRange,
                      start: e.target.value,
                      end: filters.timeRange?.end || ''
                    }
                  })}
                  classNames={{
                    input: "bg-gray-900/50 text-gray-200",
                    inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                    label: "text-gray-300",
                  }}
                />
                <Input
                  type="time"
                  label="Sampai Jam"
                  value={filters.timeRange?.end || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    timeRange: {
                      ...filters.timeRange,
                      start: filters.timeRange?.start || '',
                      end: e.target.value
                    }
                  })}
                  classNames={{
                    input: "bg-gray-900/50 text-gray-200",
                    inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                    label: "text-gray-300",
                  }}
                />
              </div>
            </div>

            {/* Created By */}
            <div className="md:col-span-2">
              <Input
                label="Dibuat Oleh (nama)"
                placeholder="Cari berdasarkan nama pembuat..."
                value={filters.createdBy || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  createdBy: e.target.value
                })}
                classNames={{
                  input: "bg-gray-900/50 text-gray-200",
                  inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500",
                  label: "text-gray-300",
                }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="danger" 
            variant="flat" 
            onPress={handleReset}
            className="bg-red-900/20 text-red-400 hover:bg-red-900/30"
          >
            Reset
          </Button>
          <Button 
            color="default" 
            variant="flat" 
            onPress={onClose}
            className="bg-gray-700/50 text-gray-200 hover:bg-gray-700/70"
          >
            Batal
          </Button>
          <Button 
            color="primary" 
            onPress={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Terapkan Filter
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
