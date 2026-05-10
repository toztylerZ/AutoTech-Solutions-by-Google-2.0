import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Shield, Trash2, Edit2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
};

export default function AdminAccounts() {
  const { 
    activeService, 
    setActiveService,
    activeBox, 
    activeStatus, 
    setSelectedAppointment, 
    setIsDetailsExpanded,
    setIsNewAppointmentExpanded 
  } = useAdminStore();

  const refreshKey = useAdminStore((state) => state.refreshKey);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset service filter when entering accounts management to avoid conflicts
    if (activeService !== 'General') {
      setActiveService('General');
    }
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(fetchStaff, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/staff/${deleteConfirm}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStaff();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Delete staff error:', err);
    }
  };

  const getGarageLabel = (id: string) => {
    if (id === 'Repair') return 'Слесарный ремонт и ТО';
    if (id === 'Diagnostic') return 'Электрика и диагностика';
    if (id === 'Detailing') return 'Детейлинг и покрытия';
    return id;
  };

  const filteredStaff = staff.filter(member => {
    // 1. Top panel service filter (Repair/Diagnostic/Detailing)
    if (activeService !== 'General') {
      const accessLabel = getGarageLabel(activeService);
      if (member.access !== accessLabel) return false;
    }

    // 2. Top panel box filter (Box A/B/C)
    if (activeBox !== 'Все') {
      if (member.box !== activeBox) return false;
    }

    // 3. Left sidebar status filter (Access categories, Managers, Administrators)
    if (activeStatus && activeStatus !== 'Все') {
      const statusLower = activeStatus.toLowerCase();
      if (statusLower === 'менеджеры') {
        if (member.role?.toLowerCase() !== 'менеджер') return false;
      } else if (statusLower === 'администраторы') {
        if (member.role?.toLowerCase() !== 'администратор') return false;
      } else {
        // If it's one of the access labels
        const accessLabel = getGarageLabel(activeStatus).toLowerCase().trim();
        const memberAccess = (member.access || '').toLowerCase().trim();
        if (memberAccess !== accessLabel) return false;
      }
    }

    return true;
  });

  const getRoleColor = (role: string) => {
    if (role === 'администратор') return 'text-red-400';
    if (role === 'менеджер') return 'text-yellow-400';
    return 'text-white';
  };

  const getAccessColor = (access: string) => {
    const acc = (access || '').toLowerCase().trim();
    if (acc === 'слесарный ремонт и то') return 'text-blue-400';
    if (acc === 'электрика и диагностика') return 'text-purple-400';
    if (acc === 'детейлинг и покрытия') return 'text-emerald-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex flex-col h-full bg-graphite overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-auto mx-4 mb-4 mt-4 bg-[#121212] rounded-3xl border border-white/5 scrollbar-hide relative"
      >
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr className="bg-[#1a1a1a] shadow-[0_1px_0_rgba(255,255,255,0.1)]">
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-10 h-14 bg-[#1a1a1a] border-b border-white/5">Ф.И.О. сотрудника</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-[#1a1a1a] border-b border-white/5">Логин</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-[#1a1a1a] border-b border-white/5">Роль / Доступ</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-[#1a1a1a] border-b border-white/5 text-center">Бокс</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pr-10 bg-[#1a1a1a] border-b border-white/5 text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500 font-mono italic">Загрузка...</td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500 font-mono italic">Аккаунты не найдены</td>
              </tr>
            ) : (
              filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-10">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-white uppercase tracking-wider">{member.user_name}</div>
                      <div className="text-[11px] font-mono text-gray-500 mt-1">{formatPhoneNumber(member.phone)}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-mono text-gray-400">{member.login || '—'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black uppercase tracking-wider ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                       </div>
                       <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${getAccessColor(member.access)}`}>
                         {member.access || 'Полный доступ'}
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5 min-w-[80px] text-center">
                        {member.box || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 pr-10">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => {
                          setSelectedAppointment({
                            id: member.id,
                            orderId: member.id,
                            clientName: member.user_name,
                            phone: member.phone,
                            service: member.role,
                            access: member.access,
                            box: member.box,
                            login: member.login,
                            password: member.password,
                            role: member.role
                          });
                          setIsDetailsExpanded(true);
                          setIsNewAppointmentExpanded(false);
                        }}
                        className="p-2 text-gray-500 hover:text-accent-orange transition-all hover:scale-110 active:scale-95"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {member.role !== 'администратор' && (
                        <button 
                          onClick={() => setDeleteConfirm(member.id)}
                          className="p-2 text-gray-500 hover:text-red-500 transition-all hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#151515] w-full max-w-sm rounded-[32px] p-8 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Удалить аккаунт?</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Вы уверены, что хотите удалить этот аккаунт? Это действие нельзя будет отменить.
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-bold transition-all uppercase tracking-widest text-[10px]"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-2xl text-white font-bold transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
