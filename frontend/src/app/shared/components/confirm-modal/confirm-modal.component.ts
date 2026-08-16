import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-content confirm-box">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button type="button" class="btn btn-outline btn-sm btn-icon" (click)="cancelled.emit()">✕</button>
        </div>

        <div class="modal-body">
          <div class="confirm-body-content">
            <div class="confirm-icon-wrapper" [ngClass]="'icon-' + type">
              @if (type === 'warning') {
                <svg class="svg-icon confirm-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              } @else if (type === 'danger') {
                <svg class="svg-icon confirm-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              } @else {
                <svg class="svg-icon confirm-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            </div>
            <div class="confirm-text">
              <p class="confirm-message">{{ message }}</p>
              @if (subMessage) {
                <p class="confirm-submessage">{{ subMessage }}</p>
              }
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            [ngClass]="type === 'danger' ? 'btn-danger' : (type === 'warning' ? 'btn-success' : 'btn-primary')"
            [disabled]="isConfirming"
            (click)="confirmed.emit()"
          >
            @if (isConfirming) {
              <span class="spinner"></span> Confirmando...
            } @else {
              {{ confirmText }}
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-box {
      max-width: 480px;
    }

    .confirm-body-content {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .confirm-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .confirm-icon {
      width: 24px;
      height: 24px;
      stroke-width: 2;
    }

    .icon-warning {
      background-color: var(--warning-light);
      color: var(--warning-text);
      border: 1px solid var(--warning-border);
    }

    .icon-danger {
      background-color: var(--danger-light);
      color: var(--danger-text);
      border: 1px solid var(--danger-border);
    }

    .icon-primary {
      background-color: var(--primary-light);
      color: var(--primary);
      border: 1px solid #bfdbfe;
    }

    .confirm-message {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
      line-height: 1.4;
    }

    .confirm-submessage {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
  `]
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmação de Operação';
  @Input() message: string = 'Deseja prosseguir com esta ação?';
  @Input() subMessage?: string;
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() type: 'primary' | 'warning' | 'danger' = 'warning';
  @Input() isConfirming: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelled.emit();
    }
  }
}
