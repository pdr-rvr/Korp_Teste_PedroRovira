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
          <button type="button" class="btn btn-outline btn-sm" (click)="cancelled.emit()">✕</button>
        </div>

        <div class="modal-body">
          <div class="confirm-body-content">
            <div class="confirm-icon" [ngClass]="'icon-' + type">
              @if (type === 'warning') { ⚠️ }
              @else if (type === 'danger') { 🛑 }
              @else { ❓ }
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

    .confirm-icon {
      font-size: 2.25rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .confirm-message {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
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
