import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Faturamento & Notas Fiscais</h1>
        <p>Emissão, consulta e acompanhamento de status fiscal com baixa integrada de estoque.</p>
      </div>

      <!-- Botão Padronizado com o mesmo elemento button e ícone do Novo Produto -->
      <button type="button" class="btn btn-primary" (click)="navigateToCreate()">
        <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Nova Nota Fiscal</span>
      </button>
    </div>

    <!-- Filtros e Busca Reativa com RxJS -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div class="filters-row">
        <!-- Campo de Busca Reativo (RxJS debounceTime) -->
        <div class="search-input-wrapper">
          <svg class="svg-icon search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar por cliente, documento (CPF/CNPJ) ou nº da nota..."
            [formControl]="searchControl"
          />
          @if (searchControl.value) {
            <button type="button" class="search-clear" (click)="clearSearch()">✕</button>
          }
        </div>

        <!-- Filtros Rápidos de Status -->
        <div class="status-buttons">
          <span class="filter-label">Status:</span>
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === null ? 'btn-primary' : 'btn-outline'"
            (click)="onFilterStatus(null)"
          >
            Todas
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === InvoiceStatus.Aberta ? 'btn-primary' : 'btn-outline'"
            (click)="onFilterStatus(InvoiceStatus.Aberta)"
          >
            Abertas
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [ngClass]="selectedStatus === InvoiceStatus.Fechada ? 'btn-primary' : 'btn-outline'"
            (click)="onFilterStatus(InvoiceStatus.Fechada)"
          >
            Fechadas
          </button>
        </div>
      </div>
    </div>

    <!-- Tabela de Notas Fiscais -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nº Nota</th>
              <th>Data de Criação</th>
              <th>Cliente / Razão Social</th>
              <th>Qtd. Itens</th>
              <th>Valor Total</th>
              <th>Status Fiscal</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            @if (invoices.length === 0) {
              <tr>
                <td colspan="7" class="text-center py-5">
                  <p>Nenhuma nota fiscal encontrada para os filtros informados.</p>
                </td>
              </tr>
            } @else {
              @for (inv of invoices; track inv.id) {
                <tr>
                  <td>
                    <strong class="invoice-number-tag">#{{ inv.number }}</strong>
                  </td>
                  <td>
                    <span class="invoice-date">{{ inv.issueDate | date:'dd/MM/yyyy HH:mm' }}</span>
                  </td>
                  <td>
                    <div class="customer-name">{{ inv.customerName }}</div>
                    <div class="customer-doc">{{ inv.customerDocument || 'Sem CPF/CNPJ informado' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-info">{{ inv.items.length }} {{ inv.items.length === 1 ? 'item' : 'itens' }}</span>
                  </td>
                  <td>
                    <strong class="invoice-total">{{ inv.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</strong>
                  </td>
                  <td>
                    @if (inv.status === InvoiceStatus.Aberta) {
                      <span class="badge badge-warning">Aberta</span>
                    } @else {
                      <span class="badge badge-success">Fechada</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons-cell">
                      <a [routerLink]="['/notas-fiscais', inv.id]" class="btn btn-outline btn-sm">
                        Visualizar DANFE
                      </a>

                      @if (inv.status === InvoiceStatus.Aberta) {
                        <button
                          type="button"
                          class="btn btn-success btn-sm"
                          [disabled]="isIssuingId === inv.id"
                          (click)="openIssueConfirm(inv)"
                          title="Emitir Nota Fiscal e debitar estoque"
                        >
                          @if (isIssuingId === inv.id) {
                            <span class="spinner"></span>
                          } @else {
                            Emitir
                          }
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Confirmação para Emissão Rápida -->
    @if (invoiceToIssue) {
      <app-confirm-modal
        title="Confirmar Emissão da Nota Fiscal"
        [message]="'Deseja emitir e fechar a Nota Fiscal Nº ' + invoiceToIssue.number + '?'"
        subMessage="Os produtos correspondentes terão o saldo debitado no estoque."
        confirmText="Confirmar Emissão"
        cancelText="Cancelar"
        type="warning"
        [isConfirming]="isIssuingId === invoiceToIssue.id"
        (confirmed)="onConfirmedQuickIssue()"
        (cancelled)="invoiceToIssue = null"
      ></app-confirm-modal>
    }
  `,
  styles: [`
    .filters-row {
      display: flex;
      gap: 1.25rem;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      width: 1rem;
      height: 1rem;
    }

    .search-input {
      padding-left: 2.5rem;
      padding-right: 2.25rem;
      width: 100%;
    }

    .search-clear {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .status-buttons {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-label {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-right: 0.25rem;
    }

    .invoice-number-tag {
      font-family: monospace;
      font-size: 0.9375rem;
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-xs);
      color: var(--primary);
    }

    .invoice-date {
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .customer-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .customer-doc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .invoice-total {
      color: var(--text-primary);
    }

    .action-buttons-cell {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  public invoices: Invoice[] = [];
  public selectedStatus: InvoiceStatus | null = null;
  public searchControl = new FormControl('');
  public isIssuingId: string | null = null;
  public invoiceToIssue: Invoice | null = null;
  public InvoiceStatus = InvoiceStatus;

  public ngOnInit(): void {
    this.loadInvoices();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadInvoices();
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadInvoices(): void {
    const search = this.searchControl.value || '';
    this.invoiceService.getInvoices(this.selectedStatus ?? undefined, search).subscribe(result => {
      this.invoices = result.items;
    });
  }

  public onFilterStatus(status: InvoiceStatus | null): void {
    this.selectedStatus = status;
    this.loadInvoices();
  }

  public clearSearch(): void {
    this.searchControl.setValue('');
  }

  public navigateToCreate(): void {
    this.router.navigate(['/notas-fiscais/nova']);
  }

  public openIssueConfirm(invoice: Invoice): void {
    this.invoiceToIssue = invoice;
  }

  public onConfirmedQuickIssue(): void {
    if (!this.invoiceToIssue) return;
    const inv = this.invoiceToIssue;

    this.isIssuingId = inv.id;
    this.invoiceService.issueInvoice(inv.id).subscribe({
      next: (res) => {
        this.notificationService.success(res.message, `Nota #${res.invoice.number} Emitida!`);
        this.isIssuingId = null;
        this.invoiceToIssue = null;
        this.loadInvoices();

        // Atualizar estoque no cache reativo
        this.productService.getProducts().subscribe();
      },
      error: () => {
        this.isIssuingId = null;
        this.invoiceToIssue = null;
      }
    });
  }
}
