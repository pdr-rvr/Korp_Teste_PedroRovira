import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'produtos'
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'notas-fiscais',
    loadComponent: () => import('./features/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'notas-fiscais/nova',
    loadComponent: () => import('./features/invoices/invoice-create/invoice-create.component').then(m => m.InvoiceCreateComponent)
  },
  {
    path: 'notas-fiscais/:id',
    loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent)
  },
  {
    path: 'simulador',
    loadComponent: () => import('./features/simulator/simulator-dashboard/simulator-dashboard.component').then(m => m.SimulatorDashboardComponent)
  },
  {
    path: '**',
    redirectTo: 'produtos'
  }
];
