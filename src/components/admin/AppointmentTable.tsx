import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

interface Appointment {
  orderId: string;
  date: string;
  time: string;
  garage: string;
  box: string;
  service: string;
  duration: number;
  status: string;
  clientName: string;
  phone: string;
  car: string;
}

interface AppointmentTableProps {
  date: string;
  endDate?: string | null;
  garageFilter?: string;
  boxFilter?: string;
}

type SortConfig = {
  key: keyof Appointment;
  direction: 'asc' | 'desc';
};

export default function AppointmentTable({ date, endDate, garageFilter, boxFilter }: AppointmentTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'time', direction: 'asc' });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { activeStatus } = useAdminStore();

  const STATUS_OPTIONS = [
    { label: 'НОВАЯ', code: 'NEW' },
    { label: 'ОТМЕНЁННАЯ', code: 'CANCELLED' },
    { label: 'ПОДТВЕРЖДЕННАЯ', code: 'CONFIRMED' },
    { label: 'ЗАВЕРШЕННАЯ', code: 'COMPLETED' },
    { label: 'ЗАКРЫТАЯ', code: 'CLOSED' }
  ];

  const handleStatusUpdate = async (e: React.MouseEvent, orderId: string, newStatus: string) => {
    e.stopPropagation();
    try {
      // Update local state immediately for better UX
      setAppointments(prev => prev.map(a => a.orderId === orderId ? { ...a, status: newStatus } : a));
      
      const res = await fetch(`/api/admin/appointments/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optional: final sync
        fetchAppointments();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
    setActiveMenu(null);
  };

  const fetchAppointments = async () => {
    try {
      let url = `/api/admin/appointments?date=${date}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (garageFilter) url += `&garage=${encodeURIComponent(garageFilter)}`;
      if (boxFilter && boxFilter !== 'Все') url += `&box=${encodeURIComponent(boxFilter)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAppointments(data);
        } else {
          const text = await res.text();
          console.error('Expected JSON but got:', text.substring(0, 500));
        }
      } else {
        const text = await res.text();
        console.error('Response error:', res.status, text.substring(0, 500));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [date, endDate, garageFilter, boxFilter]);

  const sortedAppointments = useMemo(() => {
    let filteredItems = [...appointments];

    if (activeStatus && activeStatus !== 'Все') {
      filteredItems = filteredItems.filter(app => {
        const s = (app.status || "").toUpperCase();
        switch (activeStatus) {
          case 'Новые':
            return !s || s === 'NEW' || s === 'RAW';
          case 'Отмененные':
            return s === 'CANCELLED';
          case 'Подтвержденные':
            return s === 'CONFIRMED';
          case 'Завершенные':
            return s === 'COMPLETED';
          case 'Закрытые':
            return s === 'CLOSED';
          default:
            return true;
        }
      });
    }

    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [appointments, sortConfig, activeStatus]);

  const handleSort = (key: keyof Appointment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof Appointment }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+7(${cleaned.slice(1, 4)})${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  const getServiceStyle = (garage: string) => {
    switch (garage) {
      case 'Слесарный ремонт и ТО':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Электрика и диагностика':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Детейлинг и покрытия':
        return 'text-emerald-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case 'CONFIRMED':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'RAW':
      case 'NEW':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'CANCELLED':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'COMPLETED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'CLOSED':
        return 'text-gray-400 bg-black border-white/10';
      default:
        return 'text-gray-500 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="bg-graphite-light rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="bg-black/40 border-b border-white/10">
              <th 
                onClick={() => handleSort('orderId')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pl-8 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">ID <SortIcon column="orderId" /></div>
              </th>
              <th 
                onClick={() => handleSort('time')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">Время <SortIcon column="time" /></div>
              </th>
              <th 
                onClick={() => handleSort(garageFilter ? 'service' : 'garage')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  {garageFilter ? 'Вид сервиса' : 'Гараж'} 
                  <SortIcon column={garageFilter ? 'service' : 'garage'} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('box')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">Бокс <SortIcon column="box" /></div>
              </th>
              <th 
                onClick={() => handleSort('clientName')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">Клиент <SortIcon column="clientName" /></div>
              </th>
              <th 
                onClick={() => handleSort('car')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">Автомобиль <SortIcon column="car" /></div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pr-8 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">Статус <SortIcon column="status" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 animate-pulse font-medium">Загрузка данных...</td>
              </tr>
            ) : sortedAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 font-medium">Записей не найдено</td>
              </tr>
            ) : (
              sortedAppointments.map((app, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={`${app.orderId}-${idx}`} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4 pl-8 font-mono text-xs text-gray-500">#{app.orderId || '—'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black px-2 py-1 rounded border transition-all ${getStatusStyle(app.status)}`}>
                        {app.time || '--:--'}
                      </span>
                      {app.duration > 1 && (
                        <span className="text-[10px] text-gray-600 font-bold">({app.duration}ч)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1 items-start">
                      {garageFilter ? (
                        <>
                          <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full border ${getServiceStyle(app.garage)}`}>
                            {app.service || '—'}
                          </span>
                          <span className="text-[8px] text-gray-500 font-bold tracking-widest uppercase italic text-left">{app.garage}</span>
                        </>
                      ) : (
                        <>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getServiceStyle(app.garage)}`}>
                            {app.garage || 'Не распределено'}
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-widest pl-1 italic text-left ${getServiceStyle(app.garage).split(' ')[0]}`}>
                            {app.service}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-300 font-black">{app.box || '—'}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{app.clientName}</span>
                      <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{formatPhone(app.phone)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-400 font-medium">{garageFilter ? (app.car || '—') : (app.car || app.service)}</td>
                  <td className="p-4 pr-8 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === app.orderId ? null : app.orderId);
                      }}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${getStatusStyle(app.status)} hover:scale-105 active:scale-95`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        (app.status || "").toUpperCase() === 'CONFIRMED' ? 'bg-green-500' : 
                        (app.status || "").toUpperCase() === 'RAW' || (app.status || "").toUpperCase() === 'NEW' ? 'bg-yellow-500' :
                        (app.status || "").toUpperCase() === 'CANCELLED' ? 'bg-red-500' :
                        (app.status || "").toUpperCase() === 'COMPLETED' ? 'bg-blue-400' :
                        (app.status || "").toUpperCase() === 'CLOSED' ? 'bg-black border border-white/20' :
                        'bg-gray-500'
                      }`} />
                      {(app.status || "").toUpperCase() === 'CLOSED' ? 'ЗАКРЫТАЯ' : 
                       (app.status || "").toUpperCase() === 'COMPLETED' ? 'ЗАВЕРШЕННАЯ' :
                       (app.status || "").toUpperCase() === 'CONFIRMED' ? 'ПОДТВЕРЖДЕННАЯ' :
                       (app.status || "").toUpperCase() === 'CANCELLED' ? 'ОТМЕНЕННАЯ' :
                       'НОВАЯ'}
                    </button>

                    {activeMenu === app.orderId && (
                      <div 
                        className="absolute right-8 top-12 z-50 bg-graphite border border-white/10 rounded-xl py-2 shadow-2xl min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.code}
                            onClick={(e) => handleStatusUpdate(e, app.orderId, opt.code)}
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
