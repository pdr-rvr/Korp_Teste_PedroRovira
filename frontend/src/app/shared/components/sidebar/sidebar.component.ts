import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-menu-label">Módulos do Sistema</div>

      <nav class="sidebar-nav">
        <!-- 1. Estoque & Produtos -->
        <a routerLink="/produtos" routerLinkActive="active" class="nav-item">
          <svg class="svg-icon nav-icon" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <span class="nav-label">Estoque & Produtos</span>
        </a>

        <!-- 2. Faturamento & Notas -->
        <a routerLink="/notas-fiscais" routerLinkActive="active" class="nav-item">
          <svg class="svg-icon nav-icon" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span class="nav-label">Faturamento & Notas</span>
        </a>

        <!-- 3. Simulador de Falhas, Concorrência & IA -->
        <a routerLink="/simulador" routerLinkActive="active" class="nav-item">
          <svg class="svg-icon nav-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span class="nav-label">Painel do Simulador</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-badge">
          <span class="footer-dot"></span>
          <span>PostgreSQL 16 Multi-DB</span>
        </div>
        <div class="footer-version">KORP ERP v1.0.0</div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      padding: 1.5rem 1rem;
    }

    .sidebar-menu-label {
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .nav-item:hover {
      background-color: var(--bg-subtle);
      color: var(--primary);
    }

    .nav-item.active {
      background-color: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
      box-shadow: inset 3px 0 0 var(--primary);
    }

    .nav-icon {
      width: 1.25rem;
      height: 1.25rem;
      stroke-width: 1.75;
      color: inherit;
    }

    .sidebar-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .footer-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .footer-dot {
      width: 6px;
      height: 6px;
      background-color: var(--success);
      border-radius: 50%;
    }

    .footer-version {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }
  `]
})
export class SidebarComponent {}
