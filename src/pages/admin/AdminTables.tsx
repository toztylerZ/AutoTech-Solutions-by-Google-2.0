import React from 'react';
import { motion } from 'motion/react';
import { Database, ExternalLink, RefreshCcw } from 'lucide-react';

const tables = [
  { name: 'Записи и График (Booking)', id: '1whc-vJNHIOhJhnT9Sf-eS5l88AbDqF1BAxwNkaKjiEU', sheetName: 'booking' },
  { name: 'Цены и Услуги (Prices)', id: '1ryq0AloXjE-FXCz5_BkB8erYrVr8fvzr3SnOg42KTvc', sheetName: 'B2:E' },
  { name: 'База знаний (FAQ)', id: '19MOB7haF0D97sWTebuo0Q4E9d_vVy_SHWAt58GZQDzk', sheetName: 'Лист1' },
  { name: 'Логи чатов (Logs)', id: '1dEPsxN9ApmAw-lYpGtIZy9gFBTU1ZXMLfC7kqsmjjD8', sheetName: 'logs' },
  { name: 'Отзывы (Feedback)', id: '1_pqTb2M8bGrEK2lzaMAZeFLR4wrwkfCYIm7SfoKKCcg', sheetName: 'Sheet1' },
];

export default function AdminTables() {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Управление Таблицами</h1>
          <p className="text-gray-400 text-sm">Просмотр и редактирование сырых данных в Google Sheets</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all border border-white/10">
          <RefreshCcw className="w-4 h-4" />
          СИНХРОНИЗИРОВАТЬ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((table, i) => (
          <motion.div 
            key={table.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-graphite-light p-8 rounded-3xl border border-white/5 group hover:border-accent-orange/30 transition-all shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange">
                <Database className="w-6 h-6" />
              </div>
              <a 
                href={`https://docs.google.com/spreadsheets/d/${table.id}/edit`} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{table.name}</h3>
            <div className="text-xs font-mono text-gray-500 truncate mb-4">{table.id}</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                Sheet: {table.sheetName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Connected
              </span>
            </div>
            
            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-accent-orange hover:text-white text-gray-400 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-transparent">
              ОТКРЫТЬ ФОРМУ РЕДАКТИРОВАНИЯ
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
