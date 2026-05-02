import React, { useState, useEffect } from 'react';

interface GarageBookingSummaryProps {
  date: string;
  endDate?: string | null;
  garageFilter?: string;
  isSidebar?: boolean;
}

const GARAGES = [
  { name: 'Слесарный ремонт и ТО', label: 'Слесарный ремонт', color: 'text-blue-400', dot: 'bg-blue-500' },
  { name: 'Электрика и диагностика', label: 'Электрика', color: 'text-purple-400', dot: 'bg-purple-500' },
  { name: 'Детейлинг и покрытия', label: 'Детейлинг', color: 'text-emerald-400', dot: 'bg-emerald-500' }
];

const BOXES = ['Бокс А', 'Бокс Б', 'Бокс В'];

export default function GarageBookingSummary({ date, endDate, garageFilter, isSidebar }: GarageBookingSummaryProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        let url = `/api/admin/appointments?date=${date}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (garageFilter) url += `&garage=${encodeURIComponent(garageFilter)}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setAppointments(data);
          } else {
            const text = await res.text();
            console.error('Expected JSON but got:', text.substring(0, 500));
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
    const interval = setInterval(fetchApps, 10000); // 10s is enough for summary
    return () => clearInterval(interval);
  }, [date, endDate, garageFilter]);

  const filteredApps = garageFilter 
    ? appointments.filter(a => {
        const garage = (a.garage || "").toLowerCase().trim();
        const filter = garageFilter.toLowerCase().trim();
        return garage === filter || garage.includes(filter) || filter.includes(garage);
      })
    : appointments;

  const displayItems = garageFilter
    ? BOXES.map(box => {
        const boxApps = filteredApps.filter(a => a.box === box);
        const totalDuration = boxApps.reduce((sum, a) => sum + (parseInt(a.duration) || 1), 0);
        return {
          id: box,
          label: box,
          count: boxApps.length,
          duration: totalDuration,
          color: 'text-accent-orange'
        };
      })
    : GARAGES.map(g => ({
        id: g.name,
        label: g.name,
        count: filteredApps.filter(a => a.garage === g.name).length,
        duration: 0,
        color: g.color
      }));

  const statusCounts = {
    new: filteredApps.filter(a => {
      const s = (a.status || "").toUpperCase();
      return !s || s === 'NEW' || s === 'RAW';
    }).length,
    confirmed: filteredApps.filter(a => (a.status || "").toUpperCase() === 'CONFIRMED').length,
    completed: filteredApps.filter(a => (a.status || "").toUpperCase() === 'COMPLETED').length,
    closed: filteredApps.filter(a => (a.status || "").toUpperCase() === 'CLOSED').length,
    cancelled: filteredApps.filter(a => (a.status || "").toUpperCase() === 'CANCELLED').length,
  };

  const currentLabel = endDate ? 'Записей за период' : 'Записей на сегодня';

  if (isSidebar) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
            {garageFilter ? `Загрузка боксов: ${loading ? '...' : filteredApps.length}` : `${currentLabel}: ${loading ? '...' : filteredApps.length}`}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {displayItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                  {garageFilter && !loading && (
                    <span className="text-[9px] font-bold text-gray-600 uppercase">
                      {item.duration} ч
                    </span>
                  )}
                </div>
                <span className={`text-lg font-black ${item.color} tracking-tight`}>
                  {loading ? '...' : item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <div className="space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Статусы:</div>
          <div className="space-y-2">
            {[
              { label: 'Новые', value: statusCounts.new, color: 'text-yellow-400' },
              { label: 'Отмененные', value: statusCounts.cancelled, color: 'text-red-400' },
              { label: 'Подтвержденные', value: statusCounts.confirmed, color: 'text-green-400' },
              { label: 'Завершенные', value: statusCounts.completed, color: 'text-blue-400' },
              { label: 'Закрытые', value: statusCounts.closed, color: 'text-gray-400' }
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center bg-white/3 rounded-lg px-3 py-2 border border-white/3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.label}</span>
                <span className={`text-xs font-black ${s.color}`}>{loading ? '...' : s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5 inline-flex gap-8 group">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
          {garageFilter ? `Загрузка боксов (${date}): ${loading ? '...' : filteredApps.length}` : `Записей на ${date}: ${loading ? '...' : filteredApps.length}`}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pr-4">
          {displayItems.map(item => (
            <div key={item.id} className="flex flex-col items-center justify-center text-center gap-1 min-w-[90px]">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-tight h-8 flex items-center">
                {garageFilter ? item.label : item.label}
              </span>
              <div className="flex flex-col items-center justify-center bg-white/5 rounded-xl px-3 py-2 border border-white/5 w-full">
                <span className={`text-xl font-black ${item.color} tracking-tight leading-none`}>
                  {loading ? '...' : item.count}
                </span>
                {!loading && garageFilter && (
                  <span className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                    {item.duration} ч
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-px bg-white/10 self-stretch" />

      <div className="flex flex-col gap-2 min-w-[120px]">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Статусы:</div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Новые</span>
            <span className="text-xs font-bold text-yellow-400">{loading ? '...' : statusCounts.new}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Отмененные</span>
            <span className="text-xs font-bold text-red-400">{loading ? '...' : statusCounts.cancelled}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Подтвержденные</span>
            <span className="text-xs font-bold text-green-400">{loading ? '...' : statusCounts.confirmed}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Завершенные</span>
            <span className="text-xs font-bold text-blue-400">{loading ? '...' : statusCounts.completed}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] text-gray-400 font-medium lowercase">Закрытые</span>
            <span className="text-xs font-bold text-gray-500">{loading ? '...' : statusCounts.closed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
