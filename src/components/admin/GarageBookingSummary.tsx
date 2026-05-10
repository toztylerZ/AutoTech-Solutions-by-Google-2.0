import React, { useState, useEffect } from 'react';
import { useAdminStore, ServiceType } from '../../store/adminStore';
import { AlertTriangle } from 'lucide-react';

interface GarageBookingSummaryProps {
  date: string;
  endDate?: string | null;
  garageFilter?: string;
  isSidebar?: boolean;
  isAccountsPage?: boolean;
}

const GARAGES = [
  { id: 'Repair' as ServiceType, name: 'Слесарный ремонт и ТО', label: 'Слесарный ремонт', color: 'text-blue-400', dot: 'bg-blue-500' },
  { id: 'Diagnostic' as ServiceType, name: 'Электрика и диагностика', label: 'Электрика', color: 'text-purple-400', dot: 'bg-purple-500' },
  { id: 'Detailing' as ServiceType, name: 'Детейлинг и покрытия', label: 'Детейлинг', color: 'text-emerald-400', dot: 'bg-emerald-500' }
];

const BOXES = ['Бокс А', 'Бокс Б', 'Бокс В'];

export default function GarageBookingSummary({ date, endDate, garageFilter, isSidebar, isAccountsPage }: GarageBookingSummaryProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    activeService, 
    setActiveService, 
    activeBox, 
    setActiveBox, 
    activeStatus, 
    setActiveStatus, 
    pendingFilter, 
    setPendingFilter,
    refreshKey 
  } = useAdminStore();
  const [totalAppointments, setTotalAppointments] = useState<any[]>([]);
  const [globalTodayApps, setGlobalTodayApps] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    if (!isAccountsPage) return;
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/admin/staff');
        if (res.ok) {
          const data = await res.json();
          setStaff(data);
        }
      } catch (err) {
        console.error('Fetch staff error:', err);
      }
    };
    fetchStaff();
  }, [isAccountsPage, refreshKey]);

  useEffect(() => {
    if (!isAccountsPage) return;
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/admin/staff');
        if (res.ok) {
          const data = await res.json();
          setStaff(data);
        }
      } catch (err) {
        console.error('Fetch staff error:', err);
      }
    };
    const interval = setInterval(fetchStaff, 10000);
    return () => clearInterval(interval);
  }, [isAccountsPage]);

  useEffect(() => {
    if (isAccountsPage) return;
    const fetchGlobalToday = async () => {
      try {
        let url = `/api/admin/appointments?date=${date}`;
        if (endDate) url += `&endDate=${endDate}`;
        const res = await fetch(url);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setGlobalTodayApps(data);
          }
        }
      } catch (err) {
        console.error('Fetch global today apps error:', err);
      }
    };
    fetchGlobalToday();
    const interval = setInterval(fetchGlobalToday, 10000);
    return () => clearInterval(interval);
  }, [date, endDate]);

  useEffect(() => {
    const fetchTotalApps = async () => {
      try {
        const res = await fetch(`/api/admin/appointments?date=2000-01-01&endDate=2099-12-31`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setTotalAppointments(data);
          }
        }
      } catch (err) {
        console.error('Fetch total apps error:', err);
      }
    };
    fetchTotalApps();
    const interval = setInterval(fetchTotalApps, 30000); // 30s for total
    return () => clearInterval(interval);
  }, []);

  const isPending = (app: any) => {
    const status = (app.status || "").toUpperCase();
    if (status === 'NEW' || status === 'RAW' || status === 'COMPLETED') return true;
    
    if (status === 'CONFIRMED') {
      const now = new Date();
      // Handle date format DD.MM.YYYY or YYYY-MM-DD
      let appDateStr = app.date;
      if (appDateStr.includes('.')) {
        const [d, m, y] = appDateStr.split('.');
        appDateStr = `${y}-${m}-${d}`;
      }
      const appDate = new Date(appDateStr);
      const [h, m] = (app.time || "00:00").split(':').map(Number);
      appDate.setHours(h, m, 0, 0);
      
      const endTimestamp = appDate.getTime() + (Number(app.duration) || 1) * 60 * 60 * 1000;
      return now.getTime() > endTimestamp;
    }
    return false;
  };

  useEffect(() => {
    const fetchApps = async () => {
      try {
        let url = `/api/admin/appointments?date=${date}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (garageFilter) url += `&garage=${encodeURIComponent(garageFilter)}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setAppointments(data);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
    const interval = setInterval(fetchApps, 10000); // 10s is enough for summary
    return () => clearInterval(interval);
  }, [date, endDate, garageFilter]);

  const filteredApps = garageFilter 
    ? appointments.filter(a => {
        const garage = (a.garage || "").toLowerCase().trim();
        const filter = garageFilter.toLowerCase().trim();
        return garage === filter || garage.includes(filter) || filter.includes(garage);
      })
    : appointments;

  const displayItems = garageFilter
    ? BOXES.map(box => {
        const boxApps = filteredApps.filter(a => a.box === box);
        const totalDuration = boxApps.reduce((sum, a) => sum + (parseInt(a.duration) || 1), 0);
        return {
          id: box,
          label: box,
          count: boxApps.length,
          duration: totalDuration,
          color: 'text-accent-orange',
          isActive: activeBox === box
        };
      })
    : GARAGES.map(g => ({
        id: g.id,
        label: g.name,
        count: filteredApps.filter(a => a.garage === g.name).length,
        duration: 0,
        color: g.color,
        isActive: false
      }));

  const handleItemClick = (item: any) => {
    if (!isSidebar) return;
    
    if (garageFilter) {
      // We are showing BOXES
      if (activeBox === item.id) {
        setActiveBox('Все');
      } else {
        setActiveBox(item.id);
      }
    } else {
      // We are showing GARAGES
      setActiveService(item.id);
    }
  };

  const handleStatusClick = (statusLabel: string) => {
    if (!isSidebar) return;
    if (activeStatus === statusLabel) {
      setActiveStatus(null);
    } else {
      setActiveStatus(statusLabel);
    }
  };

  const statusCounts = {
    all: filteredApps.length,
    new: filteredApps.filter(a => {
      const s = (a.status || "").toUpperCase();
      return !s || s === 'NEW' || s === 'RAW';
    }).length,
    confirmed: filteredApps.filter(a => (a.status || "").toUpperCase() === 'CONFIRMED').length,
    completed: filteredApps.filter(a => (a.status || "").toUpperCase() === 'COMPLETED').length,
    paid: filteredApps.filter(a => {
      const s = (a.status || "").toUpperCase();
      return s === 'CLOSED' || s === 'PAID';
    }).length,
    cancelled: filteredApps.filter(a => (a.status || "").toUpperCase() === 'CANCELLED').length,
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y.slice(2)}`;
  };

  const isToday = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
    return dateStr === todayStr;
  };

  const currentLabel = endDate 
    ? 'Записей за период' 
    : isToday(date) 
      ? 'Записей на сегодня' 
      : `Записей на ${formatDate(date)}`;
  const sidebarLabel = currentLabel;

  if (isSidebar && isAccountsPage) {
    const accountFilters = [
      { label: 'Все аккаунты', count: staff.length, color: 'text-white' },
      { label: 'Слесарный ремонт и ТО', count: staff.filter(s => (s.access || '').toLowerCase().trim() === 'слесарный ремонт и то').length, color: 'text-blue-400' },
      { label: 'Электрика и диагностика', count: staff.filter(s => (s.access || '').toLowerCase().trim() === 'электрика и диагностика').length, color: 'text-purple-400' },
      { label: 'Детейлинг и покрытия', count: staff.filter(s => (s.access || '').toLowerCase().trim() === 'детейлинг и покрытия').length, color: 'text-emerald-400' },
      { label: 'Менеджеры', count: staff.filter(s => (s.role || '').toLowerCase() === 'менеджер').length, color: 'text-yellow-400' },
      { label: 'Администраторы', count: staff.filter(s => (s.role || '').toLowerCase() === 'администратор').length, color: 'text-red-400' }
    ];

    return (
      <div className="flex flex-col gap-6 px-4 pb-4 pt-6">
        <div className="space-y-4">
          <div className="mb-2 text-[12px] h-[68px] flex items-center">
            <div className="flex flex-col">
              <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                СПИСОК СОТРУДНИКОВ
              </div>
              <div className="h-px w-8 bg-accent-orange mt-1" />
            </div>
          </div>
          
          <div className="space-y-1">
            {accountFilters.map(af => {
              const filterValue = af.label === 'Все аккаунты' ? 'Все' : af.label;
              const isSelected = activeStatus === filterValue || (filterValue === 'Все' && (!activeStatus || activeStatus === 'Все'));

              return (
                <button 
                  key={af.label} 
                  onClick={() => setActiveStatus(filterValue)}
                  className={`w-full flex justify-between items-center rounded-lg px-3 py-[3px] border transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-white/10 border-white/20 shadow-lg' 
                      : 'bg-white/3 border-white/3 hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    isSelected ? 'text-white' : ''
                  }`} style={{ color: isSelected ? undefined : '#e1e1e1' }}>{af.label}</span>
                  <span className={`text-xs font-black ${
                     isSelected ? 'text-white' : af.color
                  }`}>{af.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (isSidebar) {
    const serviceName = activeService === 'General' 
      ? 'ВСЕ ЗАПИСИ' 
      : GARAGES.find(g => g.id === activeService)?.name || activeService;

    return (
      <div className="flex flex-col gap-6 px-4 pb-4 pt-6">
        {!pendingFilter && (
          <div className="space-y-4">
            <div className="mb-2 text-[12px] h-[68px] flex items-center">
              <div className="flex flex-col">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                  {serviceName}
                </div>
                <div className="h-px w-8 bg-accent-orange mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest" style={{ color: '#e1e1e1' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
              {sidebarLabel}
            </div>
            
              <div className="space-y-1">
              {[
                { label: 'Все', value: statusCounts.all, color: 'text-white' },
                { label: 'Новые', value: statusCounts.new, color: 'text-yellow-400' },
                { label: 'Отмененные', value: statusCounts.cancelled, color: 'text-red-400' },
                { label: 'Подтвержденные', value: statusCounts.confirmed, color: 'text-green-400' },
                { label: 'Выполненные', value: statusCounts.completed, color: 'text-blue-400' },
                { label: 'Оплачено', value: statusCounts.paid, color: 'text-gray-400' }
              ].map(s => (
                <button 
                  key={s.label} 
                  onClick={() => handleStatusClick(s.label === 'Все' ? 'Все' : s.label)}
                  className={`w-full flex justify-between items-center rounded-lg px-3 py-[3px] border transition-all active:scale-[0.98] ${
                    (activeStatus === s.label || (s.label === 'Все' && (!activeStatus || activeStatus === 'Все'))) && !pendingFilter
                      ? 'bg-white/10 border-white/20 shadow-lg' 
                      : 'bg-white/3 border-white/3 hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    ((activeStatus === s.label || (s.label === 'Все' && (!activeStatus || activeStatus === 'Все'))) && !pendingFilter) ? 'text-white' : ''
                  }`} style={{ color: ((activeStatus === s.label || (s.label === 'Все' && (!activeStatus || activeStatus === 'Все'))) && !pendingFilter) ? undefined : '#e1e1e1' }}>{s.label}</span>
                  <span className={`text-xs font-black ${
                    ((activeStatus === s.label || (s.label === 'Все' && (!activeStatus || activeStatus === 'Все'))) && !pendingFilter) ? 'text-white' : s.color
                  }`}>{loading ? '...' : s.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(!pendingFilter) && <div className="h-px bg-white/5" />}

        {pendingFilter && (
          <div className="space-y-3">
            <div className="mb-2 text-[12px] h-[68px] flex items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-white">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-[pulse_2s_infinite] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  В ожидании обработки
                </div>
                <div className="h-px w-8 bg-accent-orange mt-1" />
              </div>
            </div>
            <div className="space-y-1">
              {[
                { id: 'all' as const, label: 'Всего', code: 'Все' },
                { id: 'all' as const, label: 'Новые', code: 'Новые' },
                { id: 'all' as const, label: 'Выполненные', code: 'Выполненные' },
                { id: 'all' as const, label: 'Просроченные', code: 'Просроченные' }
              ].map(p => (
                <button 
                  key={p.label} 
                  onClick={() => {
                    setPendingFilter(p.id);
                    setActiveStatus(p.code);
                  }}
                  className={`w-full flex justify-between items-center rounded-lg px-3 py-[3px] border transition-all active:scale-[0.98] ${
                    pendingFilter === p.id && (activeStatus || 'Все') === p.code
                      ? 'bg-accent-orange/10 border-accent-orange shadow-[0_0_15px_rgba(255,165,0,0.1)]' 
                      : 'bg-white/3 border-white/3 hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    pendingFilter === p.id && (activeStatus || 'Все') === p.code ? 'text-accent-orange' : ''
                  }`} style={{ color: pendingFilter === p.id && (activeStatus || 'Все') === p.code ? undefined : '#e1e1e1' }}>{p.label}</span>
                  <span className={`text-xs font-black ${
                    pendingFilter === p.id && (activeStatus || 'Все') === p.code ? 'text-accent-orange' : 'text-white'
                  }`}>
                    {loading ? '...' : totalAppointments.filter(isPending).filter(app => {
                      if (p.code === 'Все') return true;
                      const s = (app.status || "").toUpperCase();
                      if (p.code === 'Новые') return s === 'NEW' || s === 'RAW';
                      if (p.code === 'Выполненные') return s === 'COMPLETED';
                      if (p.code === 'Просроченные') {
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
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5 inline-flex gap-8 group">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
          {garageFilter ? `Загрузка боксов (${formatDate(date)}): ${loading ? '...' : filteredApps.length}` : `Записей на ${formatDate(date)}: ${loading ? '...' : filteredApps.length}`}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pr-4">
          {displayItems.map(item => (
            <div key={item.id} className="flex flex-col items-center justify-center text-center gap-1 min-w-[90px]">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-tight h-8 flex items-center">
                {garageFilter ? item.label : item.label}
              </span>
              <div className="flex flex-col items-center justify-center bg-white/5 rounded-xl px-3 py-2 border border-white/5 w-full">
                <span className={`text-xl font-black ${item.color} tracking-tight leading-none`}>
                  {loading ? '...' : item.count}
                </span>
                {!loading && garageFilter && (
                  <span className="text-[9px] font-bold text-gray-500 mt-1 lowercase">
                    {item.duration} ч
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-px bg-white/10 self-stretch" />

      <div className="flex flex-col gap-2 min-w-[120px]">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Статусы:</div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Все</span>
            <span className="text-xs font-bold text-white">{loading ? '...' : statusCounts.all}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Новые</span>
            <span className="text-xs font-bold text-yellow-400">{loading ? '...' : statusCounts.new}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Отмененные</span>
            <span className="text-xs font-bold text-red-400">{loading ? '...' : statusCounts.cancelled}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Подтвержденные</span>
            <span className="text-xs font-bold text-green-400">{loading ? '...' : statusCounts.confirmed}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Выполненные</span>
            <span className="text-xs font-bold text-blue-400">{loading ? '...' : statusCounts.completed}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Оплачено</span>
            <span className="text-xs font-bold text-gray-500">{loading ? '...' : statusCounts.paid}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
