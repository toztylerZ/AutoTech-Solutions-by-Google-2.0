import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, Car, Clock, Calendar, ChevronRight, PanelLeftClose, AlertCircle } from 'lucide-react';
import { useAdminStore, Appointment } from '../../store/adminStore';
import { motion, AnimatePresence } from 'motion/react';

export default function SearchSidebar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    setIsSearchExpanded, 
    setSelectedAppointment, 
    setIsDetailsExpanded 
  } = useAdminStore();
  
  const [results, setResults] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbers = val.replace(/\D/g, '');
    
    let cleanNumbers = numbers;
    if (numbers.length === 11 && (numbers.startsWith('7') || numbers.startsWith('8'))) {
      cleanNumbers = numbers.substring(1);
    } else if (numbers.length === 10 && numbers.startsWith('9')) {
      cleanNumbers = numbers;
    } else if (numbers.length > 10) {
      cleanNumbers = numbers.substring(0, 10);
    }

    // Format: (999) 000-00-00
    let res = '';
    if (cleanNumbers.length > 0) {
      res += '(' + cleanNumbers.substring(0, 3);
      if (cleanNumbers.length >= 3) res += ') ';
      if (cleanNumbers.length > 3) res += cleanNumbers.substring(3, 6);
      if (cleanNumbers.length >= 6) res += '-';
      if (cleanNumbers.length > 6) res += cleanNumbers.substring(6, 8);
      if (cleanNumbers.length >= 8) res += '-';
      if (cleanNumbers.length > 8) res += cleanNumbers.substring(8, 10);
    }

    setSearchQuery(res);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setLoading(true);
    setError(null);
    try {
      const cleanPhone = searchQuery.replace(/\D/g, '');
      const query = cleanPhone ? '7' + cleanPhone : '';
      const res = await fetch(`/api/schedule/find?query=${query}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setError('Ошибка при поиске');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
  };

  const handleSelect = (app: Appointment) => {
    setSelectedAppointment(app);
    // isSearchExpanded being false is handled by setSelectedAppointment in store or explicitly here
    setIsSearchExpanded(false);
    setIsDetailsExpanded(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Поиск</h2>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">по номеру телефона</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSearchExpanded(false)}
          title="Свернуть"
          className="p-1.5 bg-accent-orange/10 hover:bg-accent-orange/20 rounded-lg transition-all text-accent-orange border border-accent-orange/20"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Телефон клиента</label>
          <div className="relative">
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl group focus-within:border-accent-orange/50 transition-colors overflow-hidden">
              <span className="pl-3 text-white/40 font-mono text-[10px] tracking-tight">+7</span>
              <input 
                type="tel" 
                value={searchQuery}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                className="w-full bg-transparent py-3 px-2 outline-none text-xs text-white font-mono placeholder:text-gray-600" 
                placeholder="(999) 000-00-00" 
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-white/5 rounded-full transition-colors mr-2"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-white" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery}
            className="w-full py-3 bg-accent-orange/10 hover:bg-accent-orange text-accent-orange hover:text-white rounded-xl border border-accent-orange/20 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Поиск...' : 'Найти заявки'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[10px] text-red-400 font-bold uppercase">{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {results.length > 0 && (
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">
              Найдено результатов: {results.length}
            </div>
          )}
          
          <div className="space-y-2">
            {results.map((app) => (
              <button
                key={app.orderId}
                onClick={() => handleSelect(app)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-accent-orange" />
                    <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">{app.clientName}</span>
                  </div>
                  <div className="bg-accent-orange/10 px-2 py-0.5 rounded-md">
                    <span className="text-[8px] font-black text-accent-orange uppercase">#{app.orderId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="font-mono">{app.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="font-mono">{app.time}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-gray-400">
                    <Car className="w-3 h-3 text-gray-600" />
                    <span className="truncate">{app.car}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                  <div className="flex items-center gap-1 text-[9px] font-black text-accent-orange uppercase tracking-wider group-hover:gap-2 transition-all">
                    Открыть <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {searchQuery && results.length === 0 && !loading && !error && (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-white/5 mx-auto mb-3" />
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
