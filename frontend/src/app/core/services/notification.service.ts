import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  public toasts = this._toasts.asReadonly();

  public show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    this._toasts.update(current => [...current, newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  public success(message: string, title: string = 'Sucesso'): void {
    this.show({ type: 'success', title, message });
  }

  public error(message: string, title: string = 'Erro'): void {
    this.show({ type: 'danger', title, message, duration: 8000 });
  }

  public warning(message: string, title: string = 'Atenção'): void {
    this.show({ type: 'warning', title, message, duration: 6000 });
  }

  public info(message: string, title: string = 'Informação'): void {
    this.show({ type: 'info', title, message });
  }

  public remove(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }
}
