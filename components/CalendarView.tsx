import React, { useState, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

interface CalendarViewProps {
  jadwalData: any[];
  onDateClick: (date: string) => void;
  selectedDate?: string;
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CalendarView({ jadwalData, onDateClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Group jadwal by date
  const jadwalByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    jadwalData.forEach(jadwal => {
      const dateKey = jadwal.tanggal;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(jadwal);
    });
    return grouped;
  }, [jadwalData]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDateKey = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'belum_mulai': return 'default';
      case 'berlangsung': return 'primary';
      case 'selesai': return 'success';
      case 'dibatalkan': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
      <CardHeader className="flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigateMonth('prev')}
            className="bg-gray-700/50 text-gray-200"
          >
            ←
          </Button>
          <h3 className="text-lg font-semibold text-white">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigateMonth('next')}
            className="bg-gray-700/50 text-gray-200"
          >
            →
          </Button>
        </div>
        <Button
          size="sm"
          variant="flat"
          onPress={() => setCurrentDate(new Date())}
          className="bg-blue-600/20 text-blue-400"
        >
          Hari Ini
        </Button>
      </CardHeader>
      
      <CardBody className="p-0">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {/* Day headers */}
          {DAYS.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-400 border-b border-gray-700">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dateKey = day ? formatDateKey(day) : null;
            const dayJadwal = dateKey ? jadwalByDate[dateKey] : [];
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === currentMonth && 
              new Date().getFullYear() === currentYear;
            const isSelected = dateKey === selectedDate;
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border-b border-r border-gray-700 cursor-pointer transition-colors
                  ${day ? 'hover:bg-gray-700/30' : ''}
                  ${isToday ? 'bg-blue-900/30' : ''}
                  ${isSelected ? 'bg-blue-800/50' : ''}
                `}
                onClick={() => day && dateKey && onDateClick(dateKey)}
              >
                {day && (
                  <>
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-sm mb-1
                      ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-300'}
                    `}>
                      {day}
                    </div>
                    
                    {/* Jadwal indicators */}
                    <div className="space-y-1">
                      {dayJadwal.slice(0, 3).map((jadwal, idx) => (
                        <div key={idx} className="text-xs">
                          <Chip
                            size="sm"
                            color={getStatusColor(jadwal.status)}
                            variant="flat"
                            className="w-full text-xs"
                          >
                            <div className="truncate">
                              {jadwal.jam_mulai.slice(0, 5)} {jadwal.nama_topik}
                            </div>
                          </Chip>
                        </div>
                      ))}
                      {dayJadwal.length > 3 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{dayJadwal.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
