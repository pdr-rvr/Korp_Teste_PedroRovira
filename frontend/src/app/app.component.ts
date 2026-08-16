import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    ToastContainerComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <div class="app-container">
      <app-sidebar></app-sidebar>

      <main class="main-content">
        <div class="page-body">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>

    <app-toast-container></app-toast-container>
    <app-loading-spinner></app-loading-spinner>
  `
})
export class AppComponent {}
