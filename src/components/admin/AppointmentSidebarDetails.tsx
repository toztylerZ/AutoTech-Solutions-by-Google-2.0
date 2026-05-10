import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Car, Clock, Calendar, Wrench, FileText, ChevronDown, X, AlertTriangle, PanelLeftClose, MapPin, Plus, History } from 'lucide-react';
import { Appointment, useAdminStore, getServiceIdFromGarage } from '../../store/adminStore';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentSidebarDetailsProps {
  appointment: Appointment;
}

export default function AppointmentSidebarDetails({ appointment }: AppointmentSidebarDetailsProps) {
  const { 
    setSelectedAppointment, 
    triggerRefresh, 
    setIsDetailsExpanded, 
    setIsNewAppointmentExpanded,
    setNewAppointmentDraft,
    setActiveService, 
    setActiveView, 
    setHighlightedOrderId,
    setSelectedDate,
    setEndDate,
    isPickingNewTime,
    setIsPickingNewTime
  } = useAdminStore();
  const [formData, setFormData] = useState({ ...appointment });
  const [prePickData, setPrePickData] = useState<Partial<Appointment> | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.orderId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory && historyData.length === 0) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  useEffect(() => {
    const normalizedStatus = appointment.status?.toUpperCase() || 'NEW';
    const nextData = { 
      ...appointment, 
      status: normalizedStatus,
      difficulty: appointment.difficulty || '',
      finishedTime: appointment.finishedTime || ''
    };

    if (formData.orderId !== appointment.orderId) {
      // Completely different appointment selected
      setFormData(nextData);
      setHasEdits(false);
    } else {
      // Same appointment updated (possibly via pick mode)
      setFormData(nextData);
      if (isPickingNewTime) {
        setHasEdits(true);
      }
    }
  }, [appointment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      const isDifferent = JSON.stringify(next) !== JSON.stringify(appointment);
      setHasEdits(isDifferent);
      return next;
    });
  };

  const handleShowInSchedule = () => {
    const serviceId = getServiceIdFromGarage(appointment.garage);
    setActiveService(serviceId);
    setActiveView('grid');
    setHighlightedOrderId(appointment.orderId);
    
    // Support date format conversion if needed
    let appDate = appointment.date;
    if (appDate && /^\d{2}\.\d{2}\.\d{4}$/.test(appDate)) {
      const [d, m, y] = appDate.split('.');
      appDate = `${y}-${m}-${d}`;
    }
    
    setSelectedDate(appDate);
    setEndDate(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbers = val.replace(/\D/g, '');
    
    let cleanNumbers = numbers;
    if (numbers.length === 11 && (numbers.startsWith('7') || numbers.startsWith('8'))) {
      cleanNumbers = numbers.substring(1);
    } else if (numbers.length === 10 && numbers.startsWith('9')) {
      cleanNumbers = numbers;
    } else if (numbers.length > 10) {
      cleanNumbers = numbers.substring(0, 10);
    }

    // Format: (999) 000-00-00
    let res = '';
    if (cleanNumbers.length > 0) {
      res += '(' + cleanNumbers.substring(0, 3);
      if (cleanNumbers.length >= 3) res += ') ';
      if (cleanNumbers.length > 3) res += cleanNumbers.substring(3, 6);
      if (cleanNumbers.length >= 6) res += '-';
      if (cleanNumbers.length > 6) res += cleanNumbers.substring(6, 8);
      if (cleanNumbers.length >= 8) res += '-';
      if (cleanNumbers.length > 8) res += cleanNumbers.substring(8, 10);
    }

    setFormData(prev => ({ ...prev, phone: res }));
    setHasEdits(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Convert phone back to digits for server if needed, though server handles digits
    const digits = formData.phone.replace(/\D/g, '');
    const phoneToSave = digits ? '7' + digits : '';

    try {
      const res = await fetch('/api/schedule/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: phoneToSave })
      });
      if (res.ok) {
        setHasEdits(false);
        setSelectedAppointment({ ...formData, phone: phoneToSave });
        setIsPickingNewTime(false);
        triggerRefresh();
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const isPending = (app: Appointment) => {
    const status = (app.status || "").toUpperCase();
    if (status === 'NEW' || status === 'RAW' || status === 'COMPLETED') return true;
    
    if (status === 'CONFIRMED') {
      const now = new Date();
      let appDateStr = app.date;
      if (appDateStr && appDateStr.includes('.')) {
        const [d, m, y] = appDateStr.split('.');
        appDateStr = `${y}-${m}-${d}`;
      }
      if (!appDateStr) return false;
      const appDate = new Date(appDateStr);
      const [h, m] = (app.time || "00:00").split(':').map(Number);
      appDate.setHours(h, m, 0, 0);
      
      const endTimestamp = appDate.getTime() + (Number(app.duration) || 1) * 60 * 60 * 1000;
      return now.getTime() > endTimestamp;
    }
    return false;
  };

  const pendingMode = isPending(appointment);
  
  const handleTransferToNew = () => {
    setIsNewAppointmentExpanded(true);
    setNewAppointmentDraft({
      clientName: formData.clientName,
      phone: formData.phone,
      car: formData.car
    });
  };

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (!val) return;
    
    // Attempt to format as HH:MM
    let formatted = val;
    if (/^\d{1,2}$/.test(val)) {
      formatted = `${val.padStart(2, '0')}:00`;
    } else if (/^\d{1,2}[:.-]\d{0,2}$/.test(val)) {
      const parts = val.split(/[:.-]/);
      formatted = `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padEnd(2, '0').slice(0, 2)}`;
    } else if (/^\d{3,4}$/.test(val)) {
      const h = val.slice(0, val.length - 2);
      const m = val.slice(val.length - 2);
      formatted = `${h.padStart(2, '0')}:${m.padEnd(2, '0')}`;
    }

    if (formatted !== val) {
      setFormData(prev => ({ ...prev, [e.target.name]: formatted }));
      setHasEdits(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-graphite-light rounded-r-3xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-orange/20 rounded-lg flex items-center justify-center border border-accent-orange/30">
            {pendingMode ? (
              <AlertTriangle className="w-4 h-4 text-accent-orange animate-pulse" />
            ) : (
              <FileText className="w-4 h-4 text-accent-orange" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">номер заявки</div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-white">#{appointment.orderId}</div>
              {pendingMode && (
                <div className="flex items-center justify-center text-accent-orange animate-pulse">
                  <AlertTriangle className="w-4 h-4 fill-accent-orange/20" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsDetailsExpanded(false)}
            title="Свернуть"
            className="p-1.5 bg-accent-orange/10 hover:bg-accent-orange/20 rounded-lg transition-all text-accent-orange border border-accent-orange/20"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setSelectedAppointment(null)}
            title="Закрыть"
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Client Info */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="w-3 h-3" /> Клиент
              </label>
              <button
                onClick={handleShowInSchedule}
                className="text-[9px] font-black text-accent-orange uppercase tracking-widest hover:text-gray-400 transition-colors flex items-center gap-1"
              >
                <MapPin className="w-2.5 h-2.5" /> показать в расписании
              </button>
            </div>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Phone className="w-3 h-3" /> Телефон
            </label>
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl group focus-within:border-accent-orange/50 transition-colors overflow-hidden">
              <span className="pl-3 text-white/40 font-mono text-[10px] tracking-tight">+7</span>
              <input 
                type="tel" 
                value={formData.phone?.includes('(') ? formData.phone : formData.phone?.replace(/^7|^8/, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '($1) $2-$3-$4')}
                onChange={handlePhoneChange}
                className="w-full bg-transparent py-2 px-2 outline-none text-xs text-white font-mono placeholder:text-gray-600" 
                placeholder="(999) 000-00-00" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Car className="w-3 h-3" /> Автомобиль
            </label>
            <input
              type="text"
              name="car"
              value={formData.car}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
            />
            <button
              onClick={handleTransferToNew}
              className="text-[9px] font-black text-accent-orange uppercase tracking-widest hover:text-gray-400 transition-colors flex items-center gap-1 mt-1 ml-1"
            >
              <Plus className="w-2.5 h-2.5" /> перенести в новую запись
            </button>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Schedule Info */}
        <div className="space-y-3">
          <div className="flex justify-start px-1">
            <button
              onClick={() => {
                if (!isPickingNewTime) {
                  // Starting picking - store current values for potential revert
                  setPrePickData({
                    date: formData.date,
                    time: formData.time,
                    garage: formData.garage,
                    box: formData.box
                  });
                } else if (prePickData) {
                  // Cancelling picking - revert to pre-pick values
                  const revertedData = {
                    ...formData,
                    ...prePickData
                  };
                  setFormData(revertedData);
                  // Also update store to keep in sync
                  setSelectedAppointment(revertedData);
                  setPrePickData(null);
                  
                  // Check if any other fields were edited
                  const otherFieldsEdited = Object.keys(formData).some(key => {
                    // Ignore the fields we just reverted
                    if (['date', 'time', 'garage', 'box'].includes(key)) return false;
                    return (formData as any)[key] !== (appointment as any)[key];
                  });
                  
                  if (!otherFieldsEdited) {
                    setHasEdits(false);
                  }
                }
                setIsPickingNewTime(!isPickingNewTime);
              }}
              className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg border focus:outline-none ${
                isPickingNewTime 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                  : 'bg-accent-orange/5 text-accent-orange border-accent-orange/20 hover:bg-accent-orange/10 hover:border-accent-orange/40'
              }`}
            >
              <Clock className={`w-3 h-3 ${isPickingNewTime ? 'animate-pulse' : ''}`} />
              {isPickingNewTime ? 'активен выбор в графике' : 'выбрать новое время в графике'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <Calendar className="w-3 h-3" /> Дата
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isPickingNewTime}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <Clock className="w-3 h-3" /> Время
              </label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                disabled={isPickingNewTime}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="09:00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Гараж</label>
              <div className="relative">
                <select
                  name="garage"
                  value={formData.garage}
                  onChange={handleChange}
                  disabled={isPickingNewTime}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Слесарный ремонт и ТО">Слесарный</option>
                  <option value="Электрика и диагностика">Электрика</option>
                  <option value="Детейлинг и покрытия">Детейлинг</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Бокс</label>
              <div className="relative">
                <select
                  name="box"
                  value={formData.box}
                  onChange={handleChange}
                  disabled={isPickingNewTime}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Бокс А">Бокс А</option>
                  <option value="Бокс Б">Бокс Б</option>
                  <option value="Бокс В">Бокс В</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Длительность (ч)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                step="0.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Статус</label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="NEW">НОВАЯ</option>
                  <option value="CANCELLED">ОТМЕНЕНА</option>
                  <option value="CONFIRMED">ПОДТВЕРЖДЕНА</option>
                  <option value="COMPLETED">ВЫПОЛНЕНА</option>
                  <option value="PAID">ОПЛАЧЕНО</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Finished time</label>
              <input
                type="text"
                name="finishedTime"
                value={formData.finishedTime || ''}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                placeholder="10:30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Сложность (1-5)</label>
              <div className="relative">
                <select
                  name="difficulty"
                  value={formData.difficulty || ''}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">не задана</option>
                  {[1, 2, 3, 4, 5].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Task Info */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Wrench className="w-3 h-3" /> Услуга / Задача
            </label>
            <textarea
              name="service"
              value={formData.service}
              onChange={handleChange}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <FileText className="w-3 h-3" /> Заметки
            </label>
            <textarea
              name="note"
              value={formData.note || ''}
              onChange={handleChange}
              rows={4}
              placeholder="Дополнительные примечания..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* History Component */}
        <div className="space-y-3 pt-2">
          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-accent-orange" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">История изменений</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-black/20 rounded-xl border border-white/5"
              >
                {loadingHistory ? (
                  <div className="p-4 text-center text-xs text-gray-500 animate-pulse font-mono uppercase tracking-tighter">Загрузка...</div>
                ) : historyData.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-gray-500 italic uppercase tracking-wider font-black">Нет истории изменений</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-gray-500 uppercase font-black tracking-wider">
                          <th className="px-2 py-2 border-b border-white/5 font-mono">Дата</th>
                          <th className="px-2 py-2 border-b border-white/5">Изменение</th>
                          <th className="px-2 py-2 border-b border-white/5 font-mono">Юзер</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 divide-y divide-white/5">
                        {historyData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-2 py-2 whitespace-nowrap text-[8px] opacity-70">{item.date}</td>
                            <td className="px-2 py-2 leading-tight">{item.change}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-accent-orange font-mono text-[8px]">{item.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {hasEdits && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-accent-orange hover:bg-accent-orange-light rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(255,107,0,0.3)] disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : (
                <>
                  <Save className="w-4 h-4" /> Сохранить изменения
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
