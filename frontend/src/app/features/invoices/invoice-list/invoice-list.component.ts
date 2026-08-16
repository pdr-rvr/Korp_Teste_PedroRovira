import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

      <a routerLink="/notas-fiscais/nova" class="btn btn-primary">
        <span>+ Nova Nota Fiscal</span>
      </a>
    </div>

    <!-- Filtros e Busca Reativa com RxJS -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div class="filters-row">
        <!-- Campo de Busca Reativo (RxJS debounceTime) -->
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
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
              <th>Nº NOTA</th>
              <th>DATA DE CRIAÇÃO</th>
              <th>CLIENTE / DESTINATÁRIO</th>
              <th>QTD. ITENS</th>
              <th>VALOR TOTAL</th>
              <th>STATUS FISCAL</th>
              <th style="text-align: right;">AÇÕES</th>
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
                    <strong style="font-size: 1.05rem; font-family: monospace; color: var(--primary-dark);">#{{ inv.number }}</strong>
                  </td>
                  <td>
                    {{ inv.issueDate | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td>
                    <div><strong>{{ inv.customerName }}</strong></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">{{ inv.customerDocument || 'Sem CPF/CNPJ' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-info">{{ inv.items.length }} {{ inv.items.length === 1 ? 'item' : 'itens' }}</span>
                  </td>
                  <td>
                    <strong style="color: var(--primary-dark);">{{ inv.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</strong>
                  </td>
                  <td>
                    @if (inv.status === InvoiceStatus.Aberta) {
                      <span class="badge badge-warning">Aberta</span>
                    } @else {
                      <span class="badge badge-success">Fechada</span>
                    }
                  </td>
                  <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                      <a [routerLink]="['/notas-fiscais', inv.id]" class="btn btn-outline btn-sm">
                        Visualizar DANFE
                      </a>

                      @if (inv.status === InvoiceStatus.Aberta) {
                        <button
                          type="button"
                          class="btn btn-success btn-sm"
                          [disabled]="isIssuingId === inv.id"
                          (click)="openIssueConfirm(inv)"
                          title="Emitir/Imprimir Nota Fiscal e baixar estoque"
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
      font-size: 0.9375rem;
      color: var(--text-muted);
      pointer-events: none;
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
  `]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  public invoices: Invoice[] = [];
  public selectedStatus: InvoiceStatus | null = null;
  public searchControl = new FormControl('');
  public isIssuingId: string | null = null;
  public invoiceToIssue: Invoice | null = null;
  public InvoiceStatus = InvoiceStatus;

  public ngOnInit(): void {
    this.loadInvoices();

    // Busca reativa com RxJS debounceTime
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
