import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, MapPin, Clock, Send, Instagram, Facebook, Youtube, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

export default function Contacts() {
  const [searchParams] = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    car: '',
    comment: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    const commentParam = searchParams.get('comment');
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    
    if (commentParam || dateParam || timeParam) {
      setFormData(prev => ({ 
        ...prev, 
        comment: commentParam || prev.comment,
        date: dateParam || prev.date,
        time: timeParam || prev.time
      }));
    }
  }, [searchParams]);
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
    
    // Если введено 11 цифр и начинается на 7 или 8
    if (numbers.length === 11 && (numbers.startsWith('7') || numbers.startsWith('8'))) {
      cleanNumbers = numbers.substring(1);
    } 
    // Если введено 10 цифр и начинается на 9
    else if (numbers.length === 10 && numbers.startsWith('9')) {
      cleanNumbers = numbers;
    }
    // Для всех остальных случаев или если вставили длинный номер
    else if (numbers.length > 10) {
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
      setStatus({ type: 'error', message: 'Пожалуйста, заполните имя, номер телефона (10 цифр после +7) и вашу ЗАЯВКУ.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    // Формируем полный номер для отправки (7XXXXXXXXXX)
    const fullPhone = '7' + digits;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // Slightly more than server timeout

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
        
        // Trigger ChatWidget with pre-loaded information
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

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {status.type && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-4 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
              status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            } backdrop-blur-md`}
          >
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{status.message}</span>
            <button onClick={() => setStatus({ type: null, message: '' })} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
              <AlertCircle className="w-4 h-4 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Свяжитесь с нами</h1>
        <p className="text-gray-400 max-w-2xl mx-auto italic">
          Мы всегда на связи, чтобы обеспечить бесперебойную работу вашего автомобиля.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-8 rounded-3xl border-white/5 space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-accent-orange" />
              </div>
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Телефон</h3>
                <p className="text-xl font-bold text-white">+7 (495) 123-45-67</p>
                <p className="text-sm text-gray-400 mt-1">Ежедневно с 9:00 до 21:00</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">E-mail</h3>
                <p className="text-xl font-bold text-white">info@autotech-sol.ru</p>
                <p className="text-sm text-gray-400 mt-1">Для общих вопросов</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Адрес</h3>
                <p className="text-xl font-bold text-white">г. Москва, ул. Технологическая, 42</p>
                <p className="text-sm text-gray-400 mt-1">Техцентр «Сколково»</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-neon-blue" />
              </div>
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Режим работы</h3>
                <p className="text-xl font-bold text-white">Пн - Вс: 09:00 - 21:00</p>
                <p className="text-sm text-gray-400 mt-1">Без перерывов и выходных</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <button 
               onClick={scrollToTop}
               className="flex-grow glass-card py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-accent-orange transition-all font-bold text-sm"
             >
               <Send className="w-4 h-4" /> TELEGRAM
             </button>
             <button 
               onClick={scrollToTop}
               className="flex-grow glass-card py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all font-bold text-sm"
             >
               <Phone className="w-4 h-4" /> WHATSAPP
             </button>
          </div>
          
          <div className="flex justify-center gap-6 pt-4 text-gray-500">
             <button onClick={scrollToTop} className="hover:text-white cursor-pointer transition-colors">
               <Instagram />
             </button>
             <button onClick={scrollToTop} className="hover:text-white cursor-pointer transition-colors">
               <Facebook />
             </button>
             <button onClick={scrollToTop} className="hover:text-white cursor-pointer transition-colors">
               <Youtube />
             </button>
          </div>
        </div>

        <div className="lg:col-span-2 scroll-mt-32" id="booking-form">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 rounded-3xl border-white/5"
          >
            <h2 className="text-3xl font-bold mb-8">Онлайн запись</h2>
            <div className="relative">
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
              <p className="text-[10px] text-center text-gray-500">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности и обработки персональных данных.
              </p>
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
      </div>

      {/* Map Section */}
      <section className="mb-20">
        <div className="relative rounded-3xl overflow-hidden h-96 bg-gray-900 border border-white/5 shadow-2xl group">
           {/* Leaflet Map with disabled interactions except zoom buttons */}
           <div className="w-full h-full" style={{ filter: 'grayscale(1) invert(0.92) contrast(1.2) brightness(0.8)' }}>
              <MapContainer 
                center={[55.7115, 37.5450]} 
                zoom={16} 
                className="w-full h-full"
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </MapContainer>
           </div>
           
           {/* Custom Orange Marker Overlay */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-accent-orange/40 rounded-full blur-xl animate-pulse" />
                <MapPin className="text-accent-orange w-10 h-10 relative z-10 drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
              </div>
           </div>

           {/* Fallback overlay for tech styling */}
           <div className="absolute inset-0 pointer-events-none border-[20px] border-graphite/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

           <div className="absolute bottom-8 left-8 glass-card p-6 rounded-2xl hidden md:block max-w-xs border border-white/10">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-orange" /> Найти нас легко
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                г. Москва, ул. Технологическая, 42. <br/>
                Въезд со стороны Технологического проезда через КПП «Альфа». Бесплатная парковка для клиентов.
              </p>
           </div>
        </div>
      </section>
    </div>
  );
}
