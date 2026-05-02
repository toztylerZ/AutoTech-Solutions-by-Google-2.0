import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Cpu, Play, ArrowRight, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';

const VIDEO_URL = "https://drive.google.com/file/d/1Kt8lX3nPIVYLS_xtxRcyJ5R1zF8EYjD7/preview";

const features = [
  {
    icon: <Cpu className="w-8 h-8 text-accent-blue" />,
    title: 'Диагностика',
    desc: 'Использование новейших сканеров и ПО для выявления скрытых неисправностей.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop'
  },
  {
    icon: <Zap className="w-8 h-8 text-accent-orange" />,
    title: 'Техническое обслуживание',
    desc: 'Регулярный сервис по заводским стандартам с сохранением гарантии.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800&auto=format&fit=crop'
  },
  {
    icon: <Shield className="w-8 h-8 text-neon-blue" />,
    title: 'Защитные покрытия',
    desc: 'Нано-керамика и полиуретановые пленки для идеального вида вашего кузова.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop'
  },
];

const stats = [
  { label: 'Лет опыта', value: '12+' },
  { label: 'Довольных клиентов', value: '5000+' },
  { label: 'Марок авто', value: '45+' },
  { label: 'Гарантия', value: '2 года' },
];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  const scrollToVideo = () => {
    videoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="overflow-hidden">
      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                <a
                  href={VIDEO_URL.replace('/preview', '/view')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-black/50 hover:bg-black/80 rounded-lg text-xs font-bold transition-all border border-white/10"
                >
                  ОТКРЫТЬ В GOOGLE DRIVE
                </a>
              </div>
              <iframe
                src={VIDEO_URL}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="AUTOTECH SOLUTIONS Video"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center py-20 lg:py-0">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1625047509168-a7026f36fe04?q=80&w=2000&auto=format&fit=crop"
            alt="VW Passat Hi-Tech Garage"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-8 bg-accent-orange" />
                <span className="text-accent-orange font-mono text-sm tracking-widest uppercase">
                  Premium Auto Service
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
                Технологии на службе <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-orange to-orange-400">качества</span>
              </h1>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed font-light">
                Цифровая диагностика, нано-покрытия и экспертное обслуживание вашего автомобиля. Мы меняем представление о современном автосервисе.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/services"
                  className="px-8 py-4 bg-accent-orange hover:bg-orange-600 rounded-lg font-bold flex items-center gap-2 transition-all hover:gap-4 neon-glow-orange text-white"
                >
                  НАШИ УСЛУГИ <ArrowRight className="w-5 h-5" />
                </Link>
                <button 
                  onClick={scrollToVideo}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-lg font-bold border border-white/10 flex items-center gap-2 transition-all text-white"
                >
                  СМОТРЕТЬ ВИДЕО <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -150 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: "circOut", delay: 1.0 }}
              className="relative block mt-12 lg:mt-0"
            >
              <img 
                src="https://drive.google.com/thumbnail?id=1lFARl_rcc2jVm1E5VJZM3acOumpiPeaL&sz=w1280" 
                alt="AUTOTECH Service Center" 
                className="rounded-3xl shadow-2xl relative z-0 border border-white/10" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>

        {/* Floating Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-px h-16 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Направления работы</h2>
              <p className="text-gray-400">Мы используем передовое оборудование и сертифицированные материалы для обеспечения долговечности вашего авто.</p>
            </div>
            <Link to="/services" className="hidden md:flex items-center gap-2 text-accent-blue font-bold hover:gap-4 transition-all">
              ВСЕ УСЛУГИ <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="group relative h-[400px] rounded-2xl overflow-hidden glass-card border-none transition-all cursor-default flex flex-col"
              >
                {/* Background Image with Vignette */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 grayscale contrast-125"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_#000_100%] opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-graphite/40 to-graphite" />
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col">
                  <div className="mb-6 transition-transform group-hover:scale-110 duration-500 w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-accent-orange transition-colors min-h-[3rem] flex items-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-grow">
                    {feature.desc}
                  </p>
                  <div className="mt-auto">
                    <div className="h-px w-0 bg-accent-orange group-hover:w-full transition-all duration-500 mb-4" />
                    <div className="flex justify-end h-6">
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal', { 
                          detail: { comment: feature.title } 
                        }))}
                        className="text-xs font-bold text-accent-orange uppercase tracking-widest hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                      >
                        записаться <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Placeholder Section */}
      <section ref={videoSectionRef} className="py-24 bg-graphite-light overflow-hidden relative scroll-mt-20">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8 leading-tight">
                Посмотрите, как мы <span className="text-accent-blue">заботимся</span> о вашем автомобиле
              </h2>
              <ul className="space-y-6 mb-10">
                {[
                  'Соблюдение регламентов производителей',
                  'Команда сертифицированных экспертов',
                  'Современное диагностическое оборудование',
                  'Комфортная зона ожидания для клиентов'
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-accent-blue" />
                    </div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-black border border-white/5">
              <iframe
                src={VIDEO_URL}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                title="AUTOTECH SOLUTIONS Video Player"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Block */}
      <section className="py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-12">
            Используем только лучшие расходные материалы и запчасти
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-16 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
             {[
               { name: 'Motul', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Motul_logo.svg' },
               { name: 'Mobil 1', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Mobil_1_logo.svg' },
               { name: 'Bosch', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Bosch-logo.svg' },
               { name: 'Brembo', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Brembo_logo.svg' },
               { name: 'Shell', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Shell_logo.svg' },
               { name: 'Liqui Moly', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Liqui_Moly_Logo.svg' }
             ].map((brand) => (
               <div key={brand.name} className="flex justify-center group flex-col items-center gap-3">
                 <img 
                   src={brand.logo} 
                   alt={brand.name} 
                   className="h-6 md:h-8 w-auto object-contain brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all duration-500" 
                   referrerPolicy="no-referrer"
                 />
                 <span className="text-[10px] font-mono uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity text-accent-orange">
                   {brand.name}
                 </span>
               </div>
             ))}
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-display font-bold text-accent-orange mb-2">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
