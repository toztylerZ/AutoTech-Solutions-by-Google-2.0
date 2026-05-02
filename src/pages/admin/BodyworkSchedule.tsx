import React, { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import ScheduleGrid from '../../components/admin/ScheduleGrid';
import AppointmentTable from '../../components/admin/AppointmentTable';
import ExpandedCalendar from '../../components/admin/ExpandedCalendar';
import GarageBookingSummary from '../../components/admin/GarageBookingSummary';

export default function BodyworkSchedule() {
  const [activeTab, setActiveTab ] = useState<'grid' | 'log'>('log');
  const { selectedDate, setSelectedDate, activeBox } = useAdminStore();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-graphite-light p-8 rounded-3xl border border-white/5 h-full flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Детейлинг и покрытия</h1>
            <p className="text-gray-400 text-lg">Управление боксами цеха кузовного ремонта</p>
            <GarageBookingSummary date={selectedDate} garageFilter="Детейлинг и покрытия" />
          </div>
        </div>
        <div>
          <ExpandedCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      <div className="flex gap-1 bg-black/40 p-1 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'log' 
              ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Журнал записей
        </button>
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
      </div>

      {activeTab === 'grid' ? (
        <ScheduleGrid garage="Детейлинг и покрытия" date={selectedDate} boxFilter={activeBox} />
      ) : (
        <AppointmentTable date={selectedDate} garageFilter="Детейлинг и покрытия" boxFilter={activeBox} />
      )}
    </div>
  );
}
