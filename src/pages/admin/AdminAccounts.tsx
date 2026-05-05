import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Shield, Key, Trash2, ShieldCheck, Mail, X, Lock } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Администратор', email: 'admin@autotech.pro', role: 'admin', box: 'Все' },
  { id: 2, name: 'Никита (Мастер ТО)', email: 'nikita@autotech.pro', role: 'staff', box: 'Бокс 1 (Ремонт)' },
  { id: 3, name: 'Сергей (Диагност)', email: 'sergey@autotech.pro', role: 'staff', box: 'Бокс 2 (Диагностика)' },
];

export default function AdminAccounts() {
  const [users, setUsers] = useState(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Аккаунты и Доступ</h1>
          <p className="text-gray-400 text-sm">Управление учетными записями персонала и правами доступа</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsPassModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all"
          >
            <Lock className="w-4 h-4" />
            СМЕНИТЬ ПАРОЛЬ АДМИНА
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-orange hover:bg-orange-600 rounded-2xl text-white font-bold transition-all shadow-lg neon-glow-orange"
          >
            <UserPlus className="w-4 h-4" />
            ДОБАВИТЬ СОТРУДНИКА
          </button>
        </div>
      </div>

      <div className="bg-graphite-light rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/40 border-b border-white/10">
              <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-10">Сотрудник</th>
              <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Роль / Доступ</th>
              <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Безопасность</th>
              <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest pr-10 text-left">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-6 pl-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-accent-orange font-bold uppercase border border-white/5">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border w-fit ${
                      user.role === 'admin' 
                        ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {user.role === 'admin' ? 'Админ' : 'Персонал'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium ml-1">Доступ: {user.box}</span>
                  </div>
                </td>
                <td className="p-6">
                   <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest group">
                     <Key className="w-4 h-4 text-gray-600 group-hover:text-accent-orange transition-colors" />
                     Сбросить пароль
                   </button>
                </td>
                <td className="p-6 pr-10 text-left">
                  <button className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Placeholders */}
      <AnimatePresence>
        {isPassModalOpen && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-graphite-light w-full max-w-sm rounded-3xl p-8 border border-white/10 relative">
               <button onClick={() => setIsPassModalOpen(false)} className="absolute top-6 right-6 text-gray-500"><X /></button>
               <h3 className="text-xl font-bold text-white mb-6">Смена пароля админа</h3>
               <div className="space-y-4">
                 <input type="password" placeholder="Текущий пароль" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" />
                 <input type="password" placeholder="Новый пароль" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" />
                 <button className="w-full py-3 bg-accent-orange rounded-xl font-bold mt-4 shadow-lg shadow-orange-500/20">СОХРАНИТЬ</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
