import React from 'react';
import { useAdminStore } from '../../store/adminStore';
import AppointmentTable from '../../components/admin/AppointmentTable';
import ScheduleGrid from '../../components/admin/ScheduleGrid';

export default function AdminDashboard() {
  const { 
    selectedDate, 
    endDate,
    activeService,
    activeView,
    activeBox
  } = useAdminStore();

  const services = [
    { id: 'General', label: 'Общее расписание', icon: 'LayoutDashboard' },
    { id: 'Repair', label: 'Слесарный ремонт и ТО', fullLabel: 'Слесарный ремонт и ТО', icon: 'Hammer' },
    { id: 'Diagnostic', label: 'Электрика и диагностика', fullLabel: 'Электрика и диагностика', icon: 'Zap' },
    { id: 'Detailing', label: 'Детейлинг и покрытия', fullLabel: 'Детейлинг и покрытия', icon: 'Sparkles' },
  ];

  const currentService = services.find(s => s.id === activeService);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="transition-all duration-300">
        {activeService === 'General' ? (
          <AppointmentTable date={selectedDate} endDate={endDate} boxFilter={activeBox} />
        ) : activeView === 'grid' ? (
          <ScheduleGrid garage={currentService?.fullLabel as string} date={selectedDate} endDate={endDate} boxFilter={activeBox} />
        ) : (
          <AppointmentTable date={selectedDate} endDate={endDate} garageFilter={currentService?.fullLabel} boxFilter={activeBox} />
        )}
      </div>
    </div>
  );
}
