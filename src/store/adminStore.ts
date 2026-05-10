import { create } from 'zustand';

export type ServiceType = 'General' | 'Repair' | 'Diagnostic' | 'Detailing';
export type ViewType = 'grid' | 'log';

export interface Appointment {
  orderId: string;
  date: string;
  time: string;
  garage: string;
  box: string;
  service: string;
  duration: number;
  status: string;
  clientName: string;
  phone: string;
  car: string;
  note?: string;
  whatToDo?: string;
  finishedTime?: string;
  difficulty?: number | string;
  sessionId?: string;
  createdAt?: string;
}

export interface AppointmentDraft {
  clientName: string;
  phone: string;
  car: string;
  date: string;
  time: string;
  duration: number;
  garage: string;
  box: string;
  service: string;
  note: string;
  status: string;
}

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
  selectedAppointment: Appointment | null;
  isPickingNewTime: boolean;
  setIsPickingNewTime: (isPicking: boolean) => void;
  isDetailsExpanded: boolean;
  setIsDetailsExpanded: (isExpanded: boolean) => void;
  isNewAppointmentExpanded: boolean;
  setIsNewAppointmentExpanded: (isExpanded: boolean) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: (isExpanded: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newAppointmentDraft: AppointmentDraft;
  setNewAppointmentDraft: (draft: Partial<AppointmentDraft>) => void;
  clearNewAppointmentDraft: () => void;
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
  setSelectedAppointment: (appointment: Appointment | null) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const getToday = () => {
    // Current date in Moscow (UTC+3)
    const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow', hour12: false });
    // en-CA format is YYYY-MM-DD, HH:mm:ss
    return moscowTime.split(',')[0];
};

const DEFAULT_DRAFT: AppointmentDraft = {
  clientName: '',
  phone: '',
  car: '',
  date: getToday(),
  time: '09:00',
  duration: 1,
  garage: 'Слесарный ремонт и ТО',
  box: 'Бокс А',
  service: '',
  note: '',
  status: 'CONFIRMED'
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
  selectedAppointment: null,
  isPickingNewTime: false,
  setIsPickingNewTime: (isPicking) => set({ isPickingNewTime: isPicking }),
  isDetailsExpanded: false,
  setIsDetailsExpanded: (isExpanded) => set({ 
    isDetailsExpanded: isExpanded, 
    isNewAppointmentExpanded: false,
    isSearchExpanded: false,
    isPickingNewTime: false 
  }),
  isNewAppointmentExpanded: false,
  setIsNewAppointmentExpanded: (isExpanded) => set({ 
    isNewAppointmentExpanded: isExpanded, 
    isDetailsExpanded: false,
    isSearchExpanded: false,
    isPickingNewTime: false 
  }),
  isSearchExpanded: false,
  setIsSearchExpanded: (isExpanded) => set({
    isSearchExpanded: isExpanded,
    isDetailsExpanded: false,
    isNewAppointmentExpanded: false,
    isPickingNewTime: false
  }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  newAppointmentDraft: DEFAULT_DRAFT,
  setNewAppointmentDraft: (draft) => set((state) => ({ 
    newAppointmentDraft: { ...state.newAppointmentDraft, ...draft } 
  })),
  clearNewAppointmentDraft: () => set((state) => ({ 
    newAppointmentDraft: { ...DEFAULT_DRAFT, date: state.selectedDate } 
  })),
  refreshKey: 0,
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
  setSelectedAppointment: (appointment) => set((state) => ({ 
    selectedAppointment: appointment,
    // Reset picking mode only if we are switching to a different appointment (different orderId)
    // or if we are clearing the selection (appointment is null)
    isPickingNewTime: (appointment && state.selectedAppointment && appointment.orderId === state.selectedAppointment.orderId) 
      ? state.isPickingNewTime 
      : false 
  })),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));

export const getServiceIdFromGarage = (garage: string): ServiceType => {
  if (garage === 'Слесарный ремонт и ТО') return 'Repair';
  if (garage === 'Электрика и диагностика') return 'Diagnostic';
  if (garage === 'Детейлинг и покрытия') return 'Detailing';
  return 'General';
};
