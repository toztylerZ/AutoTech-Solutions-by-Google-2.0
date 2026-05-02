import { create } from 'zustand';

export type ServiceType = 'General' | 'Repair' | 'Diagnostic' | 'Detailing';
export type ViewType = 'grid' | 'log';

interface AdminState {
  selectedDate: string;
  endDate: string | null;
  activeService: ServiceType;
  activeView: ViewType;
  activeBox: string;
  isSidebarOpen: boolean;
  setSelectedDate: (date: string) => void;
  setEndDate: (date: string | null) => void;
  setActiveService: (service: ServiceType) => void;
  setActiveView: (view: ViewType) => void;
  setActiveBox: (box: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const useAdminStore = create<AdminState>((set) => ({
  selectedDate: localStorage.getItem('admin_selected_date') || getToday(),
  endDate: localStorage.getItem('admin_end_date') || null,
  activeService: (localStorage.getItem('admin_active_service') as ServiceType) || 'General',
  activeView: (localStorage.getItem('admin_active_view') as ViewType) || 'grid',
  activeBox: localStorage.getItem('admin_active_box') || 'Все',
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
    set({ activeService: service });
  },
  setActiveView: (view) => {
    localStorage.setItem('admin_active_view', view);
    set({ activeView: view });
  },
  setActiveBox: (box) => {
    localStorage.setItem('admin_active_box', box);
    set({ activeBox: box });
  },
  setIsSidebarOpen: (isOpen) => {
    localStorage.setItem('admin_sidebar_open', String(isOpen));
    set({ isSidebarOpen: isOpen });
  },
}));
