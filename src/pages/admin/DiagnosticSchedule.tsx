import React, { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import ScheduleGrid from '../../components/admin/ScheduleGrid';
import AppointmentTable from '../../components/admin/AppointmentTable';
import ExpandedCalendar from '../../components/admin/ExpandedCalendar';
import GarageBookingSummary from '../../components/admin/GarageBookingSummary';

export default function DiagnosticSchedule() {
  const [activeTab, setActiveTab] = useState<'grid' | 'log'>('grid');
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('admin_selected_date');
    if (saved) return saved;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    localStorage.setItem('admin_selected_date', selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-graphite-light p-8 rounded-3xl border border-white/5 h-full flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Электрика и диагностика</h1>
            <p className="text-gray-400 text-lg">Управление боксами диагностического цеха</p>
            <GarageBookingSummary date={selectedDate} garageFilter="Электрика и диагностика" />
          </div>
        </div>
        <div>
          <ExpandedCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      <div className="flex gap-1 bg-black/40 p-1 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'grid' 
              ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          График
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'log' 
              ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Журнал
        </button>
      </div>

      {activeTab === 'grid' ? (
        <ScheduleGrid garage="Электрика и диагностика" date={selectedDate} />
      ) : (
        <AppointmentTable date={selectedDate} garageFilter="Электрика и диагностика" />
      )}
    </div>
  );
}
