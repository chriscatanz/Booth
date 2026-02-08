import { create } from 'zustand';
import { ToastType } from '@/types/enums';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type, title, message) => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, type, title, message }] });
    // Auto-dismiss after 4s
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  success: (title, message) => get().addToast(ToastType.Success, title, message),
  error: (title, message) => get().addToast(ToastType.Error, title, message),
  warning: (title, message) => get().addToast(ToastType.Warning, title, message),
  info: (title, message) => get().addToast(ToastType.Info, title, message),
}));
