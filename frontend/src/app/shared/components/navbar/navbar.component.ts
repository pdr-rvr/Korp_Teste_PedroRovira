import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <div class="navbar-brand">
        <div class="brand-logo">
          <svg class="svg-icon brand-icon" viewBox="0 0 24 24">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">KORP ERP</span>
          <span class="brand-subtitle">VIASOFT</span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Indicador de Carregamento Ativo -->
        @if (isLoading()) {
          <div class="loading-tag">
            <span class="spinner spinner-primary"></span>
            <span>Processando dados...</span>
          </div>
        }

        <div class="system-status">
          <span class="status-indicator"></span>
          <span class="status-label">Sistema Online</span>
        </div>

        <div class="user-profile">
          <div class="user-avatar">PR</div>
          <div class="user-meta">
            <span class="user-name">Pedro Rovira</span>
            <span class="user-role">Desenvolvedor</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      box-shadow: var(--shadow-xs);
      z-index: 100;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: var(--primary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .brand-icon {
      width: 20px;
      height: 20px;
      stroke: #ffffff;
      stroke-width: 2;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.1em;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .loading-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--primary-light);
      border: 1px solid #bfdbfe;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-dark);
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding-left: 1rem;
      border-left: 1px solid var(--border-color);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background-color: var(--secondary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }
  `]
})
export class NavbarComponent {
  private loadingService = inject(LoadingService);
  public isLoading = this.loadingService.isLoading;
}
