import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent],
  template: `
    @if (invoice) {
      <div class="page-header">
        <div>
          <a routerLink="/notas-fiscais" class="back-link">
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Voltar para Faturamento</span>
          </a>
          <div class="title-with-badge">
            <h1>Nota Fiscal Nº #{{ invoice.number }}</h1>
            @if (invoice.status === InvoiceStatus.Aberta) {
              <span class="badge badge-warning badge-lg">Status: ABERTA (Aguardando Emissão)</span>
            } @else {
              <span class="badge badge-success badge-lg">Status: FECHADA (Emitida & Estoque Baixado)</span>
            }
          </div>
        </div>

        <div class="header-actions">
          @if (invoice.status === InvoiceStatus.Aberta) {
            <button
              type="button"
              class="btn btn-success btn-lg issue-button"
              [disabled]="isProcessing"
              (click)="openConfirmModal()"
            >
              @if (isProcessing) {
                <span class="spinner"></span>
                <span>Processando Emissão & Estoque...</span>
              } @else {
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>EMITIR / IMPRIMIR NOTA FISCAL</span>
              }
            </button>
          } @else {
            <div class="closed-actions-group">
              <button
                type="button"
                class="btn btn-primary"
                (click)="printDanfe()"
                title="Imprimir documento auxiliar ou salvar como PDF"
              >
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>Imprimir DANFE (PDF)</span>
              </button>
              <div class="closed-notice">
                <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Nota Fiscal Fechada</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Layout DANFE Estilizado -->
      <div class="danfe-container card">
        <div class="danfe-header">
          <div class="danfe-company">
            <h2>KORP ERP / VIASOFT</h2>
            <p>Sistema Integrado de Gestão Empresarial</p>
            <p>Documento Auxiliar da Nota Fiscal Eletrônica (DANFE)</p>
          </div>

          <div class="danfe-meta">
            <div class="meta-box">
              <span class="meta-title">Nº DA NOTA</span>
              <span class="meta-number">{{ invoice.number }}</span>
            </div>
            <div class="meta-box">
              <span class="meta-title">SÉRIE</span>
              <span class="meta-value">1</span>
            </div>
          </div>
        </div>

        <div class="danfe-section-divider"></div>

        <!-- Seção: Dados do Destinatário -->
        <div class="danfe-section">
          <div class="section-title">DESTINATÁRIO / REMETENTE</div>
          <div class="info-grid">
            <div>
              <span class="info-label">NOME / RAZÃO SOCIAL</span>
              <span class="info-value">{{ invoice.customerName }}</span>
            </div>
            <div>
              <span class="info-label">CNPJ / CPF</span>
              <span class="info-value">{{ invoice.customerDocument || 'Não informado' }}</span>
            </div>
            <div>
              <span class="info-label">DATA DE CRIAÇÃO</span>
              <span class="info-value">{{ invoice.issueDate | date:'dd/MM/yyyy HH:mm:ss' }}</span>
            </div>
            <div>
              <span class="info-label">DATA DE EMISSÃO / FECHAMENTO</span>
              <span class="info-value">
                {{ invoice.issuedAt ? (invoice.issuedAt | date:'dd/MM/yyyy HH:mm:ss') : 'Pendente de emissão' }}
              </span>
            </div>
          </div>
        </div>

        <div class="danfe-section-divider"></div>

        <!-- Seção: Itens da Nota -->
        <div class="danfe-section">
          <div class="section-title">DADOS DOS PRODUTOS / SERVIÇOS</div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>CÓD. PROD (SKU)</th>
                  <th>DESCRIÇÃO DO PRODUTO</th>
                  <th>QTD</th>
                  <th>VALOR UNIT.</th>
                  <th>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                @for (item of invoice.items; track item.id) {
                  <tr>
                    <td><code class="sku-tag">{{ item.productCode }}</code></td>
                    <td><strong style="color: var(--text-primary);">{{ item.productDescription }}</strong></td>
                    <td><strong>{{ item.quantity | number:'1.0-2' }} un</strong></td>
                    <td>{{ item.unitPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td><strong style="color: var(--primary);">{{ item.subtotal | currency:'BRL':'symbol':'1.2-2' }}</strong></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totalizadores -->
        <div class="danfe-total-box">
          <div class="total-row">
            <span>Quantidade Total de Itens:</span>
            <strong>{{ invoice.items.length }}</strong>
          </div>
          <div class="total-row-highlight">
            <span>VALOR TOTAL DA NOTA:</span>
            <span class="highlight-price">{{ invoice.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        @if (invoice.status === InvoiceStatus.Fechada) {
          <div class="audit-stamp">
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            <span>AUTENTICAÇÃO FISCAL: OPERAÇÃO ATÔMICA REALIZADA COM SUCESSO (ESTOQUE BAIXADO)</span>
          </div>
        }
      </div>

      <!-- Modal de Confirmação de Emissão -->
      @if (showConfirmModal) {
        <app-confirm-modal
          title="Confirmar Emissão da Nota Fiscal"
          [message]="'Deseja realmente emitir e imprimir a Nota Fiscal Nº ' + invoice.number + '?'"
          subMessage="Esta ação é definitiva: baixará os produtos do estoque no PostgreSQL e alterará o status da nota para Fechada."
          confirmText="Sim, Emitir Nota"
          cancelText="Voltar"
          type="warning"
          [isConfirming]="isProcessing"
          (confirmed)="onConfirmedIssue()"
          (cancelled)="showConfirmModal = false"
        ></app-confirm-modal>
      }
    } @else {
      <div class="card text-center py-5">
        <span class="spinner spinner-primary"></span>
        <p style="margin-top: 1rem;">Carregando detalhes da nota fiscal...</p>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .badge-lg {
      font-size: 0.8125rem;
      padding: 0.35rem 0.85rem;
    }

    .closed-actions-group {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .closed-notice {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background-color: var(--bg-subtle);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.8125rem;
      border: 1px solid var(--border-color);
    }

    .danfe-container {
      background: #ffffff;
      padding: 2.25rem;
    }

    .danfe-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .danfe-company h2 {
      font-size: 1.5rem;
      color: var(--primary-dark);
    }

    .danfe-company p {
      font-size: 0.875rem;
      margin-top: 0.15rem;
    }

    .danfe-meta {
      display: flex;
      gap: 1rem;
    }

    .meta-box {
      border: 2px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.5rem 1.25rem;
      text-align: center;
      min-width: 120px;
      background-color: var(--bg-subtle);
    }

    .meta-title {
      display: block;
      font-size: 0.6875rem;
      font-weight: 800;
      color: var(--text-muted);
    }

    .meta-number {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      font-family: monospace;
    }

    .meta-value {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .danfe-section-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 1.5rem 0;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      background-color: var(--bg-subtle);
      padding: 1.25rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .info-label {
      display: block;
      font-size: 0.6875rem;
      color: var(--text-muted);
      font-weight: 700;
    }

    .info-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .sku-tag {
      font-family: monospace;
      font-size: 0.8125rem;
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-color);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-xs);
    }

    .danfe-total-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 2px solid var(--border-color);
    }

    .total-row {
      display: flex;
      gap: 1rem;
      font-size: 0.9375rem;
      color: var(--text-secondary);
    }

    .total-row-highlight {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .highlight-price {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--primary);
    }

    .audit-stamp {
      margin-top: 1.5rem;
      background-color: var(--success-light);
      border: 1px solid var(--success-border);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--success-text);
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);

  public invoice: Invoice | null = null;
  public isProcessing = false;
  public showConfirmModal = false;
  public InvoiceStatus = InvoiceStatus;

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(id);
    }
  }

  public loadInvoice(id: string): void {
    this.invoiceService.getInvoiceById(id).subscribe(data => {
      this.invoice = data;
    });
  }

  public openConfirmModal(): void {
    if (this.invoice && this.invoice.status === InvoiceStatus.Aberta) {
      this.showConfirmModal = true;
    }
  }

  public printDanfe(): void {
    window.print();
  }

  public onConfirmedIssue(): void {
    if (!this.invoice || this.invoice.status !== InvoiceStatus.Aberta) return;

    this.isProcessing = true;

    this.invoiceService.issueInvoice(this.invoice.id).subscribe({
      next: (response) => {
        this.notificationService.success(response.message, `Nota #${response.invoice.number} Emitida!`);
        this.invoice = response.invoice;
        this.isProcessing = false;
        this.showConfirmModal = false;

        this.productService.getProducts().subscribe();
      },
      error: () => {
        this.isProcessing = false;
        this.showConfirmModal = false;
      }
    });
  }
}
