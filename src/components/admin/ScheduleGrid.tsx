import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Box, Info, Car } from 'lucide-react';
import EditAppointmentModal from './EditAppointmentModal';

interface ScheduleGridProps {
  garage: string;
  date: string;
  endDate?: string | null;
}

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const BOXES = ['Бокс А', 'Бокс Б', 'Бокс В'];

export default function ScheduleGrid({ garage, date, endDate }: ScheduleGridProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
          } else {
            const text = await res.text();
            console.error('Expected JSON but got:', text.substring(0, 500));
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

  const getAppointmentAt = (box: string, hour: string) => {
    return appointments.find(a => a.box === box && a.time === hour);
  };

  const isSlotCovered = (box: string, hour: string) => {
    const hourInt = parseInt(hour);
    return appointments.some(a => {
      const startHour = parseInt(a.time);
      const endHour = startHour + (a.duration || 1);
      return a.box === box && hourInt > startHour && hourInt < endHour;
    });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Загрузка расписания...</div>;

  return (
    <div className="bg-graphite-light rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/10">
              <th className="p-4 border-r border-white/10 w-24"></th>
              {BOXES.map(box => (
                <th key={box} className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Box className="w-4 h-4 text-accent-orange" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{box}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-b border-white/5 last:border-0 h-28 group">
                <td className="p-4 border-r border-white/10 text-center bg-black/20">
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-600 group-hover:text-accent-orange transition-colors" />
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{hour}</span>
                  </div>
                </td>
                {BOXES.map(box => {
                  const app = getAppointmentAt(box, hour);
                  const covered = isSlotCovered(box, hour);
                  
                  if (covered) return null;

                  return (
                    <td 
                      key={box} 
                      className="p-1 relative min-w-[200px]"
                      rowSpan={app ? Math.max(1, app.duration) : 1}
                    >
                      {app ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onDoubleClick={() => setEditingAppointment(app)}
                          className={`absolute inset-1 border rounded-xl p-2.5 flex flex-col justify-between group/card transition-all z-10 overflow-hidden shadow-lg ${getStatusColor(app.status)} hover:shadow-2xl cursor-pointer select-none`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                               <div className="flex flex-col items-start text-left w-full min-w-0">
                                   <div className="flex items-center justify-between gap-2 w-full">
                                      <div className="text-sm font-black text-white truncate">{app.clientName}</div>
                                       <div className="flex items-center gap-1 shrink-0 h-4 px-1.5 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/40 relative"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveMenu(activeMenu === app.orderId ? null : app.orderId);
                                            }}
                                       >
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${
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
                                                  className="w-full text-left px-2 py-1.5 text-[8px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                                                >
                                                  {opt.label}
                                                </button>
                                              ))}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                   </div>
                                   <div className="flex items-center justify-start gap-2 mb-2">
                                    <div className="text-[10px] text-gray-500 font-mono font-bold tracking-widest">#{app.orderId}</div>
                                    <span className="text-gray-600">|</span>
                                    <div className="text-[10px] text-gray-500 font-mono tracking-tighter">{formatPhone(app.phone)}</div>
                                  </div>
                               </div>
                              <div className="text-[10px] font-bold opacity-90 leading-tight flex items-center justify-start gap-1">
                                <Car className="w-3 h-3 shrink-0" />
                                <span className="truncate">{app.car || 'Без авто'}</span>
                              </div>
                              <div className="text-[11px] mt-1.5 opacity-90 font-medium leading-tight border-t border-white/5 pt-1.5 w-full text-left truncate">
                                {app.service}
                              </div>
                              {app.duration > 1 && (
                                <div className="mt-1 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span className="text-[8px] font-bold uppercase tracking-wider">{app.duration}ч в работе</span>
                                </div>
                              )}
                            </div>
                             {/* Action buttons removed in favor of status dropdown */}
                          </div>
                          

                        </motion.div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-white/5 rounded-xl flex items-center justify-center group/empty transition-colors hover:border-white/20">
                           <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest opacity-0 group-hover/empty:opacity-100 transition-opacity">Свободно</span>
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
