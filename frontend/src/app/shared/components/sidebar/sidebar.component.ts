import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-section-title">Módulos do Sistema</div>

      <nav class="nav-menu">
        <a routerLink="/produtos" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📦</span>
          <span class="nav-text">Produtos & Estoque</span>
        </a>

        <a routerLink="/notas-fiscais" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🧾</span>
          <span class="nav-text">Faturamento & Notas</span>
        </a>

        <a routerLink="/simulador" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">⚡</span>
          <span class="nav-text">Simulador & IA</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="version-info">
          <p class="project-author">Pedro Rovira</p>
          <p class="project-stack">Angular 19 • .NET 8 • Postgres</p>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      min-height: calc(100vh - 64px);
    }

    .sidebar-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 0 0.75rem 0.75rem 0.75rem;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all var(--transition-fast);
    }

    .nav-icon {
      font-size: 1.125rem;
    }

    .nav-item:hover {
      background-color: var(--bg-subtle);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: var(--primary-light);
      color: var(--primary);
      box-shadow: inset 3px 0 0 var(--primary);
    }

    .sidebar-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .project-author {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .project-stack {
      font-size: 0.6875rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
  `]
})
export class SidebarComponent {}
