import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, User, Phone, Car, Clock, Calendar, Wrench, FileText, ChevronDown } from 'lucide-react';

interface EditAppointmentModalProps {
  appointment: any;
  onClose: () => void;
  onSave: (updatedApp: any) => void;
}

export default function EditAppointmentModal({ appointment, onClose, onSave }: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({ ...appointment });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/schedule/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSave(formData);
        onClose();
      } else {
        let errorMsg = 'Unknown error';
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await res.json();
           errorMsg = err.error || errorMsg;
        } else {
           errorMsg = await res.text();
        }
        alert(`Ошибка при сохранении: ${errorMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-graphite-light w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-orange/20 rounded-2xl flex items-center justify-center border border-accent-orange/30">
              <Calendar className="w-6 h-6 text-accent-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Редактирование записи</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Заказ №{appointment.orderId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3 h-3" /> Клиент
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Телефон
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Car className="w-3 h-3" /> Автомобиль
                </label>
                <input
                  type="text"
                  name="car"
                  value={formData.car}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wrench className="w-3 h-3" /> Услуга / Задача
                </label>
                <textarea
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-[1.4] space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Дата
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Время
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    Цех (Garage)
                  </label>
                  <div className="relative">
                    <select
                      name="garage"
                      value={formData.garage}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Слесарный ремонт и ТО">Слесарный ремонт и ТО</option>
                      <option value="Электрика и диагностика">Электрика и диагностика</option>
                      <option value="Детейлинг и покрытия">Детейлинг и покрытия</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    Бокс
                  </label>
                  <div className="relative">
                    <select
                      name="box"
                      value={formData.box}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Бокс А">Бокс А</option>
                      <option value="Бокс Б">Бокс Б</option>
                      <option value="Бокс В">Бокс В</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Длит. (ч)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     Статус
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="NEW">НОВАЯ</option>
                      <option value="CANCELLED">ОТМЕНЁННАЯ</option>
                      <option value="CONFIRMED">ПОДТВЕРЖДЕННАЯ</option>
                      <option value="COMPLETED">ЗАВЕРШЕННАЯ</option>
                      <option value="CLOSED">ЗАКРЫТАЯ</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Заметки администратора
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
                  placeholder="Дополнительные примечания..."
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] px-8 py-4 bg-accent-orange hover:bg-accent-orange-light rounded-2xl text-sm font-bold text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,107,0,0.3)] disabled:opacity-50"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
