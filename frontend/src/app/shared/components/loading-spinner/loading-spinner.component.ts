import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="spinner-backdrop">
        <div class="spinner-box">
          <div class="spinner-ring"></div>
          <p class="spinner-text">Processando requisição...</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .spinner-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      animation: fadeIn 0.15s ease-out;
    }

    .spinner-box {
      background: #ffffff;
      padding: 1.5rem 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--border-color);
    }

    .spinner-ring {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid rgba(37, 99, 235, 0.15);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .spinner-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class LoadingSpinnerComponent {
  public loadingService = inject(LoadingService);
}
