import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Settings } from 'lucide-react';

export default function BookingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    car: '',
    comment: '',
    date: '',
    time: ''
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleChatStatus = (e: any) => {
      setIsChatOpen(e.detail.isOpen);
    };
    window.addEventListener('autotech-chat-status', handleChatStatus);
    return () => window.removeEventListener('autotech-chat-status', handleChatStatus);
  }, []);

  useEffect(() => {
    const handleOpen = (e: any) => {
      const { comment, date, time } = e.detail || {};
      setFormData(prev => ({
        ...prev,
        comment: comment || prev.comment,
        date: date || prev.date,
        time: time || prev.time
      }));
      setIsOpen(true);
    };

    window.addEventListener('open-booking-modal', handleOpen);
    return () => window.removeEventListener('open-booking-modal', handleOpen);
  }, []);

  const formatPhoneNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let res = '';
    if (numbers.length > 0) {
      res += '(' + numbers.substring(0, 3);
      if (numbers.length >= 3) res += ') ';
      if (numbers.length > 3) res += numbers.substring(3, 6);
      if (numbers.length >= 6) res += '-';
      if (numbers.length > 6) res += numbers.substring(6, 8);
      if (numbers.length >= 8) res += '-';
      if (numbers.length > 8) res += numbers.substring(8, 10);
    }
    return res;
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

    const formatted = formatPhoneNumberInput(cleanNumbers);
    setPhoneNumber(formatted);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (!formData.name || digits.length !== 10 || !formData.comment.trim()) {
      setStatus({ type: 'error', message: 'Пожалуйста, заполните имя, номер телефона и вашу ЗАЯВКУ.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    const fullPhone = '7' + digits;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    try {
      const sessionId = sessionStorage.getItem('autotech_session_id') || `direct_${Date.now()}`;
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: fullPhone,
          sessionId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let result: any = {};
      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Booking failed with non-json response:', text.substring(0, 500));
        throw new Error('Сервер вернул ошибку. Пожалуйста, попробуйте позже.');
      }

      if (response.ok) {
        setStatus({ type: 'success', message: result.message || 'Заявка успешно отправлена!' });
        
        const chatMessage = `Я отправил(а) заявку на онлайн-запись.
Мое имя: ${formData.name}
Телефон: ${fullPhone}
Автомобиль: ${formData.car || 'Не указан'}
Желаемая дата: ${formData.date || 'Не выбрана'}
Желаемое время: ${formData.time || 'Не выбрано'}
ЗАЯВКА: ${formData.comment}

Пожалуйста, помогите мне подтвердить запись и категорию услуги.`;
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-autotech-chat', { 
            detail: { message: chatMessage, hidden: true } 
          }));
        }, 3000);

        setFormData({ name: '', car: '', comment: '', date: '', time: '' });
        setPhoneNumber('');
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Произошла ошибка при отправке.' });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus({ type: 'error', message: 'Превышено время ожидания. Попробуйте еще раз.' });
      } else {
        setStatus({ type: 'error', message: 'Ошибка сети. Попробуйте позже.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass-card rounded-3xl border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Онлайн запись</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>

              <form 
                className={`space-y-6 transition-all duration-300 ${isChatOpen ? 'opacity-30 blur-[1px] pointer-events-none' : ''}`} 
                onSubmit={handleSubmit}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                      Ваше имя
                      <span className="text-accent-orange text-[10px]">*обязательно</span>
                    </label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent-orange transition-colors" 
                      placeholder="Иван Иванов" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                      Телефон
                      <span className="text-accent-orange text-[10px]">*обязательно</span>
                    </label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl group focus-within:border-accent-orange transition-colors overflow-hidden">
                      <span className="pl-4 text-white/50 font-mono text-sm tracking-tight">+7</span>
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className="w-full bg-transparent py-3 px-2 outline-none text-white font-mono placeholder:text-gray-600" 
                        placeholder="(999) 000-00-00" 
                        maxLength={15}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Марка и модель авто</label>
                    <input 
                      type="text" 
                      name="car"
                      value={formData.car}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent-orange transition-colors" 
                      placeholder="BMW M5" 
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-[1.4] space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                        Дата
                      </label>
                      <input 
                        type="date"
                        name="date"
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent-orange transition-colors" 
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                        Время
                      </label>
                      <select 
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent-orange transition-colors appearance-none"
                      >
                        <option value="" className="bg-graphite">Выбрать</option>
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                          <option key={t} value={t} className="bg-graphite">{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                    ЗАЯВКА
                    <span className="text-accent-orange text-[10px]">*обязательно</span>
                  </label>
                  <textarea 
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    rows={4} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent-orange transition-colors" 
                    placeholder="Опишите проблему или пожелания..."
                  ></textarea>
                </div>

                {status.message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-xl flex items-center gap-3 border ${
                      status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm">{status.message}</span>
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 bg-accent-orange hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-all transform active:scale-95 neon-glow-orange uppercase tracking-widest flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Settings className="w-5 h-5" />
                      </motion.div>
                      Отправка...
                    </>
                  ) : 'Отправить заявку'}
                </button>
              </form>
              {isChatOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <div className="bg-graphite/80 backdrop-blur-sm border border-accent-orange/30 px-6 py-4 rounded-2xl shadow-2xl text-center max-w-[250px]">
                    <p className="text-sm font-bold text-white mb-1">ФОРМА НЕАКТИВНА</p>
                    <p className="text-[10px] text-gray-400">Пожалуйста, сверните окно чата, чтобы продолжить заполнение записи.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
