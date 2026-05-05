import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Activity 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore } from '../../store/adminStore';
import GarageBookingSummary from '../../components/admin/GarageBookingSummary';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { selectedDate, endDate, activeService, isSidebarOpen, setIsSidebarOpen } = useAdminStore();

  const garageFilterMap: Record<string, string | undefined> = {
    'General': undefined,
    'Repair': 'Слесарный ремонт и ТО',
    'Diagnostic': 'Электрика и диагностика',
    'Detailing': 'Детейлинг и покрытия'
  };

  return (
    <div className="flex min-h-screen bg-black text-white gap-2">
      {/* Dynamic Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-graphite-light border-r border-white/5 h-[calc(100vh-80px)] sticky top-0 z-40 overflow-hidden flex flex-col"
      >
        <div className="flex-grow overflow-hidden flex flex-col">
          {isSidebarOpen ? (
            <div className="flex flex-col pt-4">
              <div className="flex-grow">
                <GarageBookingSummary 
                  date={selectedDate} 
                  endDate={endDate}
                  garageFilter={garageFilterMap[activeService]} 
                  isSidebar={true}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-6">
              <Activity className="w-6 h-6 text-gray-500" />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-grow pt-2 pb-0 bg-[#050505]">
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>

      {/* Collapse/Expand Floating Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-8 left-8 w-12 h-12 bg-graphite-light border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-accent-orange transition-all z-50 shadow-xl"
      >
        {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>
    </div>
  );
}
