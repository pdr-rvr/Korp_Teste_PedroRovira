import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Faturamento & Emissão de Notas Fiscais</h1>
        <p>Gerencie o ciclo de vida das notas fiscais, emita com baixa atômica de estoque e consulte o histórico.</p>
      </div>

      <a routerLink="/notas-fiscais/nova" class="btn btn-primary">
        <span>+ Criar Nota Fiscal</span>
      </a>
    </div>

    <!-- Filtros por Status e Busca -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div class="filter-row">
        <div class="status-filters">
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === undefined ? 'btn-primary' : 'btn-secondary'"
            (click)="onFilterStatus(undefined)"
          >
            Todas as Notas
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === InvoiceStatus.Aberta ? 'btn-warning' : 'btn-secondary'"
            (click)="onFilterStatus(InvoiceStatus.Aberta)"
          >
            Abertas
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === InvoiceStatus.Fechada ? 'btn-success' : 'btn-secondary'"
            (click)="onFilterStatus(InvoiceStatus.Fechada)"
          >
            Fechadas
          </button>
        </div>

        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Buscar por número ou cliente (RxJS)..."
            [formControl]="searchControl"
          />
        </div>
      </div>
    </div>

    <!-- Tabela de Notas Fiscais -->
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Data de Criação</th>
            <th>Cliente / Razão Social</th>
            <th>Itens</th>
            <th>Valor Total</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (invoice of invoices; track invoice.id) {
            <tr>
              <td>
                <strong class="invoice-number">#{{ invoice.number }}</strong>
              </td>
              <td>{{ invoice.issueDate | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <strong>{{ invoice.customerName }}</strong>
                @if (invoice.customerDocument) {
                  <small class="doc-text"> • {{ invoice.customerDocument }}</small>
                }
              </td>
              <td>
                <span class="badge badge-neutral">{{ invoice.items.length }} produto(s)</span>
              </td>
              <td>
                <strong class="total-value">{{ invoice.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</strong>
              </td>
              <td>
                @if (invoice.status === InvoiceStatus.Aberta) {
                  <span class="badge badge-warning">Aberta</span>
                } @else {
                  <span class="badge badge-success">Fechada</span>
                }
              </td>
              <td style="text-align: right;">
                <div class="action-buttons">
                  <a [routerLink]="['/notas-fiscais', invoice.id]" class="btn btn-outline btn-sm">
                    Visualizar DANFE
                  </a>

                  @if (invoice.status === InvoiceStatus.Aberta) {
                    <button
                      type="button"
                      class="btn btn-success btn-sm"
                      [disabled]="issuingId === invoice.id"
                      (click)="onIssueDirect(invoice)"
                    >
                      @if (issuingId === invoice.id) {
                        <span class="spinner"></span> Processando...
                      } @else {
                        🖨️ Emitir / Imprimir
                      }
                    </button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="text-center py-5">
                <div class="empty-state">
                  <span class="empty-icon">🧾</span>
                  <h4>Nenhuma nota fiscal encontrada</h4>
                  <p>Crie sua primeira nota fiscal clicando no botão acima.</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }

    .filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .status-filters {
      display: flex;
      gap: 0.5rem;
    }

    .search-input-wrapper {
      position: relative;
      min-width: 280px;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
    }

    .search-input-wrapper input {
      padding-left: 2.25rem;
    }

    .invoice-number {
      font-family: monospace;
      font-size: 0.9375rem;
      color: var(--primary-dark);
    }

    .doc-text {
      color: var(--text-muted);
      display: block;
      font-size: 0.75rem;
    }

    .total-value {
      color: var(--text-primary);
    }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
  `]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  public invoices: Invoice[] = [];
  public selectedStatus: InvoiceStatus | undefined = undefined;
  public searchControl = new FormControl('');
  public issuingId: string | null = null;
  public InvoiceStatus = InvoiceStatus;

  public ngOnInit(): void {
    this.loadInvoices();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadInvoices();
      });

    this.invoiceService.invoices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.invoices = items;
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadInvoices(): void {
    this.invoiceService.getInvoices(this.selectedStatus, this.searchControl.value || '').subscribe();
  }

  public onFilterStatus(status: InvoiceStatus | undefined): void {
    this.selectedStatus = status;
    this.loadInvoices();
  }

  public onIssueDirect(invoice: Invoice): void {
    this.issuingId = invoice.id;
    this.invoiceService.issueInvoice(invoice.id).subscribe({
      next: (response) => {
        this.notificationService.success(response.message, `Nota #${invoice.number} Emitida!`);
        this.issuingId = null;
        this.loadInvoices();
      },
      error: () => {
        this.issuingId = null;
      }
    });
  }
}
