import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, HelpCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  q: string;
  a: string;
  category: string;
  isExternal?: boolean;
}

const faqData: FaqItem[] = [
  {
    q: 'Какую гарантию вы предоставляете на работы?',
    a: 'Мы предоставляем официальную письменную гарантию до 2 лет на все слесарные работы и установленные запчасти, при условии приобретения комплектующих в нашем центре.',
    category: 'Гарантия'
  },
  {
    q: 'Сколько времени занимает компьютерная диагностика?',
    a: 'Стандартная комплексная диагностика всех электронных систем занимает от 30 до 50 минут. По результатам вы получаете подробный цифровой отчет на электронную почту или в мессенджер.',
    category: 'Диагностика'
  },
  {
    q: 'Нужно ли записываться заранее?',
    a: 'Мы рекомендуем записываться минимум за 2-3 дня для планового ТО. Однако для экстренных случаев у нас всегда есть дежурный мастер-приемщик.',
    category: 'Запись'
  },
  {
    q: 'Что такое нано-керамика и как она работает?',
    a: 'Нано-керамика — это инновационное защитное покрытие, которое вступает в реакцию с ЛКП на молекулярном уровне, создавая сверхпрочный слой, защищающий от химии, УФ-лучей и мелких царапин.',
    category: 'Детейлинг'
  },
  {
    q: 'Можно ли присутствовать при ремонте?',
    a: 'Да, в нашем центре организована безопасная зона просмотра. Вы также можете наблюдать за процессом через систему видеонаблюдения, находясь в комфортной клиентской зоне.',
    category: 'Прочее'
  },
  {
    q: 'Работаете ли вы с автомобилями на гарантии дилера?',
    a: 'Да, AUTOTECH SOLUTIONS — сертифицированный техцентр. Обслуживание у нас полностью сохраняет заводскую гарантию вашего автомобиля согласно законодательству.',
    category: 'Гарантия'
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [remoteFaq, setRemoteFaq] = useState<FaqItem[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  useEffect(() => {
    const fetchRemoteFaq = async () => {
      setIsLoadingRemote(true);
      try {
        const response = await fetch('/api/faq/external');
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setRemoteFaq(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch remote FAQ:', error);
      } finally {
        setIsLoadingRemote(false);
      }
    };

    fetchRemoteFaq();
  }, []);

  const allFaqData = [...faqData, ...remoteFaq];

  const handleAskChat = () => {
    const event = new CustomEvent('open-autotech-chat', { 
      detail: { message: searchTerm } 
    });
    window.dispatchEvent(event);
  };

  const filteredFaq = allFaqData.filter(item => {
    const matchesSearch = item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.a.toLowerCase().includes(searchTerm.toLowerCase());
    
    // External items only show if there is an active search
    if (item.isExternal) {
      return searchTerm.trim() !== '' && matchesSearch;
    }
    
    // Local items follow normal search behavior (show all if empty, filter otherwise)
    return matchesSearch;
  });

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[70vh]">
      <div className="text-center mb-16">
        <HelpCircle className="w-12 h-12 text-accent-orange mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Вопросы и ответы</h1>
        <p className="text-gray-400">Найдите ответы на часто задаваемые вопросы об обслуживании в нашем центре</p>
      </div>

      <div className="relative mb-12">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isLoadingRemote ? (
            <Loader2 className="w-5 h-5 text-accent-orange animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <input 
          type="text" 
          placeholder="Поиск по вопросам (включая базу знаний)..." 
          className="w-full bg-graphite-light border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none transition-all shadow-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item, idx) => (
            <div key={idx} className="glass-card rounded-2xl overflow-hidden border-white/5">
              <button 
                onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex gap-4 items-center">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                     <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded w-fit ${item.isExternal ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-accent-orange/10 text-accent-orange'}`}>
                       {item.category}
                     </span>
                     <span className="font-bold text-lg">{item.q}</span>
                   </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${activeIndex === idx ? 'rotate-180 text-accent-orange' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-0">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            {isLoadingRemote ? 'Загрузка базы знаний...' : 'По вашему запросу ничего не найдено. Попробуйте изменить формулировку.'}
          </div>
        )}
      </div>

      <div className="mt-20 p-8 rounded-3xl bg-accent-blue/5 border border-accent-blue/10 text-center">
        <h3 className="text-xl font-bold mb-2">Не нашли ответ на свой вопрос?</h3>
        <p className="text-gray-400 mb-6">Задайте свой вопрос в чате с нашим ассистентом.</p>
        <button 
          onClick={handleAskChat}
          className="inline-block px-8 py-3 bg-accent-blue hover:bg-blue-600 rounded-xl text-sm font-bold transition-all neon-glow-blue text-white cursor-pointer"
        >
          ЗАДАТЬ ВОПРОС
        </button>
      </div>
    </div>
  );
}
