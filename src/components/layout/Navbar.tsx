import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Menu, 
  X, 
  LayoutDashboard, 
  ChevronDown,
  Calendar,
  BarChart3,
  Table,
  Users,
  Bot,
  Activity,
  Wrench,
  Car,
  Hammer,
  Zap,
  Sparkles,
  LayoutGrid,
  List,
  AlertTriangle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore, type ServiceType, type ViewType } from '../../store/adminStore';
import CompactCalendar from '../admin/CompactCalendar';

const navLinks = [
  { name: 'Главная', href: '/' },
  { name: 'Услуги', href: '/services' },
  { name: 'О компании', href: '/about' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Контакты', href: '/contacts' },
];

const services = [
  { id: 'General', label: 'Все', fullLabel: 'Все записи', icon: LayoutDashboard },
  { id: 'Repair', label: 'Слесарный', fullLabel: 'Слесарный ремонт и ТО', icon: Hammer },
  { id: 'Diagnostic', label: 'Электрика', fullLabel: 'Электрика и диагностика', icon: Zap },
  { id: 'Detailing', label: 'Детейлинг', fullLabel: 'Детейлинг и покрытия', icon: Sparkles },
];

const isPending = (app: any) => {
  const status = (app.status || "").toUpperCase();
  if (status === 'NEW' || status === 'RAW' || status === 'COMPLETED') return true;
  
  if (status === 'CONFIRMED') {
    const now = new Date();
    let appDateStr = app.date;
    if (appDateStr && appDateStr.includes('.')) {
      const [d, m, y] = appDateStr.split('.');
      appDateStr = `${y}-${m}-${d}`;
    }
    const appDate = new Date(appDateStr);
    const [h, m] = (app.time || "00:00").split(':').map(Number);
    appDate.setHours(h, m, 0, 0);
    
    const duration = Number(app.duration) || 1;
    const endTimestamp = appDate.getTime() + duration * 60 * 60 * 1000;
    return now.getTime() > endTimestamp;
  }
  return false;
};

const adminDropdownLinks = [
  { 
    group: 'РАСПИСАНИЕ', 
    items: [
      { name: 'Все записи', href: '/admin', icon: Calendar },
    ]
  },
  { 
    group: 'СТАТИСТИКА', 
    items: [
      { name: 'Графики', href: '/admin/charts', icon: BarChart3 },
      { 
        name: 'Отчеты', 
        icon: Table,
        subItems: [
          { name: 'Эффективность боксов', href: '/admin/reports/boxes' },
          { name: 'Анализ сайта и ИИ', href: '/admin/reports/ai' },
        ]
      },
    ]
  },
  { 
    group: 'ДАННЫЕ', 
    items: [
      { name: 'Таблицы (Google)', href: '/admin/tables', icon: Table },
    ]
  },
  { 
    group: 'НАСТРОЙКИ', 
    items: [
      { name: 'Аккаунты', href: '/admin/accounts', icon: Users },
      { name: 'Агенты (Промпты)', href: '/admin/agents', icon: Bot },
    ]
  }
];

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const isAdmin = location.pathname.startsWith('/admin');
  
  const { 
    selectedDate, 
    setSelectedDate, 
    endDate,
    setEndDate,
    activeService, 
    setActiveService,
    activeView,
    setActiveView,
    activeBox,
    setActiveBox,
    activeStatus,
    setActiveStatus,
    pendingFilter,
    setPendingFilter,
    hasDoneInitialRedirect,
    setHasDoneInitialRedirect,
    isSidebarOpen,
    setIsSidebarOpen
  } = useAdminStore();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [allPendingAppointments, setAllPendingAppointments] = useState<any[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ru-RU', { hour12: false, timeZone: 'Europe/Moscow' }));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit',
    timeZone: 'Europe/Moscow'
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ru-RU', { hour12: false, timeZone: 'Europe/Moscow' }));
      setCurrentDate(now.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit',
        timeZone: 'Europe/Moscow'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchApps = async (isInitial = false) => {
      try {
        let url = `/api/admin/appointments?date=${selectedDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        
        const [res, pendingRes] = await Promise.all([
          fetch(url),
          fetch(`/api/admin/appointments?date=2000-01-01&endDate=2099-12-31`)
        ]);

        if (res.ok && pendingRes.ok) {
          const data = await res.json();
          const pendingData = await pendingRes.json();
          setAppointments(data);
          const filteredPending = pendingData.filter(isPending);
          setAllPendingAppointments(filteredPending);
          setTotalPendingCount(filteredPending.length);
          
          if (isInitial && !hasDoneInitialRedirect) {
            setHasDoneInitialRedirect(true);
            if (filteredPending.length > 0) {
              setActiveService('General');
              setPendingFilter('all');
              setActiveStatus('Все');
            } else {
              setPendingFilter(null);
              setActiveService('General');
            }
          }
        }
      } catch (err) {
        console.error('Navbar fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps(true);
    const interval = setInterval(() => fetchApps(false), 30000); // Polling every 30s for navbar counts is fine
    return () => clearInterval(interval);
  }, [selectedDate, endDate, isAdmin, hasDoneInitialRedirect]);

  const getServiceCount = (id: string, fullLabel: string) => {
    if (id === 'General') return appointments.length;
    return appointments.filter(a => a.garage === fullLabel).length;
  };

  const getBoxCount = (boxName: string) => {
    const currentServiceLabel = services.find(s => s.id === activeService)?.fullLabel;
    let filtered = appointments;
    if (activeService !== 'General') {
      filtered = filtered.filter(a => a.garage === currentServiceLabel);
    }
    if (boxName === 'Все') return filtered.length;
    return filtered.filter(a => a.box === boxName).length;
  };

  const getBoxDuration = (boxName: string) => {
    const currentServiceLabel = services.find(s => s.id === activeService)?.fullLabel;
    let filtered = appointments;
    if (activeService !== 'General') {
      filtered = filtered.filter(a => a.garage === currentServiceLabel);
    }
    const relevantAppointments = boxName === 'Все' 
      ? filtered 
      : filtered.filter(a => a.box === boxName);
    
    return relevantAppointments.reduce((sum, a) => sum + (Number(a.duration) || 0), 0);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9000] bg-graphite/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isAdmin ? 'py-2 min-h-[5rem]' : 'h-20'}`}>
          <div className="flex flex-col shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-accent-orange rounded flex items-center justify-center transition-transform group-hover:rotate-12">
                <Settings className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-display font-bold tracking-tighter text-white whitespace-nowrap">
                AUTOTECH <span className="text-accent-orange">SOLUTIONS</span>
              </span>
            </Link>
            {isAdmin && (
              <div className="mt-1 ml-10 flex flex-col items-start relative z-[9001]">
                <CompactCalendar 
                  selectedDate={selectedDate} 
                  endDate={endDate}
                  onRangeChange={(start, end) => {
                    setSelectedDate(start);
                    setEndDate(end);
                  }}
                />
                <div className="flex flex-col items-center ml-2 w-full max-w-[120px]">
                  <div 
                    className="mt-1.5 font-black tracking-[0.2em]"
                    style={{ 
                      color: '#a09292', 
                      fontStyle: 'italic', 
                      fontSize: '11px', 
                      lineHeight: '14px', 
                      fontFamily: 'Courier New' 
                    }}
                  >
                    {currentTime}
                  </div>
                  <div 
                    onClick={() => {
                      const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow', hour12: false });
                      const today = moscowTime.split(',')[0];
                      setSelectedDate(today);
                      setEndDate(null);
                    }}
                    className="cursor-pointer hover:brightness-125 transition-all w-full"
                    style={{ 
                      fontStyle: 'normal',
                      fontWeight: 'normal',
                      textDecorationLine: 'none',
                      fontSize: '10px',
                      textAlign: 'center',
                      color: '#ad9353',
                      lineHeight: '14px',
                      fontFamily: 'Courier New',
                      paddingTop: '3px',
                      marginTop: '0px'
                    }}
                  >
                    {currentDate}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Specific Header Controls */}
          {isAdmin ? (
            <div className="hidden lg:flex flex-col items-start gap-2 flex-grow px-8 py-1">
              {/* Service Selection Tabs */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {/* Unprocessed Applications Button */}
                <button
                  onClick={() => {
                    setActiveService('General');
                    setActiveBox('Все');
                    setActiveView('log');
                    setPendingFilter('all');
                    setActiveStatus('Все');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 h-[33px] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    pendingFilter === 'all'
                      ? 'bg-[#ffbf00]/10 text-[#ffbf00] border-[#ffbf00] shadow-[0_0_15px_rgba(255,191,0,0.1)]' 
                      : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <AlertTriangle 
                    className="w-[18px] h-[18px]" 
                    style={{ color: '#ffbf00' }} 
                  />
                  {!loading && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[12px] font-black transition-colors ${
                      pendingFilter === 'all' ? 'text-black bg-[#ffbf00]' : 'text-[#ffbf00] bg-[#393434]'
                    }`}>
                      {totalPendingCount}
                    </span>
                  )}
                </button>

                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setPendingFilter(null);
                      setActiveService(service.id as ServiceType);
                      setActiveBox('Все');
                      setActiveView('grid');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 h-[33px] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                      activeService === service.id && !pendingFilter
                        ? 'bg-accent-orange/10 text-accent-orange border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                        : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <service.icon className="w-3 h-3" />
                    {service.fullLabel}
                    {!loading && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[12px] font-black border-none transition-colors ${
                        activeService === service.id && !pendingFilter ? 'text-white bg-accent-orange' : 'text-accent-orange bg-[#393434]'
                      }`}>
                        {getServiceCount(service.id, service.fullLabel)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* View & Box Toggles - Fixed height container to prevent layout shifts */}
              <div className="h-8 flex items-center gap-2">
                {pendingFilter === 'all' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1 items-center bg-white/5 p-1 rounded-xl border border-white/5 h-fit">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#eab938]">
                        <AlertTriangle className="w-3 h-3" />
                        НЕОБРАБОТАННЫЕ ЗАПИСИ:
                      </div>
                    </div>

                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {[
                        { label: 'ВСЕ', code: 'Все' }, 
                        { label: 'НОВЫЕ', code: 'Новые' }, 
                        { label: 'ЗАВЕРШЕННЫЕ', code: 'Завершенные' }, 
                        { label: 'ПРОСРОЧЕННЫЕ', code: 'Просроченные' }
                      ].map((filter) => (
                        <button
                          key={filter.code}
                          onClick={() => setActiveStatus(filter.code)}
                          className={`px-3 py-1.5 h-[33px] rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                            (activeStatus || 'Все') === filter.code 
                              ? 'bg-accent-orange/10 text-accent-orange border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                              : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {filter.label}
                          {!loading && (
                            <span className={`px-1.5 rounded text-[12px] font-black border border-white/5 transition-colors ${
                              (activeStatus || 'Все') === filter.code ? 'bg-accent-orange text-white border-transparent' : 'bg-[#393434] text-accent-orange'
                            }`}>
                              {allPendingAppointments.filter(app => {
                                if (filter.code === 'Все') return true;
                                const s = (app.status || "").toUpperCase();
                                if (filter.code === 'Новые') return s === 'NEW' || s === 'RAW';
                                if (filter.code === 'Завершенные') return s === 'COMPLETED';
                                if (filter.code === 'Просроченные') {
                                  if (s !== 'CONFIRMED') return false;
                                  const now = new Date();
                                  let appDateStr = app.date;
                                  if (appDateStr && appDateStr.includes('.')) {
                                    const [d, m, y] = appDateStr.split('.');
                                    appDateStr = `${y}-${m}-${d}`;
                                  }
                                  const appDate = new Date(appDateStr);
                                  const [h, m] = (app.time || "00:00").split(':').map(Number);
                                  appDate.setHours(h, m, 0, 0);
                                  const endTs = appDate.getTime() + (Number(app.duration) || 1) * 60 * 60 * 1000;
                                  return now.getTime() > endTs;
                                }
                                return true;
                              }).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : activeService !== 'General' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5 h-fit">
                      <button
                        onClick={() => setActiveView('log')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 h-[33px] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          activeView === 'log' 
                            ? 'bg-accent-orange/10 text-accent-orange border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                            : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <List className="w-3 h-3" />
                        Журнал записей
                      </button>
                      <button
                        onClick={() => setActiveView('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 h-[33px] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          activeView === 'grid' 
                            ? 'bg-accent-orange/10 text-accent-orange border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                            : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                        График
                      </button>
                    </div>

                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {['Все', 'Бокс А', 'Бокс Б', 'Бокс В'].map((box) => (
                        <button
                          key={box}
                          onClick={() => setActiveBox(box)}
                          className={`px-3 py-1.5 h-[33px] rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                            activeBox === box 
                              ? 'bg-accent-orange/10 text-accent-orange border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                              : 'text-gray-400 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {box}
                          {!loading && (
                            <div className="flex items-center gap-1">
                              {box !== 'Все' ? (
                                <>
                                  <span className={`px-1.5 rounded text-[12px] font-black border border-white/5 transition-colors ${
                                    activeBox === box ? 'bg-accent-orange text-white border-transparent' : 'bg-[#393434] text-accent-orange'
                                  }`}>
                                    {getBoxCount(box)}
                                  </span>
                                  <span className={`text-[10px] font-bold italic lowercase opacity-60 ${activeBox === box ? 'text-white' : 'text-gray-400'}`}>
                                    &nbsp; {getBoxDuration(box)} ч
                                  </span>
                                </>
                              ) : null}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Placeholder when General is active to maintain height and position */
                  <div className="flex gap-1 items-center bg-white/5 p-1 rounded-xl border border-white/5 h-fit">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                      <List className="w-3 h-3" />
                      Журнал записей
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Desktop Site Nav */
            <div className="hidden md:flex items-center gap-8">
              {isAuthenticated && (
                <div 
                  className="relative group/admin"
                  onMouseEnter={() => setIsSubmenuOpen(true)}
                  onMouseLeave={() => setIsSubmenuOpen(false)}
                >
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-accent-orange py-7 ${
                      location.pathname.startsWith('/admin') ? 'text-accent-orange' : 'text-white'
                    }`}
                  >
                    Администрирование
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  <AnimatePresence>
                    {isSubmenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 w-72 bg-graphite-light border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-3 backdrop-blur-xl"
                      >
                        <div className="space-y-4">
                          {adminDropdownLinks.map((group) => (
                            <div key={group.group}>
                              <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">
                                {group.group}
                              </div>
                              <div className="space-y-1">
                                {group.items.map((item) => (
                                  <div key={item.name}>
                                    {item.href ? (
                                      <Link
                                        to={item.href}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group/item"
                                      >
                                        <item.icon className="w-4 h-4 group-hover/item:text-accent-orange transition-colors" />
                                        <span className="text-xs font-bold">{item.name}</span>
                                      </Link>
                                    ) : (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-3 px-3 py-2 text-gray-400">
                                          <item.icon className="w-4 h-4" />
                                          <span className="text-xs font-bold">{item.name}</span>
                                        </div>
                                        <div className="ml-7 border-l border-white/5 space-y-1">
                                          {item.subItems?.map((sub) => (
                                            <Link
                                              key={sub.name}
                                              to={sub.href}
                                              className="block px-4 py-1.5 text-[11px] text-gray-500 hover:text-white transition-colors"
                                            >
                                              {sub.name}
                                            </Link>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <button
                            onClick={() => useAuthStore.getState().logout()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group/logout"
                          >
                            <Settings className="w-4 h-4 group-hover/logout:rotate-90 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Выход из системы</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`text-sm font-medium transition-colors hover:text-accent-orange ${
                      isActive ? 'text-accent-orange' : 'text-gray-400'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="h-px bg-accent-orange mt-1"
                      />
                    )}
                  </Link>
                );
              })}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                className="px-6 py-2 bg-accent-orange hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 neon-glow-orange"
              >
                ЗАПИСАТЬСЯ
              </button>
            </div>
          )}

          {/* Desktop/Mobile Right Actions for Admin */}
          {isAdmin && (
             <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </button>
             </div>
          )}

          {/* Mobile Menu Toggle */}
          {!isAdmin && (
            <button
              className="md:hidden text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-graphite-light border-b border-white/10 p-4"
        >
          {isAdmin ? (
             <div className="flex flex-col gap-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">Навигация</div>
                {adminDropdownLinks.map(group => group.items.map(item => (
                   <Link key={item.name} to={item.href || '#'} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-white">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span className="text-sm font-bold">{item.name}</span>
                   </Link>
                )))}
                <button
                  onClick={() => useAuthStore.getState().logout()}
                  className="mt-4 w-full py-3 bg-red-500/10 text-red-500 rounded-lg font-bold"
                >
                  ВЫЙТИ
                </button>
             </div>
          ) : (
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium ${
                    location.pathname === link.href ? 'text-accent-orange' : 'text-gray-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('open-booking-modal'));
                }}
                className="w-full py-3 bg-accent-orange text-center rounded-lg font-bold"
              >
                ЗАПИСАТЬСЯ
              </button>
            </div>
          )}
        </motion.div>
      )}
    </nav>
  );
}
