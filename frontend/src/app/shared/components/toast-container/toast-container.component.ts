import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-indicator"></div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button type="button" class="toast-close" (click)="notificationService.remove(toast.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      background: #ffffff;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      overflow: hidden;
      position: relative;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast-indicator {
      width: 6px;
      align-self: stretch;
      flex-shrink: 0;
    }

    .toast-success .toast-indicator { background-color: var(--success); }
    .toast-danger .toast-indicator { background-color: var(--danger); }
    .toast-warning .toast-indicator { background-color: var(--warning); }
    .toast-info .toast-indicator { background-color: var(--info); }

    .toast-content {
      padding: 0.875rem 1rem;
      flex: 1;
      min-width: 0;
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
      word-break: break-word;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.75rem 0.875rem;
      line-height: 1;
      transition: color var(--transition-fast);
    }

    .toast-close:hover {
      color: var(--text-primary);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  public notificationService = inject(NotificationService);
}
