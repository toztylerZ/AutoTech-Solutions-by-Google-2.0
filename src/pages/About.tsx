import { motion } from 'motion/react';
import { Target, Users, History, Rocket, ShieldCheck } from 'lucide-react';

const team = [
  { name: 'Алексей Волков', role: 'Ведущий инженер', img: 'https://drive.google.com/thumbnail?id=1QKQLAoS7ibs9VmKxIHZsRfaoU0KU800t&sz=w800' },
  { name: 'Сергей Петров', role: 'Мастер-диагност', img: 'https://drive.google.com/thumbnail?id=14oAMo3fi4O_C9M7h12xDpwaMwg8OIVF4&sz=w800' },
  { name: 'Дмитрий Соколов', role: 'Специалист по детейлингу', img: 'https://drive.google.com/thumbnail?id=1qfi3aXyS0CayQtd-nQwb_ZZssQBzf8y8&sz=w800' },
  { name: 'Иван Кравцов', role: 'Механик высшей категории', img: 'https://drive.google.com/thumbnail?id=1v8SU6OSPp5joi0tgAf_vBcL2Hq9qGiJg&sz=w800' },
];

export default function About() {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           className="relative z-10"
        >
          <span className="text-accent-blue font-mono text-sm uppercase tracking-widest font-bold">О нас</span>
          <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-8 leading-tight">Инновации в каждом <span className="text-accent-blue">движении</span></h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            История AUTOTECH SOLUTIONS началась 15 лет назад в небольшой мастерской. Пройдя путь от традиционного слесарного цеха до ультрасовременного технологичного центра, мы всегда руководствовались одной целью — обеспечить идеальное состояние вашего автомобиля.
          </p>
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-3xl font-display font-bold text-white mb-1">2012</span>
              <span className="text-gray-500 text-xs uppercase tracking-widest">Основание</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-display font-bold text-white mb-1">2018</span>
              <span className="text-gray-500 text-xs uppercase tracking-widest">Hi-Tech поворот</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-display font-bold text-white mb-1">2026</span>
              <span className="text-gray-500 text-xs uppercase tracking-widest">Лидер отрасли</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
           className="relative"
           initial={{ opacity: 0, x: -150 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 1.2, ease: "circOut", delay: 1.0 }}
        >
          <img 
            src="https://drive.google.com/thumbnail?id=1VkOj75v2JG1UQiq92b7Op4FM2Z3oPOjb&sz=w1280" 
            alt="AUTOTECH SOLUTIONS High-Tech Workshop" 
            className="rounded-3xl shadow-2xl transition-all duration-700 relative z-0" 
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-accent-blue" />
          </div>
          <h3 className="text-xl font-bold mb-4">Наша миссия</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Обеспечение безопасности и комфорта водителей через внедрение инновационных технологий обслуживания.
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-accent-orange" />
          </div>
          <h3 className="text-xl font-bold mb-4">Наша команда</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Мастера высшей квалификации, прошедшие обучение в ведущих технических центрах Европы и Азии.
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-neon-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-8 h-8 text-neon-blue" />
          </div>
          <h3 className="text-xl font-bold mb-4">Наш подход</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Мы не просто чиним, мы анализируем данные, чтобы предотвратить будущие поломки и продлить жизнь авто.
          </p>
        </div>
      </div>

      <section className="mb-32">
        <h2 className="text-3xl font-bold mb-16 text-center">Команда экспертов</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-2xl mb-6 relative group">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                </div>
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{member.name}</h4>
              <p className="text-gray-500 text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
