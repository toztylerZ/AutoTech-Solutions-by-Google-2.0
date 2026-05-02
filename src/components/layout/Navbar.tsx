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
  List
} from 'lucide-react';
import { useState } from 'react';
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
  { id: 'General', label: 'Общее', fullLabel: 'Общее расписание', icon: LayoutDashboard },
  { id: 'Repair', label: 'Слесарный', fullLabel: 'Слесарный ремонт и ТО', icon: Hammer },
  { id: 'Diagnostic', label: 'Электрика', fullLabel: 'Электрика и диагностика', icon: Zap },
  { id: 'Detailing', label: 'Детейлинг', fullLabel: 'Детейлинг и покрытия', icon: Sparkles },
];

const adminDropdownLinks = [
  { 
    group: 'РАСПИСАНИЕ', 
    items: [
      { name: 'Общее расписание', href: '/admin', icon: Calendar },
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
    isSidebarOpen,
    setIsSidebarOpen
  } = useAdminStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-graphite/80 backdrop-blur-xl border-b border-white/5">
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
              <div className="mt-1 ml-10">
                <CompactCalendar 
                  selectedDate={selectedDate} 
                  endDate={endDate}
                  onRangeChange={(start, end) => {
                    setSelectedDate(start);
                    setEndDate(end);
                  }}
                />
              </div>
            )}
          </div>

          {/* Admin Specific Header Controls */}
          {isAdmin ? (
            <div className="hidden lg:flex flex-col items-start gap-2 flex-grow px-8 py-1">
              {/* Service Selection Tabs */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setActiveService(service.id as ServiceType);
                      setActiveBox('Все');
                      setActiveView('log');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeService === service.id 
                        ? 'bg-white text-accent-orange shadow-lg hover:bg-accent-orange hover:text-white' 
                        : 'text-white bg-white/5 hover:text-gray-500 hover:bg-transparent'
                    }`}
                  >
                    <service.icon className="w-3 h-3" />
                    {service.fullLabel}
                  </button>
                ))}
              </div>

              {/* View & Box Toggles - Fixed height container to prevent layout shifts */}
              <div className="h-8 flex items-center gap-2">
                {activeService !== 'General' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5 h-fit">
                      <button
                        onClick={() => setActiveView('log')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeView === 'log' 
                            ? 'bg-white text-blue-600 shadow-md hover:bg-blue-600 hover:text-white' 
                            : 'text-white bg-white/5 hover:text-gray-500 hover:bg-transparent'
                        }`}
                      >
                        <List className="w-3 h-3" />
                        Журнал записей
                      </button>
                      <button
                        onClick={() => setActiveView('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeView === 'grid' 
                            ? 'bg-white text-blue-600 shadow-md hover:bg-blue-600 hover:text-white' 
                            : 'text-white bg-white/5 hover:text-gray-500 hover:bg-transparent'
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                        График
                      </button>
                    </div>

                    {activeView === 'log' && (
                      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        {['Все', 'Бокс А', 'Бокс Б', 'Бокс В'].map((box) => (
                          <button
                            key={box}
                            onClick={() => setActiveBox(box)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                              activeBox === box 
                                ? 'bg-white text-gray-900 border border-white shadow-md' 
                                : 'text-white bg-white/5 hover:text-gray-600 hover:bg-transparent'
                            }`}
                          >
                            {box}
                          </button>
                        ))}
                      </div>
                    )}
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
