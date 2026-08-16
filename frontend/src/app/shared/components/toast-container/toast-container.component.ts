import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService, Toast } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [ngClass]="'toast-' + toast.type" role="alert">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            } @else if (toast.type === 'danger') {
              <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            } @else if (toast.type === 'warning') {
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            } @else {
              <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            }
          </div>

          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>

          <button type="button" class="toast-close" (click)="remove(toast.id)" aria-label="Fechar notificação">
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 9999;
      max-width: 420px;
      width: calc(100% - 3rem);
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-success {
      border-left: 4px solid var(--success);
      background-color: #ffffff;
    }
    .toast-success .toast-icon { color: var(--success); }

    .toast-danger {
      border-left: 4px solid var(--danger);
      background-color: #ffffff;
    }
    .toast-danger .toast-icon { color: var(--danger); }

    .toast-warning {
      border-left: 4px solid var(--warning);
      background-color: #ffffff;
    }
    .toast-warning .toast-icon { color: var(--warning); }

    .toast-info {
      border-left: 4px solid var(--info);
      background-color: #ffffff;
    }
    .toast-info .toast-icon { color: var(--info); }

    .toast-icon {
      font-size: 1.25rem;
      line-height: 1;
      padding-top: 0.1rem;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .toast-message {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      color: var(--text-primary);
      background-color: var(--bg-subtle);
    }
  `]
})
export class ToastContainerComponent {
  private notificationService = inject(NotificationService);
  public toasts = this.notificationService.toasts;

  public remove(id: string): void {
    this.notificationService.remove(id);
  }
}
