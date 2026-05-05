import { create } from 'zustand';

export type ServiceType = 'General' | 'Repair' | 'Diagnostic' | 'Detailing';
export type ViewType = 'grid' | 'log';

interface AdminState {
  selectedDate: string;
  endDate: string | null;
  activeService: ServiceType;
  activeView: ViewType;
  activeBox: string;
  activeStatus: string | null;
  highlightedOrderId: string | null;
  pendingFilter: 'today' | 'all' | null;
  hasDoneInitialRedirect: boolean;
  isSidebarOpen: boolean;
  setSelectedDate: (date: string) => void;
  setEndDate: (date: string | null) => void;
  setActiveService: (service: ServiceType) => void;
  setActiveView: (view: ViewType) => void;
  setActiveBox: (box: string) => void;
  setActiveStatus: (status: string | null) => void;
  setHighlightedOrderId: (orderId: string | null) => void;
  setPendingFilter: (filter: 'today' | 'all' | null) => void;
  setHasDoneInitialRedirect: (done: boolean) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const getToday = () => {
    // Current date in Moscow (UTC+3)
    const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow', hour12: false });
    // en-CA format is YYYY-MM-DD, HH:mm:ss
    return moscowTime.split(',')[0];
};

export const useAdminStore = create<AdminState>((set) => ({
  selectedDate: localStorage.getItem('admin_selected_date') || getToday(),
  endDate: localStorage.getItem('admin_end_date') || null,
  activeService: (localStorage.getItem('admin_active_service') as ServiceType) || 'General',
  activeView: (localStorage.getItem('admin_active_view') as ViewType) || 'grid',
  activeBox: localStorage.getItem('admin_active_box') || 'Все',
  activeStatus: null,
  highlightedOrderId: null,
  pendingFilter: null,
  hasDoneInitialRedirect: false,
  isSidebarOpen: localStorage.getItem('admin_sidebar_open') !== 'false',
  setSelectedDate: (date) => {
    localStorage.setItem('admin_selected_date', date);
    set({ selectedDate: date });
  },
  setEndDate: (date) => {
    if (date) {
      localStorage.setItem('admin_end_date', date);
    } else {
      localStorage.removeItem('admin_end_date');
    }
    set({ endDate: date });
  },
  setActiveService: (service) => {
    localStorage.setItem('admin_active_service', service);
    set({ activeService: service, pendingFilter: null });
  },
  setActiveView: (view) => {
    localStorage.setItem('admin_active_view', view);
    set({ activeView: view, pendingFilter: null });
  },
  setActiveBox: (box) => {
    localStorage.setItem('admin_active_box', box);
    set({ activeBox: box, pendingFilter: null });
  },
  setActiveStatus: (status) => set((state) => ({ 
    activeStatus: status,
    // only clear pendingFilter if status is null and not in a pending view
    pendingFilter: status === null ? state.pendingFilter : state.pendingFilter 
  })),
  setHighlightedOrderId: (orderId) => set({ highlightedOrderId: orderId }),
  setPendingFilter: (filter) => set({ pendingFilter: filter }),
  setHasDoneInitialRedirect: (done) => set({ hasDoneInitialRedirect: done }),
  setIsSidebarOpen: (isOpen) => {
    localStorage.setItem('admin_sidebar_open', String(isOpen));
    set({ isSidebarOpen: isOpen });
  },
}));

export const getServiceIdFromGarage = (garage: string): ServiceType => {
  if (garage === 'Слесарный ремонт и ТО') return 'Repair';
  if (garage === 'Электрика и диагностика') return 'Diagnostic';
  if (garage === 'Детейлинг и покрытия') return 'Detailing';
  return 'General';
};
