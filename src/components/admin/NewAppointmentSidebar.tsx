import React, { useState } from 'react';
import { Save, User, Phone, Car, Clock, Calendar, Wrench, FileText, ChevronDown, X, PanelLeftClose, Eraser } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { motion, AnimatePresence } from 'motion/react';

export default function NewAppointmentSidebar() {
  const { 
    triggerRefresh, 
    setIsNewAppointmentExpanded,
    newAppointmentDraft,
    setNewAppointmentDraft,
    clearNewAppointmentDraft
  } = useAdminStore();

  const formData = newAppointmentDraft;

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointmentDraft({ [name]: value });
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

    setNewAppointmentDraft({ phone: res });
  };

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (!val) return;
    
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
      setNewAppointmentDraft({ [e.target.name]: formatted });
    }
  };

    // Success feedback
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleCreate = async () => {
    if (!formData.clientName || !formData.car || !formData.service) {
      setFeedback({ type: 'error', msg: 'Заполните обязательные поля!' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    const digits = formData.phone.replace(/\D/g, '');
    const phoneToSave = digits ? '7' + digits : '';

    try {
      const res = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: phoneToSave })
      });
      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Запись успешно создана!' });
        triggerRefresh();
        setTimeout(() => {
          clearNewAppointmentDraft();
          setIsNewAppointmentExpanded(false);
          setFeedback(null);
        }, 1500);
      } else {
        const errorData = await res.json();
        setFeedback({ type: 'error', msg: errorData.error || 'Ошибка при создании' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: 'Критическая ошибка при создании' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-graphite-light rounded-r-3xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-orange/20 rounded-lg flex items-center justify-center border border-accent-orange/30">
            <Calendar className="w-4 h-4 text-accent-orange" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">новая запись</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Создание заявки</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearNewAppointmentDraft}
            title="Очистить форму"
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-accent-orange"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsNewAppointmentExpanded(false)}
            title="Свернуть"
            className="p-1.5 bg-accent-orange/10 hover:bg-accent-orange/20 rounded-lg transition-all text-accent-orange border border-accent-orange/20"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border ${
              feedback.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            {feedback.msg}
          </motion.div>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <User className="w-3 h-3" /> Клиент
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="ФИО клиента"
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
                value={formData.phone}
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
              placeholder="Марка, модель, госномер"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <div className="space-y-3">
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none"
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer"
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
                  <option value="CONFIRMED">ПОДТВЕРЖДЕНА</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

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
              placeholder="Что нужно сделать?"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <FileText className="w-3 h-3" /> Заметки
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={4}
              placeholder="Результат осмотра или примечания..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full py-3 bg-accent-orange hover:bg-accent-orange-light rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(255,107,0,0.3)] disabled:opacity-50"
        >
          {saving ? 'Создание...' : (
            <>
              <Save className="w-4 h-4" /> Создать запись
            </>
          )}
        </button>
      </div>
    </div>
  );
}
