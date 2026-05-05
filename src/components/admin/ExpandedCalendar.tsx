import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpandedCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function ExpandedCalendar({ selectedDate, onDateChange }: ExpandedCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = [];
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const startDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  // Russian month names
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Week days starting from Monday
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Adjust start day (JS 0 is Sunday, we want 0 to be Monday)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  // Fill in empty slots from previous month
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push(null);
  }

  // Fill in actual days
  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  const isSelected = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}` === selectedDate;
  };

  const isUnavailable = (day: number) => {
    return false;
  };

  const isToday = (day: number) => {
    const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow', hour12: false });
    const [y, m, d] = moscowTime.split(',')[0].split('-').map(Number);
    return d === day && 
           (m - 1) === currentMonth.getMonth() && 
           y === currentMonth.getFullYear();
  };

  return (
    <div className="bg-black/40 p-6 rounded-3xl border border-white/10 w-full max-w-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-accent-orange"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-accent-orange"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-center text-[10px] font-black text-gray-600 uppercase">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div key={idx} className="aspect-square flex items-center justify-center">
            {day && (
              <button
                disabled={isUnavailable(day)}
                onClick={() => {
                  if (isUnavailable(day)) return;
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  // Adjust for timezone to get correct YYYY-MM-DD
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(d.getDate()).padStart(2, '0');
                  onDateChange(`${year}-${month}-${dayStr}`);
                }}
                className={`
                  w-8 h-8 rounded-xl text-[11px] font-bold transition-all
                  ${isUnavailable(day) 
                    ? 'text-gray-800 cursor-not-allowed opacity-30'
                    : isSelected(day) 
                      ? 'bg-accent-orange text-white shadow-[0_0_15px_rgba(255,107,0,0.4)] scale-110' 
                      : isToday(day)
                        ? 'bg-white/10 text-accent-orange border border-accent-orange/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
