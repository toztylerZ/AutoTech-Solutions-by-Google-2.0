import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Box, Info, Car, AlertTriangle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import EditAppointmentModal from './EditAppointmentModal';

interface ScheduleGridProps {
  garage: string;
  date: string;
  endDate?: string | null;
  boxFilter?: string;
}

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const BOXES = ['Бокс А', 'Бокс Б', 'Бокс В'];

export default function ScheduleGrid({ garage, date, endDate, boxFilter }: ScheduleGridProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { activeStatus, highlightedOrderId, setHighlightedOrderId } = useAdminStore();

  useEffect(() => {
    if (highlightedOrderId) {
      const timer = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId]);

  const STATUS_OPTIONS = [
    { label: 'НОВАЯ', code: 'NEW' },
    { label: 'ОТМЕНЁННАЯ', code: 'CANCELLED' },
    { label: 'ПОДТВЕРЖДЕННАЯ', code: 'CONFIRMED' },
    { label: 'ЗАВЕРШЕННАЯ', code: 'COMPLETED' },
    { label: 'ЗАКРЫТАЯ', code: 'CLOSED' }
  ];

  useEffect(() => {
    const fetchApps = async () => {
      try {
        let url = `/api/admin/appointments?date=${date}&garage=${encodeURIComponent(garage)}`;
        if (endDate) url += `&endDate=${endDate}`;
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
    const interval = setInterval(fetchApps, 5000); // Poll every 5 seconds for real-time sync
    return () => clearInterval(interval);
  }, [garage, date, endDate]);

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
      
      const endTimestamp = appDate.getTime() + (Number(app.duration) || 1) * 60 * 60 * 1000;
      return now.getTime() > endTimestamp;
    }
    return false;
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case 'CONFIRMED': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'CHANGED': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'RAW':
      case 'NEW': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'CLOSED': return 'text-gray-400 bg-black border-white/10 shadow-inner';
      default: return 'text-gray-500 bg-white/5 border-white/10';
    }
  };

  const handleStatusChange = async (e: React.MouseEvent, orderId: string, newStatus: string) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/admin/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.orderId === orderId ? { ...a, status: newStatus } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAppointments = useMemo(() => {
    // Schedules should generally show all appointments for the day
    return appointments;
  }, [appointments]);

  const getTimeValue = (timeStr: string) => {
    const [h, m] = (timeStr || "00:00").split(':').map(Number);
    return h + m / 60;
  };

  const getRowSpan = (app: any) => {
    const start = getTimeValue(app.time);
    const end = start + (Number(app.duration) || 1);
    return Math.max(1, Math.ceil(end) - Math.floor(start));
  };

  const datesList = useMemo(() => {
    if (!endDate || date === endDate) return [date];
    
    const dates = [];
    const start = new Date(date);
    const last = new Date(endDate);
    const curr = new Date(start);
    
    while (curr <= last) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [date, endDate]);

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    datesList.forEach(d => grouped[d] = []);
    
    appointments.forEach(app => {
      let appDate = app.date;
      if (appDate && appDate.includes('.')) {
        const [d, m, y] = appDate.split('.');
        appDate = `${y}-${m}-${d}`;
      }
      if (grouped[appDate]) {
        grouped[appDate].push(app);
      }
    });
    return grouped;
  }, [appointments, datesList]);

  const formatDateHeader = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ];
      return `${day} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  const getAppointmentsAt = (box: string, hour: string, dayApps: any[]) => {
    const slotTime = getTimeValue(hour);
    return dayApps.filter(a => {
      const appTime = getTimeValue(a.time);
      return a.box === box && Math.floor(appTime) === slotTime;
    });
  };

  const isSlotCovered = (box: string, hour: string, dayApps: any[]) => {
    const slotTime = getTimeValue(hour);
    return dayApps.some(a => {
      const start = getTimeValue(a.time);
      const end = start + (Number(a.duration) || 1);
      return a.box === box && Math.floor(start) < slotTime && end > slotTime;
    });
  };

  const allBoxes = useMemo(() => {
    const dataBoxes = Array.from(new Set(appointments.map(a => a.box)))
      .filter(Boolean)
      .sort() as string[];
    const defaultBoxes = ['Бокс А', 'Бокс Б', 'Бокс В'];
    const merged = Array.from(new Set([...defaultBoxes, ...dataBoxes]));
    return merged;
  }, [appointments]);

  const displayedBoxes = !boxFilter || boxFilter === 'Все' 
    ? allBoxes 
    : allBoxes.filter(b => b === boxFilter);

  const formatPhone = (phone: string) => {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+7(${cleaned.slice(1, 4)})${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Загрузка расписания...</div>;

  return (
    <div className="bg-graphite-light rounded-3xl border border-white/5 overflow-hidden shadow-2xl w-full">
      <div className="overflow-auto max-h-[calc(100vh-120px)] relative space-y-12 pb-12">
        {datesList.map(currentDate => (
          <div key={currentDate} className="relative group/date">
            {datesList.length > 1 && (
              <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-center">
                <div className="flex items-center justify-center gap-4 w-full max-w-2xl">
                  <div className="h-[1px] bg-gradient-to-r from-transparent to-accent-orange/40 flex-1" />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-orange px-6 py-2 border border-accent-orange/30 rounded-full bg-accent-orange/10 shadow-[0_0_20px_rgba(255,165,0,0.1)]">
                    {formatDateHeader(currentDate)}
                  </span>
                  <div className="h-[1px] bg-gradient-to-l from-transparent to-accent-orange/40 flex-1" />
                </div>
              </div>
            )}
            <table className="w-full border-collapse">
              <thead className={`sticky ${datesList.length > 1 ? 'top-[65px]' : 'top-0'} z-40 bg-graphite-light shadow-xl`}>
                <tr className="bg-black/40 border-b border-white/10 backdrop-blur-sm">
                  <th className="p-4 border-r border-white/10 w-24"></th>
                  {displayedBoxes.map(box => (
                    <th key={box} className="p-4 text-center border-b border-white/10">
                      <div className="flex flex-col items-center gap-1">
                        <Box className="w-4 h-4 text-accent-orange" />
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{box}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={`${currentDate}-${hour}`} className="border-b border-white/5 last:border-0 h-28 group">
                    <td className="p-4 border-r border-white/10 text-center bg-black/20">
                      <div className="flex flex-col items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-600 group-hover:text-accent-orange transition-colors" />
                        <span className="text-sm font-black text-gray-400 group-hover:text-white transition-colors tracking-tighter">{hour}</span>
                      </div>
                    </td>
                    {displayedBoxes.map(box => {
                      const dayApps = appointmentsByDate[currentDate] || [];
                      const apps = getAppointmentsAt(box, hour, dayApps);
                      const covered = isSlotCovered(box, hour, dayApps);
                      
                      if (covered) return null;

                      const maxRowSpan = apps.reduce((max, app) => Math.max(max, getRowSpan(app)), 1);

                      return (
                        <td 
                          key={`${currentDate}-${box}-${hour}`} 
                          className="p-1 relative min-w-[200px]"
                          rowSpan={maxRowSpan}
                        >
                          {apps.length > 0 ? (
                            <div className="absolute inset-1 flex flex-col gap-1 overflow-visible">
                              {apps.map((app, appIdx) => (
                                <motion.div
                                  key={`${app.orderId}-${appIdx}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                    boxShadow: app.orderId === highlightedOrderId ? '0 0 30px rgba(255, 165, 0, 0.4)' : 'none',
                                    outline: app.orderId === highlightedOrderId ? '2px solid rgba(255, 165, 0, 0.5)' : 'none'
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAppointment(app);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlightedOrderId(app.orderId);
                                  }}
                                  className={`flex-grow border rounded-xl p-3 flex flex-col justify-between group/card transition-all shadow-lg ${getStatusColor(app.status)} hover:shadow-2xl cursor-pointer select-none relative ${activeMenu === app.orderId ? 'z-50' : 'z-10'}`}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="min-w-0 flex-1">
                                       <div className="flex flex-col items-start text-left w-full min-w-0">
                                           <div className="flex items-center justify-between gap-1 w-full">
                                              <div className="text-[13px] font-black text-white truncate flex items-center gap-1">
                                                {isPending(app) && (
                                                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 animate-[pulse_1s_infinite] drop-shadow-[0_0_5px_rgba(234,179,8,0.8)] shrink-0" />
                                                )}
                                                {app.clientName}
                                              </div>
                                               <div className="flex items-center gap-1 shrink-0 h-4 px-1.5 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/40 relative"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveMenu(activeMenu === app.orderId ? null : app.orderId);
                                                    }}
                                               >
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                                  (app.status || "").toUpperCase() === 'CONFIRMED' ? 'bg-green-500' : 
                                                  (app.status || "").toUpperCase() === 'CANCELLED' ? 'bg-red-500' :
                                                  (app.status || "").toUpperCase() === 'COMPLETED' ? 'bg-blue-400' :
                                                  (app.status || "").toUpperCase() === 'CLOSED' ? 'bg-black border border-white/20' :
                                                  'bg-yellow-500'
                                                 }`} />
                                                <span className="text-[7px] font-black uppercase tracking-widest opacity-70">
                                                  {(app.status || "").toUpperCase() === 'CLOSED' ? 'ЗАКРЫТАЯ' : 
                                                   (app.status || "").toUpperCase() === 'COMPLETED' ? 'ЗАВЕРШЕННАЯ' :
                                                   (app.status || "").toUpperCase() === 'CONFIRMED' ? 'ПОДТВЕРЖДЕННАЯ' :
                                                   (app.status || "").toUpperCase() === 'CANCELLED' ? 'ОТМЕНЕННАЯ' :
                                                   'НОВАЯ'}
                                                </span>
        
                                                <AnimatePresence>
                                                  {activeMenu === app.orderId && (
                                                    <motion.div 
                                                      initial={{ opacity: 0, scale: 0.9 }}
                                                      animate={{ opacity: 1, scale: 1 }}
                                                      exit={{ opacity: 0, scale: 0.9 }}
                                                      className="absolute top-full right-0 mt-1 z-[100] bg-graphite border border-white/10 rounded-lg py-1 shadow-2xl min-w-[120px]"
                                                    >
                                                      {STATUS_OPTIONS.map(opt => (
                                                        <button
                                                          key={opt.code}
                                                          onClick={(e) => {
                                                            handleStatusChange(e, app.orderId, opt.code);
                                                            setActiveMenu(null);
                                                          }}
                                                          className="w-full text-left px-3 py-2 text-[8px] font-black text-gray-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                                                        >
                                                          {opt.label}
                                                        </button>
                                                      ))}
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                           </div>
                                           <div className="flex items-center justify-start gap-1 mt-0.5">
                                            <div className="text-[9px] text-gray-500 font-mono font-black tracking-tight">#{app.orderId}</div>
                                            <span className="text-gray-700">|</span>
                                            <div className="text-[9px] text-gray-500 font-mono tracking-tighter truncate">{formatPhone(app.phone)}</div>
                                          </div>
                                       </div>
                                      <div className="text-[11px] font-black opacity-90 leading-tight flex items-center justify-start gap-1.5 mt-1">
                                        <Car className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{app.car || 'Без авто'}</span>
                                      </div>
                                      <div className="text-[11px] mt-1.5 opacity-90 font-bold leading-tight border-t border-white/5 pt-1.5 w-full text-left truncate">
                                        {app.service}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full h-full border border-dashed border-white/5 rounded-xl flex items-center justify-center group/empty transition-all hover:bg-white/[0.02] hover:border-white/20">
                               <span className="text-[10px] text-gray-800 font-black uppercase tracking-widest opacity-0 group-hover/empty:opacity-100 transition-opacity">Свободно</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>


      <AnimatePresence>
        {editingAppointment && (
          <EditAppointmentModal
            appointment={editingAppointment}
            onClose={() => setEditingAppointment(null)}
            onSave={(updated) => {
              setAppointments(prev => prev.map(a => a.orderId === updated.orderId ? { ...a, ...updated } : a));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
