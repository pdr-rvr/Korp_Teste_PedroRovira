import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (invoice) {
      <div class="page-header">
        <div>
          <a routerLink="/notas-fiscais" class="back-link">← Voltar para Faturamento</a>
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
          <!-- Botão de Impressão / Emissão Obrigatório conforme especificação do PDF -->
          @if (invoice.status === InvoiceStatus.Aberta) {
            <button
              type="button"
              class="btn btn-success btn-lg issue-button"
              [disabled]="isProcessing"
              (click)="onIssueAndPrint()"
            >
              @if (isProcessing) {
                <span class="spinner"></span>
                <span>Processando Emissão & Estoque...</span>
              } @else {
                <span>🖨️ IMPRIMIR / EMITIR NOTA FISCAL</span>
              }
            </button>
          } @else {
            <div class="closed-notice">
              <span class="lock-icon">🔒</span>
              <span>Nota Fiscal Fechada e Concluída</span>
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
            <p>Emissão de Documento Auxiliar da Nota Fiscal</p>
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
                  <th>CÓD. PROD</th>
                  <th>DESCRIÇÃO DO PRODUTO</th>
                  <th>QTD</th>
                  <th>VALOR UNIT.</th>
                  <th>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                @for (item of invoice.items; track item.id) {
                  <tr>
                    <td><code>{{ item.productCode }}</code></td>
                    <td>{{ item.productDescription }}</td>
                    <td><strong>{{ item.quantity | number:'1.0-2' }} un</strong></td>
                    <td>{{ item.unitPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td><strong>{{ item.subtotal | currency:'BRL':'symbol':'1.2-2' }}</strong></td>
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
            <span>✓ AUTENTICAÇÃO FISCAL: OPERAÇÃO ATÔMICA REALIZADA COM SUCESSO</span>
          </div>
        }
      </div>
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
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 0.5rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .badge-lg {
      font-size: 0.875rem;
      padding: 0.35rem 0.85rem;
    }

    .issue-button {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      letter-spacing: 0.02em;
    }

    .closed-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-subtle);
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 600;
      border: 1px solid var(--border-color);
    }

    .danfe-container {
      background: #ffffff;
      padding: 2rem;
    }

    .danfe-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .danfe-company h2 {
      font-size: 1.5rem;
      color: var(--secondary);
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
      padding: 0.5rem 1rem;
      text-align: center;
      min-width: 110px;
    }

    .meta-title {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .meta-number {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary-dark);
      font-family: monospace;
    }

    .meta-value {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .danfe-section-divider {
      height: 1px;
      background: var(--border-color);
      margin: 1.5rem 0;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      background: var(--bg-subtle);
      padding: 1rem;
      border-radius: var(--radius-sm);
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

    .danfe-total-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
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
      color: var(--success-text);
    }

    .audit-stamp {
      margin-top: 1.5rem;
      background: var(--success-light);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--success-text);
      font-weight: 700;
      font-size: 0.8125rem;
      text-align: center;
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);

  public invoice: Invoice | null = null;
  public isProcessing = false;
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

  public onIssueAndPrint(): void {
    if (!this.invoice || this.invoice.status !== InvoiceStatus.Aberta) return;

    this.isProcessing = true;

    this.invoiceService.issueInvoice(this.invoice.id).subscribe({
      next: (response) => {
        this.notificationService.success(response.message, `Nota #${response.invoice.number} Emitida!`);
        this.invoice = response.invoice;
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
      }
    });
  }
}
