import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CompactCalendarProps {
  selectedDate: string;
  endDate: string | null;
  onRangeChange: (start: string, end: string | null) => void;
}

export default function CompactCalendar({ selectedDate, endDate, onRangeChange }: CompactCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const startDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const days = [];
  for (let i = 0; i < adjustedStartDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  const formatDateLabel = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formattedLabel = endDate 
    ? `${formatDateLabel(selectedDate)} - ${formatDateLabel(endDate)}`
    : new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  const isDateInRange = (dateStr: string) => {
    if (!endDate) return dateStr === selectedDate;
    return dateStr >= selectedDate && dateStr <= endDate;
  };

  const handleDateClick = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const clickedDate = `${year}-${month}-${dayStr}`;

    if (!endDate && clickedDate > selectedDate) {
      onRangeChange(selectedDate, clickedDate);
    } else if (clickedDate === selectedDate && !endDate) {
      // Toggle off? Or just keep it. Let's say keep it.
      onRangeChange(clickedDate, null);
    } else {
      onRangeChange(clickedDate, null);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[11px] font-bold text-accent-orange hover:text-gray-500 transition-colors uppercase tracking-wider"
      >
        <CalendarIcon className="w-3 h-3" />
        {formattedLabel}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-4 z-[70] bg-graphite-light border border-white/10 rounded-2xl shadow-2xl p-4 w-64 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <div className="flex gap-1">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(wd => (
                  <div key={wd} className="text-center text-[9px] font-black text-gray-600 uppercase">{wd}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (!day) return <div key={idx} className="aspect-square" />;
                  
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === selectedDate;
                  const isEnd = dateStr === endDate;
                  const inRange = isDateInRange(dateStr);

                  return (
                    <div key={idx} className="aspect-square flex items-center justify-center relative">
                      {inRange && endDate && (
                        <div className={`absolute inset-y-1 ${isSelected ? 'left-1/2 right-0' : isEnd ? 'left-0 right-1/2' : 'inset-x-0'} bg-accent-orange/20`} />
                      )}
                      <button
                        onClick={() => handleDateClick(day)}
                        className={`relative z-10 w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                          isSelected || isEnd
                            ? 'bg-white text-accent-orange hover:bg-accent-orange hover:text-white'
                            : inRange
                              ? 'text-white bg-accent-orange/40'
                              : 'text-white bg-white/5 hover:text-gray-400 hover:bg-transparent'
                        }`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {endDate && (
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                   <button 
                     onClick={() => {
                       onRangeChange(selectedDate, null);
                       setIsOpen(false);
                     }}
                     className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-wider"
                   >
                     Сбросить период
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
