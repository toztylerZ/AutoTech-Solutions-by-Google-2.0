import React, { useState } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore } from '../../store/adminStore';
import GarageBookingSummary from '../../components/admin/GarageBookingSummary';
import AppointmentSidebarDetails from '../../components/admin/AppointmentSidebarDetails';
import NewAppointmentSidebar from '../../components/admin/NewAppointmentSidebar';
import AccountSidebarDetails from '../../components/admin/AccountSidebarDetails';
import NewAccountSidebar from '../../components/admin/NewAccountSidebar';
import SearchSidebar from '../../components/admin/SearchSidebar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { 
    selectedDate, 
    endDate, 
    activeService, 
    selectedAppointment, 
    setSelectedAppointment, 
    isDetailsExpanded, 
    setIsDetailsExpanded,
    isNewAppointmentExpanded,
    setIsNewAppointmentExpanded,
    isSearchExpanded,
    setIsSearchExpanded
  } = useAdminStore();

  const user = useAuthStore(state => state.user);

  React.useEffect(() => {
    if (user?.role === 'работник') {
      navigate('/staff/view');
    }
  }, [user, navigate]);

  const isAccounts = location.pathname === '/admin/accounts';

  const lastSelectedId = React.useRef<string | null>(null);
  const isAnySidebarOpen = isNewAppointmentExpanded || (selectedAppointment && isDetailsExpanded) || (!isAccounts && isSearchExpanded);
  const wasAnySidebarOpen = React.useRef(isAnySidebarOpen);
  const [isSwitching, setIsSwitching] = useState(false);

  React.useEffect(() => {
    const appId = selectedAppointment?.id || selectedAppointment?.orderId;
    if (selectedAppointment && appId !== lastSelectedId.current) {
      setIsDetailsExpanded(true);
      lastSelectedId.current = appId;
    } else if (!selectedAppointment) {
      lastSelectedId.current = null;
    }
  }, [selectedAppointment, setIsDetailsExpanded]);

  React.useEffect(() => {
    const nowOpen = isNewAppointmentExpanded || (selectedAppointment && isDetailsExpanded) || (!isAccounts && isSearchExpanded);
    
    // Check if we are switching between different sidebars
    const currentlyOpen = [
      isNewAppointmentExpanded,
      (selectedAppointment && isDetailsExpanded),
      (!isAccounts && isSearchExpanded)
    ].filter(Boolean).length;

    if (wasAnySidebarOpen.current && nowOpen && currentlyOpen === 1) {
      // Logic for detecting a switch: 
      // If was open, is now open, and we just turned one on while turning others off
      // This is slightly complex with individual state updates.
      // We'll trust the fast consecutive updates.
      
      setIsSwitching(true);
      const timer = setTimeout(() => setIsSwitching(false), 100);
      return () => clearTimeout(timer);
    }
    wasAnySidebarOpen.current = nowOpen;
  }, [isNewAppointmentExpanded, isDetailsExpanded, isSearchExpanded, selectedAppointment, isAccounts]);

  const garageFilterMap: Record<string, string | undefined> = {
    'General': undefined,
    'Repair': 'Слесарный ремонт и ТО',
    'Diagnostic': 'Электрика и диагностика',
    'Detailing': 'Детейлинг и покрытия'
  };

  return (
    <div className="flex h-full bg-black text-white gap-2 overflow-hidden">
      {/* Left Sidebar - Summary */}
      <aside
        className="w-[280px] flex-shrink-0 bg-graphite-light border-r border-white/5 h-full overflow-hidden flex flex-col z-40"
      >
        <div className="flex-grow overflow-hidden flex flex-col">
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
              <GarageBookingSummary 
                date={selectedDate} 
                endDate={endDate}
                garageFilter={garageFilterMap[activeService]} 
                isSidebar={true}
                isAccountsPage={isAccounts}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow pt-2 pb-0 bg-[#050505] overflow-hidden relative flex flex-col">
        <div className="w-full h-full min-h-0 flex-grow">
          <Outlet />
        </div>
      </main>

      {/* Sidebars */}
      <AnimatePresence mode={isSwitching ? "popLayout" : "wait"}>
        {!isAccounts && isSearchExpanded ? (
          <motion.aside
            key="search-sidebar"
            initial={isSwitching ? { x: 0 } : { x: -310 }}
            animate={{ x: 0 }}
            exit={isSwitching ? { x: 0 } : { x: -310 }}
            transition={isSwitching ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 z-50 w-[310px] bg-graphite-light border-r border-white/10 shadow-2xl flex flex-col rounded-r-3xl"
            style={{ 
              top: '110px', 
              height: 'calc(100vh - 110px)' 
            }}
          >
            <div className="flex-grow overflow-hidden relative z-[1]">
              <SearchSidebar />
            </div>
          </motion.aside>
        ) : isNewAppointmentExpanded ? (
          <motion.aside
            key="new-sidebar"
            initial={isSwitching ? { x: 0 } : { x: -310 }}
            animate={{ x: 0 }}
            exit={isSwitching ? { x: 0 } : { x: -310 }}
            transition={isSwitching ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 z-50 w-[310px] bg-graphite-light border-r border-white/10 shadow-2xl flex flex-col rounded-r-3xl"
            style={{ 
              top: '110px', 
              height: 'calc(100vh - 110px)' 
            }}
          >
            <div className="flex-grow overflow-hidden">
              {isAccounts ? <NewAccountSidebar /> : <NewAppointmentSidebar />}
            </div>
          </motion.aside>
        ) : (selectedAppointment && isDetailsExpanded) ? (
          <motion.aside
            key="details-sidebar"
            initial={isSwitching ? { x: 0 } : { x: -310 }}
            animate={{ x: 0 }}
            exit={isSwitching ? { x: 0 } : { x: -310 }}
            transition={isSwitching ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 z-50 w-[310px] bg-graphite-light border-r border-white/10 shadow-2xl flex flex-col rounded-r-3xl"
            style={{ 
              top: '110px', 
              height: 'calc(100vh - 110px)' 
            }}
          >
            <div className="flex-grow overflow-hidden">
              {isAccounts ? (
                <AccountSidebarDetails member={selectedAppointment} />
              ) : (
                <AppointmentSidebarDetails appointment={selectedAppointment} />
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Unified Sidebar Toggles */}
      <div 
        className={`fixed left-0 bottom-10 flex flex-col-reverse items-start z-[60] transition-transform duration-300 ${
          isAnySidebarOpen ? 'translate-x-[310px]' : 'translate-x-0'
        }`}
      >
        {/* Container for Selected Appointment Toggle */}
        <div className="h-64 w-5 flex flex-col justify-end">
          {selectedAppointment && (
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className={`w-full h-full border border-l-0 rounded-r-2xl flex items-center justify-center transition-all shadow-[5px_0_15px_rgba(0,0,0,0.5)] group overflow-hidden ${
                isDetailsExpanded 
                  ? 'bg-[#bc6419]/90 border-[#ff8c00] text-accent-orange shadow-[inset_0_0_25px_rgba(255,140,0,0.7),inset_0_0_10px_rgba(255,140,0,0.5)]' 
                  : 'bg-[#4a4138]/80 border-[#bc6419] text-white hover:bg-[#5a5148]/90'
              }`}
            >
              <div className={`rotate-90 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${
                isDetailsExpanded ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:text-accent-orange'
              }`}>
                 {isAccounts ? 'Выбранный аккаунт' : 'Выбранная заявка'} <ChevronRight className={`transition-transform duration-300 ${isDetailsExpanded ? 'rotate-90' : '-rotate-90'} w-3 h-3`} />
              </div>
            </button>
          )}
        </div>

        {/* Container for New Record Toggle - Always rendered to maintain vertical position */}
        <div className="h-64 w-5 -mb-1 relative z-10">
          <button
            onClick={() => setIsNewAppointmentExpanded(!isNewAppointmentExpanded)}
            className={`w-full h-full border border-l-0 rounded-r-2xl flex items-center justify-center transition-all shadow-[5px_0_15px_rgba(0,0,0,0.5)] group overflow-hidden ${
              isNewAppointmentExpanded 
                ? 'bg-[#bc6419]/90 border-[#ff8c00] text-accent-orange shadow-[inset_0_0_25px_rgba(255,140,0,0.7),inset_0_0_10px_rgba(255,140,0,0.5)]' 
                : 'bg-[#4a4138]/80 border-[#bc6419] text-white hover:bg-[#5a5148]/90'
            }`}
          >
            <div className={`rotate-90 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${
              isNewAppointmentExpanded ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:text-accent-orange'
            }`}>
               {isAccounts ? 'Новый аккаунт' : 'новая запись'} <ChevronRight className={`transition-transform duration-300 ${isNewAppointmentExpanded ? 'rotate-90' : '-rotate-90'} w-3 h-3`} />
            </div>
          </button>
        </div>

        {/* Container for Search Toggle */}
        {!isAccounts && (
          <div className="h-20 w-5 -mb-1 relative z-20">
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className={`w-full h-full border border-l-0 rounded-r-2xl flex items-center justify-center transition-all shadow-[5px_0_15px_rgba(0,0,0,0.5)] group overflow-hidden ${
                isSearchExpanded 
                  ? 'bg-[#bc6419]/90 border-[#ff8c00] text-accent-orange shadow-[inset_0_0_25px_rgba(255,140,0,0.7),inset_0_0_10px_rgba(255,140,0,0.5)]' 
                  : 'bg-[#4a4138]/80 border-[#bc6419] text-white hover:bg-[#5a5148]/90'
              }`}
            >
              <div className={`transition-colors ${
                isSearchExpanded ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:text-accent-orange'
              }`}>
                 <Search className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
