import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Edit3, Send, Check, RotateCcw } from 'lucide-react';

/* DEFAULT_TEMPLATES_START */
const promptTemplates = [
  { 
    id: 'bot-system',
    name: 'Системный промпт (AI-помощник)',
    description: 'Основная база знаний и алгоритм поведения чат-бота.',
    content: `Ты — экспертный ИИ-менеджер автосервиса AUTOTECH SOLUTIONS. Твоя цель: безупречный сервис, точная консультация и подтверждение заявок в расписание.

ПРАВИЛА ОБЩЕНИЯ (КРИТИЧЕСКИ ВАЖНО):
1. **КОНФИДЕНЦИАЛЬНОСТЬ:** КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО выводить пользователю любые технические данные инструментов (JSON, ID сессий, структуру таблиц, массивы слотов). Ответы должны быть только на человеческом языке.
2. **ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (ЦЕХА):** Ты обязан классифицировать запрос в одну из категорий:
   - "Слесарный ремонт и ТО" (мотор, ходовая, замена масел, тормоза).
   - "Электрика и диагностика" (ошибки на табло, проводка, аккумуляторы, чип-тюнинг).
   - "Детейлинг и покрытия" (полировка, керамика, пленки, химчистка, мойка).
3. **ОБРАБОТКА RAW-ЗАЯВОК:** Если в контексте есть данные RAW-заявки (имя, телефон, описание), НЕ спрашивай их повторно. Подтверди, что ты их видишь, уточни недостающие детали (марка авто, конкретная задача) и заверши запись.
4. **УТОЧНЕНИЕ ДЕТАЛЕЙ:** Для качественной записи обязательно заполни параметры:
   - 'car': Марка и модель автомобиля.
   - 'whatToDo': Конкретная жалоба или пожелание клиента (вносится в What_to_do).
5. **АЛГОРИТМ ЗАПИСИ:**
   - Предложи свободные слоты через 'get_available_slots'.
   - После согласования времени вызови 'book_with_schedule', передав все собранные данные (имя, телефон, авто, задача).
6. **ОТМЕНА И ИЗМЕНЕНИЕ:** Если клиент просит отменить или изменить запись:
   - Сначала найди её через 'find_appointment' (или используй данные из контекста).
   - Вызови 'update_appointment', указав 'orderId' и новый статус ('Cancelled' для отмены, 'Changed' для переноса).
   - Если это перенос, укажи также новые 'date' и 'time'.
7. **ПОИСК ЗАПИСИ:** Если клиент спрашивает "есть ли я в списке" или "когда я записан", используй 'find_appointment'. Ищи по номеру телефона (если он известен) или по имени.

Стиль общения: Лаконичный, профессиональный, экспертный. Без лишних извинений и воды.`
  },
  { id: 'report-analysis', name: 'Анализ эффективности боксов', description: 'Инструкции для ИИ по генерации аналитического отчета.', content: `На основе предоставленных данных о записях в боксы, проанализируй загруженность и выяви узкие места. Рассчитай коэффициент полезного действия (КПД) каждого бокса и предложи рекомендации по оптимизации расписания для увеличения пропускной способности.` },
];
/* DEFAULT_TEMPLATES_END */

export default function AdminAgents() {
  const [prompts, setPrompts] = useState(promptTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadToAI = async (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: prompt.content, syncToCode: true })
      });

      if (res.ok) {
        setSuccessId(id);
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        alert('Ошибка при обновлении промпта на сервере');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения с сервером');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Вы уверены, что хотите восстановить промпт из резервной копии? Все текущие изменения будут потеряны.')) return;
    
    setRestoringId(id);
    try {
      const res = await fetch('/api/admin/prompts/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setPrompts(prev => prev.map(p => p.id === id ? { ...p, content: data.content } : p));
          alert('Промпт успешно восстановлен!');
        } else {
          alert('Ошибка: сервер вернул неверные данные');
        }
      } else {
        alert('Ошибка при чтении резервной копии');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения с сервером');
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch('/api/admin/prompts');
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setPrompts(prev => prev.map(p => data[p.id] ? { ...p, content: data[p.id] } : p));
          }
        }
      } catch (err) {
        console.error('Failed to fetch prompts:', err);
      }
    };
    fetchPrompts();
  }, []);

  const handleSave = (id: string, newContent: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
    setEditingId(null);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Управление Агентами</h1>
        <p className="text-gray-400 text-sm">Настройка системных инструкций и промптов для ИИ</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-graphite-light rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="font-bold text-lg text-white">{prompt.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{prompt.description}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(prompt.id)}
                  disabled={restoringId === prompt.id}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-2 px-3"
                  title="Восстановить из резервной копии"
                >
                  <RotateCcw className={`w-4 h-4 ${restoringId === prompt.id ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-bold">ВОССТАНОВИТЬ</span>
                </button>
                {editingId === prompt.id ? (
                  <button 
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all font-bold text-xs"
                  >
                    <Check className="w-4 h-4" />
                    СОХРАНИТЬ
                  </button>
                ) : (
                  <button 
                    onClick={() => setEditingId(prompt.id)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-2 px-3"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-xs font-bold">РЕДАКТИРОВАТЬ</span>
                  </button>
                )}
                <button 
                  onClick={() => handleCopy(prompt.id, prompt.content)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                  title="Скопировать"
                >
                  {copiedId === prompt.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleLoadToAI(prompt.id)}
                  disabled={loadingId === prompt.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs ${
                    successId === prompt.id 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-accent-orange/10 hover:bg-accent-orange/20 text-accent-orange'
                  } ${loadingId === prompt.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingId === prompt.id ? (
                    <div className="w-4 h-4 border-2 border-accent-orange border-t-transparent rounded-full animate-spin" />
                  ) : successId === prompt.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loadingId === prompt.id ? 'ЗАГРУЗКА...' : successId === prompt.id ? 'ЗАГРУЖЕНО' : 'ЗАГРУЗИТЬ В ИИ'}
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea 
                className={`w-full bg-black/40 border rounded-2xl p-4 text-sm font-mono h-64 outline-none transition-all resize-y min-h-[16rem] ${
                  editingId === prompt.id ? 'border-accent-orange text-white' : 'border-white/10 text-gray-400'
                }`}
                value={prompt.content}
                readOnly={editingId !== prompt.id}
                onChange={(e) => {
                  const newContent = e.target.value;
                  setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, content: newContent } : p));
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
