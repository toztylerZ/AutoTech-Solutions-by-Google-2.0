import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import ScheduleGrid from '../../components/admin/ScheduleGrid';
import { Calendar, Wrench } from 'lucide-react';

const normalizeBox = (b: string) => 
  (b || '').trim().toUpperCase()
    .replace('A', 'А') // Latin A -> Cyrillic А
    .replace('B', 'В') // Latin B -> Cyrillic В
    .replace('C', 'С'); // Latin C -> Cyrillic С

export default function StaffView() {
  const { user, logout } = useAuthStore();
  const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [activeBox, setActiveBox] = useState('Бокс А');

  useEffect(() => {
    if (user?.box) {
      // Normalize and find matching box
      const normalizedBox = user.box.trim();
      setActiveBox(normalizedBox);
    }
  }, [user?.username, user?.box]);

  const garage = user?.access || 'Слесарный ремонт и ТО';
  const boxes = ['Бокс А', 'Бокс Б', 'Бокс В'];

  if (!user) return null;

   return (
    <div className="min-h-screen bg-graphite flex flex-col pt-10 px-4 sm:px-6 lg:px-8 pb-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-graphite-light p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-orange/10 rounded-2xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-accent-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{user.name}</h1>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">{garage}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <span className="block text-accent-orange text-lg font-black tracking-widest">{new Date().toLocaleDateString('ru-RU')}</span>
                <span className="text-gray-500 text-[10px] font-bold uppercase">Сегодняшний график</span>
             </div>
             <button 
               onClick={() => logout()}
               className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl text-sm font-bold transition-all border border-white/5"
             >
               ВЫЙТИ
             </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-end bg-graphite-light/50 p-4 rounded-3xl border border-white/5">
           <div className="flex bg-graphite p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
              {boxes.map(box => (
                <button
                  key={box}
                  onClick={() => setActiveBox(box)}
                  className={`px-8 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    normalizeBox(activeBox) === normalizeBox(box) 
                      ? 'bg-accent-orange text-white shadow-lg neon-glow-orange' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {box}
                </button>
              ))}
           </div>
        </div>

        {/* Main Content */}
        <div className="bg-graphite-light rounded-3xl border border-white/5 shadow-2xl overflow-hidden p-6">
           <ScheduleGrid 
             garage={garage} 
             date={currentDate} 
             boxFilter={activeBox} 
             isStaffView={true}
             disableInternalScroll={true}
           />
        </div>
      </div>
    </div>
  );
}
