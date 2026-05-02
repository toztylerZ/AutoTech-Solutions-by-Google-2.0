import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'motion/react';
import { Activity, Users, CheckCircle2, Clock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export default function AdminCharts() {
  const { selectedDate, endDate } = useAdminStore();
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    new: 0,
    byGarage: [] as any[]
  });

  useEffect(() => {
    // Fetch real data based on store dates
    const fetchData = async () => {
      const garages = ['Слесарный ремонт и ТО', 'Электрика и диагностика', 'Детейлинг и покрытия'];
      let total = 0;
      let byGarage = [];
      
      for (const g of garages) {
         try {
           let url = `/api/admin/appointments?date=${selectedDate}&garage=${encodeURIComponent(g)}`;
           if (endDate) url += `&endDate=${endDate}`;
           
           const res = await fetch(url);
           if (res.ok) {
             const contentType = res.headers.get("content-type");
             if (contentType && contentType.includes("application/json")) {
               const data = await res.json();
               total += data.length;
               byGarage.push({ name: g.replace(' и ', ' & '), value: data.length });
             } else {
               byGarage.push({ name: g.replace(' и ', ' & '), value: 0 });
             }
           } else {
             byGarage.push({ name: g.replace(' и ', ' & '), value: 0 });
           }
         } catch (err) {
           console.error('Fetch error:', err);
           byGarage.push({ name: g.replace(' и ', ' & '), value: 0 });
         }
      }

      setStats({
        total,
        confirmed: Math.floor(total * 0.8), // Simplified for demo, in real it should come from actual data statuses
        new: Math.ceil(total * 0.2),
        byGarage
      });
    };
    fetchData();
  }, [selectedDate, endDate]);

  const COLORS = ['#FF6B00', '#2563eb', '#8b5cf6'];

  const dateLabel = endDate 
    ? `${new Date(selectedDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}`
    : new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Статистика и аналитика</h1>
        <p className="text-gray-400 text-sm">Обзор загрузки за {dateLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Заявок за период', value: stats.total, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Подтверждено', value: stats.confirmed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'В ожидании', value: stats.new, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Клиентов в базе', value: 124, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-graphite-light p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} blur-3xl -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity`} />
            <card.icon className={`w-8 h-8 ${card.color} mb-4 relative z-10`} />
            <div className="text-2xl font-bold text-white relative z-10">{card.value}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-widest relative z-10">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-graphite-light p-8 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-8">Загрузка по гаражам</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byGarage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.byGarage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-graphite-light p-8 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-8">Соотношение площадок</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byGarage}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.byGarage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {stats.byGarage.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-gray-400">{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
