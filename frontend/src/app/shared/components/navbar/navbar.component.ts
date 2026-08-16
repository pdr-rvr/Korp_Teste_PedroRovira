import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <div class="logo-mark">
          <span class="logo-accent">KORP</span> ERP
        </div>
        <span class="badge badge-info">Case Técnico Viasoft</span>
      </div>

      <div class="navbar-right">
        <div class="system-status">
          <span class="status-dot"></span>
          <span class="status-label">Microsserviços Ativos (.NET 8 + Postgres)</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-mark {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--secondary);
    }

    .logo-accent {
      color: var(--primary);
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg-subtle);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
  `]
})
export class NavbarComponent {}
