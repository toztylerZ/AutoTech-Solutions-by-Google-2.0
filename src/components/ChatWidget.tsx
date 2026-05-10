import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User, Star, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  hidden?: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : 400, 
    height: 550 
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);

  useEffect(() => {
    const event = new CustomEvent('autotech-chat-status', { 
      detail: { isOpen } 
    });
    window.dispatchEvent(event);
  }, [isOpen]);

  const sessionId = useMemo(() => {
    const existing = sessionStorage.getItem('autotech_session_id');
    if (existing) return existing;
    const newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    sessionStorage.setItem('autotech_session_id', newId);
    return newId;
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const [faqData, setFaqData] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [adminSystemPrompt, setAdminSystemPrompt] = useState<string | null>(null);
  const [lastApplication, setLastApplication] = useState<any>(null);
  const [hasPromptedResume, setHasPromptedResume] = useState(false);

  useEffect(() => {
    const checkLastApp = async () => {
      try {
        const res = await fetch(`/api/applications/last?sessionId=${sessionId}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data) {
              setLastApplication(data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch last app:', err);
      }
    };
    checkLastApp();
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && lastApplication && !hasPromptedResume) {
      if (messages.length === 0) {
        setMessages([
          {
            role: 'bot',
            content: `Я вижу, что вы выслали заявку на услугу "${lastApplication.category || 'автосервиса'}" (${lastApplication.car || 'ваш авто'}). Сейчас проверю детали и помогу подтвердить запись.`,
            timestamp: new Date()
          }
        ]);
      }
      setHasPromptedResume(true);
    }
  }, [isOpen, lastApplication, hasPromptedResume, messages.length]);

  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ messages, faqData, priceData, adminSystemPrompt, lastApplication, sessionId });
  useEffect(() => {
    stateRef.current = { messages, faqData, priceData, adminSystemPrompt, lastApplication, sessionId };
  }, [messages, faqData, priceData, adminSystemPrompt, lastApplication, sessionId]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      setIsExpanded(true);
      
      fetch(`/api/applications/last?sessionId=${stateRef.current.sessionId}`)
        .then(res => {
          if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data) setLastApplication(data);
        })
        .catch(err => console.error('Failed to refetch last app:', err));

      if (e.detail?.message) {
        // Use a slight delay to ensure the component is fully ready
        setTimeout(() => {
          handleSend(e.detail.message, e.detail.hidden);
        }, 100);
      }
    };
    window.addEventListener('open-autotech-chat', handleOpenChat);
    return () => window.removeEventListener('open-autotech-chat', handleOpenChat);
  }, []); // Only subscribe once

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const deltaX = resizeRef.current.startX - e.clientX;
      const deltaY = resizeRef.current.startY - e.clientY;
      const newWidth = Math.max(320, Math.min(800, resizeRef.current.startWidth + deltaX));
      const newHeight = Math.max(400, Math.min(800, resizeRef.current.startHeight + deltaY));
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: dimensions.width,
      startHeight: dimensions.height
    };
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showFeedback, isOpen, isLoading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqRes, promoRes, priceRes] = await Promise.all([
          fetch('/api/faq/external'),
          fetch('/api/admin/prompts'),
          fetch('/api/prices')
        ]);
        
        if (faqRes.ok && faqRes.headers.get("content-type")?.includes("application/json")) {
          setFaqData(await faqRes.json());
        }
        if (promoRes.ok && promoRes.headers.get("content-type")?.includes("application/json")) {
          const promo = await promoRes.json();
          if (promo['bot-system']) setAdminSystemPrompt(promo['bot-system']);
        }
        if (priceRes.ok && priceRes.headers.get("content-type")?.includes("application/json")) {
          setPriceData(await priceRes.json());
        }
      } catch (err) {
        console.error('Data fetch failed:', err);
      }
    };
    fetchData();
  }, []);

  const handleSendRef = useRef<any>(null);
  handleSendRef.current = async (customInput?: string, isHidden = false) => {
    const messageText = customInput || input;
    if (!messageText.trim() || loadingRef.current) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      hidden: isHidden
    };

    loadingRef.current = true;
    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);
    
    if (!customInput) setInput('');

    // Use current state from messages at the time of call
    processAIResponse([...stateRef.current.messages, userMessage], messageText);
  };

  const handleSend = (customInput?: string, isHidden = false) => {
    handleSendRef.current?.(customInput, isHidden);
  };

  const processAIResponse = async (historyMessages: Message[], currentInput: string) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key missing');

      const ai = new GoogleGenAI({ apiKey });
      const faqContext = faqData.map(f => `В: ${f.q}\nО: ${f.a}`).join('\n\n');
      const priceContext = priceData.map(p => `Категория: ${p.category}\nУслуга: ${p.service}\nЦена: ${p.price}\nВремя: ${p.duration}`).join('\n\n');
      
      const resumeContext = lastApplication ? `
КЛИЕНТ УЖЕ НАЧАЛ ЗАЯВКУ НА САЙТЕ (СТАТУС: RAW):
- Имя: ${lastApplication.name}
- Телефон: ${lastApplication.phone}
- Автомобиль: ${lastApplication.car || 'Не указан'}
- Желаемая дата: ${lastApplication.date || 'Не выбрана'}
- Желаемое время: ${lastApplication.time || 'Не выбрано'}
- Комментарий (описание проблемы): ${lastApplication.comment}

ТВОЯ ЗАДАЧА:
1. Поздороваться и подтвердить, что видишь заявку.
2. ОПРЕДЕЛИТЬ КАТЕГОРИЮ услуги по описанию проблемы (Слесарный ремонт и ТО, Электрика и диагностика, Детейлинг и покрытия).
3. Если дата/время не выбраны или заняты, помочь выбрать.
4. Когда всё готово, вызвать 'book_with_schedule'.
` : '';

      const defaultSystemPrompt = `Ты — экспертный ИИ-менеджер автосервиса AUTOTECH SOLUTIONS. Твоя цель: безупречный сервис, точная консультация и подтверждение заявок в расписание.

ПРАВИЛА ОБЩЕНИЯ (КРИТИЧЕСКИ ВАЖНО):
1. **КОНФИДЕНЦИАЛЬНОСТЬ:** КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО выводить пользователю любые технические данные инструментов (JSON, ID сессий, структуру таблиц, массивы слотов). Ответы должны быть только на человеческом языке.
2. **ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (ЦЕХА):** Ты обязан классифицировать запрос в одну из категорий:
   - "Слесарный ремонт и ТО" (мотор, ходовая, замена масел, тормоза).
   - "Электрика и диагностика" (ошибки на табло, проводка, аккумуляторы, чип-тюнинг).
   - "Детейлинг и покрытия" (полировка, керамика, пленки, химчистка, мойка).
3. **ОБРАБОТКА RAW-ЗАЯВОК:** Если в контексте есть данные RAW-заявки (имя, телефон, описание), это значит, что запись нужно уточнить. 
   - НЕ спрашивай имя и телефон повторно. 
   - ОБЯЗАТЕЛЬНО уточни марку авто, конкретную задачу и проверь удобство времени.
   - НАЗНАЧЬ бокс: при вызове 'book_with_schedule' ты должен выбрать один из доступных боксов ("Бокс А", "Бокс Б", "Бокс В").
   - Только после уточнения всех деталей и выбора бокса переводи заявку из статуса RAW в подтвержденную запись.
4. **УТОЧНЕНИЕ ДЕТАЛЕЙ:** Для качественной записи обязательно заполни параметры:
   - 'car': Марка и модель автомобиля.
   - 'whatToDo': Конкретная жалоба или пожелание клиента (вносится в What_to_do).
5. **АЛГОРИТМ ЗАПИСИ:**
   - Предложи свободные слоты через 'get_available_slots'.
   - После согласования времени вызови 'book_with_schedule', передав все собранные данные (имя, телефон, авто, задача).
   - В финальном подтверждении ОБЯЗАТЕЛЬНО назови гараж (цех), в который записан клиент.
6. **ОТМЕНА И ИЗМЕНЕНИЕ:** Если клиент просит отменить или изменить запись:
   - Сначала найди её через 'find_appointment' (или используй данные из контекста).
   - Вызови 'update_appointment', указав 'orderId' и новый статус ('Cancelled' для отмены, 'Changed' для переноса).
   - Если это перенос, укажи также новые 'date' и 'time'.
7. **ПОИСК ЗАПИСИ:** Если клиент спрашивает "есть ли я в списке" или "когда я записан", используй 'find_appointment'. Ищи по номеру телефона (если он известен) или по имени.

Стиль общения: Лаконичный, профессиональный, экспертный. Без лишних извинений и воды.`;

      const systemInstruction = `
${adminSystemPrompt || defaultSystemPrompt}
ПРАЙС: ${priceContext}
FAQ: ${faqContext}
${resumeContext}
Текущая дата и время: ${(() => {
  const now = new Date();
  const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(utc3.getUTCDate())}.${pad(utc3.getUTCMonth() + 1)}.${utc3.getUTCFullYear()} ${pad(utc3.getUTCHours())}:${pad(utc3.getUTCMinutes())}:${pad(utc3.getUTCSeconds())}`;
})()}
`;

      const history = historyMessages.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })) as any[];

      const tools = [{
        functionDeclarations: [
          {
            name: "get_available_slots",
            description: "Retrieves available appointment hours.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                serviceCategory: { 
                  type: Type.STRING, 
                  enum: ["Слесарный ремонт и ТО", "Электрика и диагностика", "Детейлинг и покрытия"] 
                },
                serviceName: { type: Type.STRING }
              },
              required: ["date", "serviceCategory", "serviceName"]
            }
          },
          {
            name: "book_with_schedule",
            description: "Books a specific time slot.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                serviceCategory: { 
                  type: Type.STRING,
                  enum: ["Слесарный ремонт и ТО", "Электрика и диагностика", "Детейлинг и покрытия"]
                },
                serviceName: { type: Type.STRING },
                clientName: { type: Type.STRING },
                phone: { type: Type.STRING },
                car: { type: Type.STRING },
                whatToDo: { type: Type.STRING },
                box: { 
                  type: Type.STRING,
                  enum: ["Бокс А", "Бокс Б", "Бокс В"],
                  description: "Specific box to assign"
                }
              },
              required: ["date", "time", "serviceCategory", "serviceName", "clientName", "phone", "box"]
            }
          },
          {
            name: "find_appointment",
            description: "Searches for an existing appointment by phone or client name.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: "Phone number or client name to search for" }
              },
              required: ["query"]
            }
          },
          {
            name: "update_appointment",
            description: "Updates an existing appointment status, date, or time.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                orderId: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Confirmed", "Changed", "Cancelled"], description: "New status" },
                date: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["orderId"]
            }
          }
        ]
      }];

      let currentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: { systemInstruction, tools }
      });

      const conversationHistory = [...history];
      let maxTurns = 3; 
      while (currentResponse.functionCalls && maxTurns > 0) {
        maxTurns--;
        const toolResponses = [];
        for (const call of currentResponse.functionCalls) {
          let result: any;
          if (call.name === 'get_available_slots') {
             const args = call.args as any;
             const res = await fetch(`/api/schedule/slots?date=${args.date}&serviceCategory=${encodeURIComponent(args.serviceCategory)}&serviceName=${encodeURIComponent(args.serviceName)}`);
             if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
               result = await res.json();
             } else {
               result = { error: "Failed to get slots" };
             }
          } else if (call.name === 'book_with_schedule') {
             const args = call.args as any;
             const bookRes = await fetch('/api/schedule/book', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ ...args, sessionId })
             });
             if (bookRes.ok && bookRes.headers.get("content-type")?.includes("application/json")) {
               result = await bookRes.json();
             } else {
               result = { error: "Failed to book" };
             }
          } else if (call.name === 'find_appointment') {
             const args = call.args as any;
             const res = await fetch(`/api/schedule/find?query=${encodeURIComponent(args.query)}`);
             if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
               result = await res.json();
             } else {
               result = { error: "Failed to find appointment" };
             }
          } else if (call.name === 'update_appointment') {
             const args = call.args as any;
             const res = await fetch('/api/schedule/update', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(args)
             });
             if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
               result = await res.json();
             } else {
               result = { error: "Failed to update" };
             }
          }
          toolResponses.push({ functionResponse: { name: call.name, response: { result } } });
        }

        conversationHistory.push(currentResponse.candidates?.[0]?.content || { role: 'model', parts: [{ text: currentResponse.text || '' }] });
        conversationHistory.push({ role: 'user', parts: toolResponses });

        currentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: conversationHistory,
          config: { systemInstruction, tools }
        });
      }

      const botContent = currentResponse.text || "Я готов помочь вам с записью. Есть ли у вас дополнительные вопросы?";
      setMessages(prev => [...prev, { role: 'bot', content: botContent, timestamp: new Date() }]);

      fetch('/api/chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, response: botContent, userId: sessionId })
      }).catch(err => console.error('Logging failed:', err));

    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Временные технические трудности. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date()
      }]);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating, comment: feedbackComment })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        setTimeout(() => setShowFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Feedback failed:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ 
              width: isExpanded 
                ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 'calc(100vw - 24px)' : 'calc(100vw - 48px)') 
                : dimensions.width, 
              height: isExpanded 
                ? (typeof window !== 'undefined' && window.innerHeight < 640 ? 'calc(100vh - 120px)' : 'calc(80vh)') 
                : dimensions.height,
              maxWidth: isExpanded ? '1200px' : '800px'
            }}
            className="mb-4 bg-graphite-light/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300"
          >
            {!isExpanded && (
              <div 
                onMouseDown={startResize}
                className="absolute top-0 left-0 w-8 h-8 cursor-nwse-resize z-[100] flex items-center justify-center group"
              >
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-accent-orange transition-colors" />
              </div>
            )}

            <div className="p-4 bg-accent-orange/10 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center border border-accent-orange/30">
                  <Bot className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AUTOTECH SOLUTIONS</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">В СЕТИ</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showFeedback && !feedbackSubmitted && messages.length > 0 && (
                  <button 
                    onClick={() => setShowFeedback(true)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-accent-orange animate-pulse"
                    title="Оценить качество"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={toggleExpand}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!showFeedback && !feedbackSubmitted && messages.length >= 2 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 py-2 border-b border-white/5 flex justify-center bg-accent-orange/5"
                >
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="group flex items-center gap-2 px-6 py-2.5 bg-accent-orange text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-accent-orange-dark transition-all shadow-[0_5px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_25px_rgba(255,107,0,0.5)] active:scale-95 animate-pulse"
                  >
                    <Star className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform" />
                    ОЦЕНИТЬ ПОМОЩЬ АССИСТЕНТА
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
              {messages.filter(m => !m.hidden).map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' ? 'bg-accent-orange text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-2">
                    <Loader2 className="w-4 h-4 text-accent-orange animate-spin" />
                    <span className="text-xs text-gray-400">Печатает ответ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-4 bottom-24 bg-graphite-light border border-accent-orange/30 rounded-3xl p-6 shadow-2xl z-[100] backdrop-blur-2xl"
                >
                  {!feedbackSubmitted ? (
                    <div className="flex flex-col items-center">
                      <div className="w-full flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-accent-orange uppercase tracking-[0.2em]">Ваша оценка</h4>
                        <button onClick={() => setShowFeedback(false)} className="text-gray-500 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="text-center mb-4 leading-tight">
                        <p className="text-sm font-bold text-white">Как вам консультация?</p>
                        <p className="text-[10px] text-gray-400 mt-1">Помогите нам стать лучше</p>
                      </div>

                      <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <motion.button 
                            key={s} 
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onMouseEnter={() => setHoverRating(s)} 
                            onMouseLeave={() => setHoverRating(0)} 
                            onClick={() => setRating(s)} 
                            className="p-1"
                          >
                            <Star 
                              className={`w-8 h-8 transition-colors duration-200 ${
                                (hoverRating || rating) >= s 
                                  ? 'fill-accent-orange text-accent-orange drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]' 
                                  : 'text-white/10 fill-white/5'
                              }`} 
                            />
                          </motion.button>
                        ))}
                      </div>

                      <textarea
                        placeholder="Что мы можем улучшить?"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-gray-600 outline-none mb-4 min-h-[80px] transition-all focus:border-accent-orange/50"
                      />

                      <button 
                        onClick={handleFeedbackSubmit} 
                        disabled={rating === 0 || isSubmittingFeedback}
                        className="w-full py-3 bg-accent-orange text-white text-[11px] font-black uppercase tracking-widest rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-orange-dark transition-all"
                      >
                        {isSubmittingFeedback ? 'ОТПРАВКА...' : 'ПОДТВЕРДИТЬ'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                        <Star className="w-6 h-6 text-green-500 fill-green-500" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Спасибо за отзыв!</p>
                      <p className="text-[10px] text-gray-400">Ваше мнение очень важно для нас</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 border-t border-white/10">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Задайте ваш вопрос..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white outline-none"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
                >
                  <Send className={`w-5 h-5 ${input.trim() && !isLoading ? 'text-accent-orange' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) setIsExpanded(true);
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-graphite' : 'bg-accent-orange text-white'
        } neon-glow-orange`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-7 h-7" />}
      </motion.button>
    </div>
  );
}
