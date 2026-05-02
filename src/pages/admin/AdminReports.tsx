import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award, AlertTriangle, MessageSquare, Globe, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminReports() {
  const [reportType, setReportType] = useState<'boxes' | 'ai'>('boxes');

  const boxData = [
    { name: 'Бокс 1', load: 85, efficiency: 92, revenue: 120000 },
    { name: 'Бокс 2', load: 72, efficiency: 88, revenue: 95000 },
    { name: 'Бокс 3', load: 94, efficiency: 95, revenue: 156000 },
  ];

  const aiData = [
    { date: '21.04', sessions: 45, conversions: 12, botAccuracy: 88 },
    { date: '22.04', sessions: 52, conversions: 15, botAccuracy: 91 },
    { date: '23.04', sessions: 48, conversions: 18, botAccuracy: 89 },
    { date: '24.04', sessions: 70, conversions: 25, botAccuracy: 95 },
    { date: '25.04', sessions: 65, conversions: 22, botAccuracy: 93 },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Аналитические отчеты</h1>
          <p className="text-gray-400 text-sm">Глубокий анализ операционной деятельности и работы ИИ</p>
        </div>
        <div className="flex bg-graphite-light p-1 rounded-2xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setReportType('boxes')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${reportType === 'boxes' ? 'bg-accent-orange text-white' : 'text-gray-500 hover:text-white'}`}
          >
            ЭФФЕКТИВНОСТЬ БОКСОВ
          </button>
          <button 
            onClick={() => setReportType('ai')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${reportType === 'ai' ? 'bg-accent-orange text-white' : 'text-gray-500 hover:text-white'}`}
          >
            АНАЛИЗ САЙТА И ИИ
          </button>
        </div>
      </div>

      {reportType === 'boxes' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <TrendingUp className="w-6 h-6 text-emerald-500 mb-4" />
              <div className="text-2xl font-bold text-white">84%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Средняя загрузка</div>
            </div>
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <Award className="w-6 h-6 text-accent-orange mb-4" />
              <div className="text-2xl font-bold text-white">92%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Индекс эффективности</div>
            </div>
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <AlertTriangle className="w-6 h-6 text-red-500 mb-4" />
              <div className="text-2xl font-bold text-white">12ч</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Время простоя</div>
            </div>
          </div>

          <div className="bg-graphite-light p-8 rounded-3xl border border-white/5">
            <h3 className="font-bold text-white mb-8">Сравнительный анализ боксов</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boxData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis dataKey="name" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="efficiency" fill="#FF6B00" radius={[10, 10, 0, 0]} name="Эффективность (%)" />
                  <Bar dataKey="load" fill="#2563eb" radius={[10, 10, 0, 0]} name="Загрузка (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <MessageSquare className="w-6 h-6 text-blue-500 mb-4" />
              <div className="text-2xl font-bold text-white">91.4%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Точность ответов ИИ</div>
            </div>
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <Target className="w-6 h-6 text-purple-500 mb-4" />
              <div className="text-2xl font-bold text-white">38%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Конверсия из чата</div>
            </div>
            <div className="bg-graphite-light p-6 rounded-3xl border border-white/5">
              <Globe className="w-6 h-6 text-emerald-500 mb-4" />
              <div className="text-2xl font-bold text-white">2.4 мин</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Среднее время сессии</div>
            </div>
          </div>

          <div className="bg-graphite-light p-8 rounded-3xl border border-white/5">
            <h3 className="font-bold text-white mb-8">Динамика сессий и конверсий</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis dataKey="date" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb' }} name="Сессии" />
                  <Line type="monotone" dataKey="conversions" stroke="#FF6B00" strokeWidth={3} dot={{ fill: '#FF6B00' }} name="Записи" />
                  <Line type="monotone" dataKey="botAccuracy" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} name="Точность ИИ (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
