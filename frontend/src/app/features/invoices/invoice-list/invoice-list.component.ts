import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Faturamento & Notas Fiscais</h1>
        <p>Emissão, consulta e acompanhamento de status fiscal com baixa integrada de estoque.</p>
      </div>

      <div>
        <a routerLink="/notas-fiscais/nova" class="btn btn-primary">
          <span>+ Nova Nota Fiscal</span>
        </a>
      </div>
    </div>

    <!-- Filtros de Status -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-secondary);">Filtrar por Status:</span>
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
          Abertas (Pendentes)
        </button>
        <button
          type="button"
          class="btn btn-sm"
          [ngClass]="selectedStatus === InvoiceStatus.Fechada ? 'btn-primary' : 'btn-outline'"
          (click)="onFilterStatus(InvoiceStatus.Fechada)"
        >
          Fechadas (Concluídas)
        </button>
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
                  <p>Nenhuma nota fiscal encontrada para o filtro selecionado.</p>
                </td>
              </tr>
            } @else {
              @for (inv of invoices; track inv.id) {
                <tr>
                  <td>
                    <strong style="font-size: 1.05rem; font-family: monospace;">#{{ inv.number }}</strong>
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
  `
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);

  public invoices: Invoice[] = [];
  public selectedStatus: InvoiceStatus | null = null;
  public isIssuingId: string | null = null;
  public invoiceToIssue: Invoice | null = null;
  public InvoiceStatus = InvoiceStatus;

  public ngOnInit(): void {
    this.loadInvoices();
  }

  public loadInvoices(): void {
    this.invoiceService.getInvoices(this.selectedStatus ?? undefined).subscribe(result => {
      this.invoices = result.items;
    });
  }

  public onFilterStatus(status: InvoiceStatus | null): void {
    this.selectedStatus = status;
    this.loadInvoices();
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
