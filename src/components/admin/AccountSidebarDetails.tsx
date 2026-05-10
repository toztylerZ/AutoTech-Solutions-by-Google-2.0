import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Shield, X, PanelLeftClose, Building, LayoutGrid, Key, Trash2 } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { motion, AnimatePresence } from 'motion/react';

interface AccountSidebarDetailsProps {
  member: any;
}

export default function AccountSidebarDetails({ member }: AccountSidebarDetailsProps) {
  const { 
    triggerRefresh, 
    setIsDetailsExpanded,
    setSelectedAppointment
  } = useAdminStore();

  const [formData, setFormData] = useState({
    user_name: '',
    phone: '',
    login: '',
    password: '',
    access: '',
    box: '',
    role: ''
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const formatPhoneForInput = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    let cleanNumbers = digits;
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      cleanNumbers = digits.substring(1);
    } else if (digits.length === 10 && digits.startsWith('9')) {
      cleanNumbers = digits;
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
    return res;
  };

  useEffect(() => {
    if (member) {
      setFormData({
        user_name: member.clientName || '',
        phone: formatPhoneForInput(member.phone),
        login: member.login || '',
        password: member.password || '',
        access: member.access || '',
        box: member.box || '',
        role: member.role || 'работник'
      });
    }
  }, [member]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbers = val.replace(/\D/g, '');
    let cleanNumbers = numbers;
    
    if (numbers.length === 11 && (numbers.startsWith('7') || numbers.startsWith('8'))) {
      cleanNumbers = numbers.substring(1);
    } else if (numbers.length === 10 && numbers.startsWith('9')) {
      cleanNumbers = numbers;
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
  };

  const handleUpdate = async () => {
    setSaving(true);
    setFeedback(null);
    const digits = formData.phone.replace(/\D/g, '');
    let cleanDigits = digits;
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      cleanDigits = digits.substring(1);
    }
    const phoneToSave = cleanDigits ? '7' + cleanDigits : '';

    try {
      const res = await fetch(`/api/admin/staff/${member.orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: phoneToSave })
      });
      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Изменения сохранены!' });
        triggerRefresh();
        setTimeout(() => {
          setFeedback(null);
          setIsDetailsExpanded(false);
          setSelectedAppointment(null);
        }, 1500);
      } else {
        const errorData = await res.json();
        setFeedback({ type: 'error', msg: errorData.error || 'Ошибка при сохранении' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: 'Ошибка связи с сервером' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-graphite-light rounded-r-3xl overflow-hidden shadow-2xl border-l border-white/5">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-orange/20 rounded-lg flex items-center justify-center border border-accent-orange/30">
            <User className="w-4 h-4 text-accent-orange" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">выбранный аккаунт</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">{formData.user_name}</div>
          </div>
        </div>
        <button 
          onClick={() => setIsDetailsExpanded(false)}
          className="p-1.5 bg-accent-orange/10 hover:bg-accent-orange/20 rounded-lg transition-all text-accent-orange border border-accent-orange/20"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
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

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <User className="w-3 h-3" /> Ф.И.О.
            </label>
            <input
              type="text"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Phone className="w-3 h-3" /> Телефон
            </label>
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl group focus-within:border-accent-orange/50 transition-colors overflow-hidden">
              <span className="pl-3 text-white/40 font-mono text-[10px] tracking-tight">+7</span>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full bg-transparent py-2 px-2 outline-none text-xs text-white font-mono placeholder:text-gray-600" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Логин</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Пароль</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="h-px bg-white/5 my-4" />

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Роль
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={member?.role === 'администратор'}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="работник">Работник</option>
              <option value="менеджер">Менеджер</option>
              <option value="администратор">Администратор</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Building className="w-3 h-3" /> Доступ
            </label>
            <select
              name="access"
              value={formData.access}
              onChange={handleChange}
              disabled={member?.role === 'администратор' || formData.role === 'администратор' || formData.role === 'менеджер'}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="Слесарный ремонт и ТО">Слесарный ремонт и ТО</option>
              <option value="Электрика и диагностика">Электрика и диагностика</option>
              <option value="Детейлинг и покрытия">Детейлинг и покрытия</option>
              <option value="">Без привязки (для менеджеров)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" /> Бокс
            </label>
            <select
              name="box"
              value={formData.box}
              onChange={handleChange}
              disabled={member?.role === 'администратор' || formData.role === 'администратор' || formData.role === 'менеджер'}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-accent-orange/50 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="Бокс А">Бокс А</option>
              <option value="Бокс Б">Бокс Б</option>
              <option value="Бокс В">Бокс В</option>
              <option value="">Без привязки</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="w-full py-3 bg-accent-orange hover:bg-accent-orange-light rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(255,107,0,0.3)] disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : (
            <>
              <Save className="w-4 h-4" /> Сохранить изменения
            </>
          )}
        </button>
      </div>
    </div>
  );
}
