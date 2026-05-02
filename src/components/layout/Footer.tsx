import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Phone, Mail, MapPin, Instagram, Facebook, Send, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginModal from '../auth/LoginModal';
import { useAuthStore } from '../../store/useAuthStore';

export default function Footer() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleSocialClick = (e: React.MouseEvent) => {
    if (location.pathname === '/contacts') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black border-t border-white/5 pt-20 pb-10">
      <AnimatePresence>
        {isPrivacyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsPrivacyOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-graphite-light w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Политика конфиденциальности</h2>
                  <div className="h-1 w-20 bg-accent-orange" />
                </div>
                
                <div className="prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed space-y-6">
                  <section>
                    <h3 className="text-white font-bold text-lg mb-3 uppercase tracking-wider text-xs">1. Общие положения</h3>
                    <p>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных AUTOTECH SOLUTIONS (далее — Оператор).</p>
                  </section>
                  
                  <section>
                    <h3 className="text-white font-bold text-lg mb-3 uppercase tracking-wider text-xs">2. Цели обработки</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Информирование Пользователя посредством отправки электронных писем и звонков;</li>
                      <li>Заключение, исполнение и прекращение гражданско-правовых договоров;</li>
                      <li>Предоставление доступа Пользователю к сервисам, информации и/или материалам, содержащимся на веб-сайте.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h3 className="text-white font-bold text-lg mb-3 uppercase tracking-wider text-xs">3. Персональные данные</h3>
                    <p>Оператор может обрабатывать следующие персональные данные Пользователя: Фамилия, имя, отчество; Номер телефона; Электронный адрес; Сведения об автомобиле (марка, модель, госномер).</p>
                  </section>
                  
                  <section>
                    <h3 className="text-white font-bold text-lg mb-3 uppercase tracking-wider text-xs">4. Заключительные положения</h3>
                    <p>Пользователь может получить любые разъяснения по интересующим вопросам, касающимся обработки его персональных данных, обратившись к Оператору с помощью электронной почты info@autotech-sol.ru. Актуальная версия Политики в свободном доступе расположена в сети Интернет по адресу текущей страницы.</p>
                  </section>
                </div>
                
                <button 
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-full py-4 bg-accent-orange hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                >
                  ПРИНЯТЬ И ЗАКРЫТЬ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-orange rounded flex items-center justify-center">
                <Settings className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-display font-bold tracking-tighter text-white">
                AUTOTECH <span className="text-accent-orange">SOLUTIONS</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Премиальное высокотехнологичное обслуживание вашего автомобиля. Цифровая диагностика и инновационные решения для вашей безопасности.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/contacts" 
                onClick={handleSocialClick}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-orange hover:border-accent-orange transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                to="/contacts" 
                onClick={handleSocialClick}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-orange hover:border-accent-orange transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link 
                to="/contacts" 
                onClick={handleSocialClick}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-orange hover:border-accent-orange transition-colors"
              >
                <Send className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Навигация</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link to="/services" className="hover:text-white transition-colors">Услуги</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">О компании</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Вопросы и ответы</Link></li>
              <li><Link to="/contacts" className="hover:text-white transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Услуги</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li>Слесарный ремонт</li>
              <li>Электрика и диагностика</li>
              <li>Детейлинг и покрытия</li>
              <li>Тюнинг и доп. оборудование</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Контакты</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-accent-orange" />
                +7 (495) 123-45-67
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-accent-orange" />
                info@autotech-sol.ru
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-accent-orange mt-0.5" />
                г. Москва, ул. Технологическая, 42
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex flex-col gap-2">
            <p>© 2026 AUTOTECH SOLUTIONS. Все права защищены.</p>
            {!isAuthenticated && (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 hover:text-white transition-colors w-fit group"
              >
                <LogIn className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                Вход
              </button>
            )}
            {isAuthenticated && (
              <Link to="/admin" className="hover:text-white transition-colors">
                Личный кабинет администратора
              </Link>
            )}
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => setIsPrivacyOpen(true)} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Политика конфиденциальности
            </button>
            <span className="cursor-default">Публичная оферта</span>
          </div>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </footer>
  );
}
