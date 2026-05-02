import { motion } from 'motion/react';
import { Wrench, Zap, Sparkles, Activity, Settings2, Paintbrush, Gauge, Wind, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const serviceCategories = [
  {
    title: 'Слесарный ремонт',
    icon: <Wrench className="w-6 h-6" />,
    services: [
      { name: 'Ремонт двигателя', desc: 'Капитальный ремонт и настройка ДВС.', time: 'от 2 дней', icon: <Activity />, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop' },
      { name: 'Ходовая часть', desc: 'Диагностика и замена элементов подвески.', time: '1-3 часа', icon: <Settings2 />, image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop' },
      { name: 'Тормозная система', desc: 'Замена колодок, дисков и обслуживание суппортов.', time: '1 час', icon: <ShieldCheck />, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop' },
    ]
  },
  {
    title: 'Электрика и диагностика',
    icon: <Zap className="w-6 h-6" />,
    services: [
      { name: 'Цифровая диагностика', desc: 'Полное сканирование всех систем автомобиля.', time: '40 мин', icon: <Gauge />, image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800&auto=format&fit=crop' },
      { name: 'Ремонт ЭБУ', desc: 'Прошивка и восстановление электронных блоков.', time: 'от 3 часов', icon: <Zap />, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop' },
      { name: 'Климатические системы', desc: 'Заправка и ремонт кондиционеров.', time: '1 час', icon: <Wind />, image: 'https://images.unsplash.com/photo-1504222490345-c075b6008014?q=80&w=800&auto=format&fit=crop' },
    ]
  },
  {
    title: 'Детейлинг и покрытия',
    icon: <Sparkles className="w-6 h-6" />,
    services: [
      { name: 'Нано-керамика', desc: 'Нанесение многослойной защиты кузова.', time: '6-8 часов', icon: <Sparkles />, image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop' },
      { name: 'Полировка кузова', desc: 'Восстановление заводского блеска и устранение царапин.', time: '4-6 часов', icon: <Paintbrush />, image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800&auto=format&fit=crop' },
      { name: 'Химчистка салона', desc: 'Глубокая очистка интерьера паром и химией.', time: 'от 5 часов', icon: <Sparkles />, image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=800&auto=format&fit=crop' },
    ]
  }
];

const specialOffers = [
  {
    title: 'Полная проверка перед сезоном',
    desc: 'Комплексная диагностика всех узлов и замена рабочих жидкостей со скидкой 20%.',
    price: 'от 4 500 ₽',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'Комплексная нано-защита',
    desc: 'Нанесение керамики + антидождь + полировка фар в одном пакете услуг.',
    price: 'от 12 000 ₽',
    image: 'https://images.unsplash.com/photo-1605515298946-d062f2e9da53?q=80&w=800&auto=format&fit=crop'
  }
];

export default function Services() {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <span className="text-accent-orange font-mono text-sm uppercase tracking-widest font-bold">Наши услуги</span>
        <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6">Сервис высшего уровня</h1>
        <div className="tech-line max-w-xs mx-auto mb-6" />
        <p className="text-gray-400 max-w-2xl mx-auto">
          Мы предлагаем полный спектр работ по обслуживанию вашего автомобиля, используя только сертифицированные инструменты и программное обеспечение.
        </p>
      </motion.div>

      <div className="space-y-32">
        {serviceCategories.map((category, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-graphite-light border border-white/10 rounded-xl flex items-center justify-center text-accent-blue shadow-lg">
                {category.icon}
              </div>
              <h2 className="text-3xl font-bold">{category.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.services.map((service, sIdx) => (
                <motion.div
                  key={sIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="group relative h-[360px] rounded-2xl overflow-hidden glass-card border-none flex flex-col"
                >
                  {/* Background Image with Vignette */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={service.image} 
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 grayscale contrast-125"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_#000_100%] opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-graphite/40 to-graphite" />
                  </div>

                  <div className="relative z-10 p-8 h-full flex flex-col">
                    <div className="w-10 h-10 mb-6 text-gray-400 group-hover:text-accent-blue transition-colors">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-accent-orange transition-colors duration-300">{service.name}</h3>
                    <p className="text-gray-300 text-sm mb-6 leading-relaxed flex-grow">
                      {service.desc}
                    </p>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-auto">
                      <span className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                         ВРЕМЯ: <span className="text-white">{service.time}</span>
                      </span>
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal', { 
                          detail: { comment: service.name } 
                        }))}
                        className="text-xs font-bold text-accent-blue hover:text-white transition-colors border-b border-accent-blue/0 hover:border-white"
                      >
                        ЗАПИСАТЬСЯ
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-32">
        <h2 className="text-3xl font-bold mb-12 text-center">Спецпредложения</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {specialOffers.map((offer, i) => (
            <div key={i} className="relative overflow-hidden group p-8 rounded-3xl min-h-[300px] flex flex-col justify-center border border-accent-orange/20">
              {/* Background Image with Vignette */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={offer.image} 
                  alt={offer.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 grayscale contrast-125"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_#000_100%] opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-graphite/40 to-graphite" />
              </div>

              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-accent-orange text-[10px] font-bold text-white rounded mb-4 uppercase tracking-wider">
                  Special Offer
                </div>
                <h3 className="text-2xl font-bold mb-4">{offer.title}</h3>
                <p className="text-gray-300 mb-8 max-w-md">{offer.desc}</p>
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-display font-bold text-accent-orange">{offer.price}</span>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal', { 
                      detail: { comment: offer.title } 
                    }))}
                    className="px-6 py-2 bg-accent-orange hover:bg-orange-600 rounded-lg text-sm font-bold transition-all neon-glow-orange text-white"
                  >
                    ПОЛУЧИТЬ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
