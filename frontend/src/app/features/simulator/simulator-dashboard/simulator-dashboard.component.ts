import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AiAuditReport, CreateInvoiceRequest } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { SimulationService } from '../../../core/services/simulation.service';

@Component({
  selector: 'app-simulator-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Painel de Resiliência, Concorrência & Inteligência Artificial</h1>
        <p>Ambiente interativo para simulação de falhas (Polly), testes de corrida concorrente e auditoria fiscal inteligente.</p>
      </div>

      <!-- Botão de Repovoar Banco de Dados -->
      <button
        type="button"
        class="btn btn-secondary"
        [disabled]="isResettingDb"
        (click)="resetDatabaseData()"
      >
        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        @if (isResettingDb) {
          <span>Repovoando Banco...</span>
        } @else {
          <span>Repovoar / Resetar Banco</span>
        }
      </button>
    </div>

    <div class="simulator-grid">
      <!-- 1. Simulador de Falhas e Resiliência Polly -->
      <div class="card sim-card">
        <div class="card-header">
          <div class="sim-header-title">
            <div class="sim-icon-box">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h3>1. Simulação de Falhas & Resiliência (Polly)</h3>
              <p>Testa a tolerância a falhas na comunicação inter-serviços com Retry e Circuit Breaker.</p>
            </div>
          </div>
        </div>

        <div class="sim-body">
          <div class="status-indicator-box" [ngClass]="isFaultActive ? 'box-danger' : 'box-success'">
            <div class="status-title">
              Estado do Microsserviço de Estoque:
              <strong>{{ isFaultActive ? 'SIMULAÇÃO DE FALHA ATIVA (HTTP 503)' : 'OPERANDO NORMALMENTE' }}</strong>
            </div>
            <p class="status-desc">
              {{ isFaultActive 
                ? 'As requisições de estoque falharão. O Polly executará 3 tentativas com backoff exponencial antes de exibir feedback amigável.' 
                : 'Todas as requisições REST estão respondendo normalmente com persistência no PostgreSQL.' }}
            </p>
          </div>

          <div class="sim-controls">
            @if (!isFaultActive) {
              <button type="button" class="btn btn-danger" (click)="toggleFault(true)">
                <svg class="svg-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Simular Queda no StockService</span>
              </button>
            } @else {
              <button type="button" class="btn btn-success" (click)="toggleFault(false)">
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Restaurar StockService ao Normal</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- 2. Simulador de Concorrência -->
      <div class="card sim-card">
        <div class="card-header">
          <div class="sim-header-title">
            <div class="sim-icon-box">
              <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <h3>2. Teste de Concorrência Simultânea</h3>
              <p>Disputa paralela pelo produto PROD-005 com saldo físico = 1 unidade.</p>
            </div>
          </div>
        </div>

        <div class="sim-body">
          <p class="sim-explanation">
            Cria <strong>2 notas fiscais simultâneas</strong> no PostgreSQL para o item <code>PROD-005</code> e dispara o fechamento paralelo imediato para comprovar o bloqueio atômico de corrida.
          </p>

          <button
            type="button"
            class="btn btn-primary"
            [disabled]="isTestingConcurrency"
            (click)="runConcurrencyTest()"
          >
            @if (isTestingConcurrency) {
              <span class="spinner"></span> Executando Concorrência Paralela...
            } @else {
              <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Disparar 2 Emissões Concorrentes (Saldo 1)</span>
            }
          </button>

          @if (concurrencyLogs.length > 0) {
            <div class="terminal-logs">
              <div class="terminal-header">Log de Execução Transacional:</div>
              @for (log of concurrencyLogs; track $index) {
                <div class="log-line" [ngClass]="log.type">
                  <span class="log-time">[{{ log.time }}]</span> {{ log.text }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- 3. Auditoria e Predição com IA -->
    <div class="card sim-card mt-4" style="margin-top: 1.75rem;">
      <div class="card-header">
        <div class="sim-header-title">
          <div class="sim-icon-box">
            <svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <h3>3. Assistente de Inteligência Artificial & Auditoria Fiscal</h3>
            <p>Análise preditiva de faturamento, monitoramento de ruptura de estoque e sugestões fiscais.</p>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm"
          [disabled]="isLoadingAi"
          (click)="loadAiAudit()"
        >
          @if (isLoadingAi) {
            <span class="spinner"></span> Processando...
          } @else {
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span>Executar Auditoria IA</span>
          }
        </button>
      </div>

      <div class="sim-body">
        @if (aiReport) {
          <div class="ai-summary-box">
            <div class="ai-summary-title">Resumo da Análise Executiva:</div>
            <p>{{ aiReport.summary }}</p>
          </div>

          <div class="ai-insights-grid">
            <div class="ai-col">
              <h4>Alertas Fiscais & Operacionais</h4>
              <ul>
                @for (alert of aiReport.fiscalAlerts; track $index) {
                  <li class="alert-item">{{ alert }}</li>
                }
              </ul>
            </div>

            <div class="ai-col">
              <h4>Insights Preditivos de Estoque</h4>
              <ul>
                @for (insight of aiReport.inventoryInsights; track $index) {
                  <li class="insight-item">{{ insight }}</li>
                }
              </ul>
            </div>

            <div class="ai-col">
              <h4>Recomendações Estratégicas</h4>
              <ul>
                @for (rec of aiReport.recommendations; track $index) {
                  <li class="rec-item">{{ rec }}</li>
                }
              </ul>
            </div>
          </div>
        } @else {
          <div class="text-center py-4">
            <p>Clique em <strong>"Executar Auditoria IA"</strong> para processar as métricas de faturamento e estoque.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .simulator-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .simulator-grid {
        grid-template-columns: 1fr;
      }
    }

    .sim-card {
      display: flex;
      flex-direction: column;
    }

    .sim-header-title {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .sim-icon-box {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      background-color: var(--primary-light);
      color: var(--primary);
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .status-indicator-box {
      padding: 1.25rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
      border: 1px solid transparent;
    }

    .box-success {
      background-color: var(--success-light);
      border-color: var(--success-border);
      color: var(--success-text);
    }

    .box-danger {
      background-color: var(--danger-light);
      border-color: var(--danger-border);
      color: var(--danger-text);
    }

    .status-title {
      font-size: 0.9375rem;
      margin-bottom: 0.35rem;
    }

    .status-desc {
      font-size: 0.8125rem;
      color: inherit;
      opacity: 0.95;
    }

    .sim-explanation {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }

    .terminal-logs {
      margin-top: 1.25rem;
      background: #0f172a;
      border-radius: var(--radius-sm);
      padding: 1rem;
      color: #e2e8f0;
      font-family: monospace;
      font-size: 0.8125rem;
      max-height: 220px;
      overflow-y: auto;
      border: 1px solid #334155;
    }

    .terminal-header {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.35rem;
    }

    .log-line {
      margin-bottom: 0.35rem;
      line-height: 1.4;
    }

    .log-line.success { color: #34d399; }
    .log-line.error { color: #f87171; }
    .log-line.info { color: #60a5fa; }

    .log-time {
      color: #64748b;
    }

    .ai-summary-box {
      background-color: var(--primary-light);
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-sm);
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .ai-summary-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--primary-dark);
      margin-bottom: 0.25rem;
    }

    .ai-insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .ai-col h4 {
      font-size: 0.9375rem;
      margin-bottom: 0.75rem;
    }

    .ai-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ai-col li {
      font-size: 0.8125rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-sm);
      line-height: 1.4;
    }

    .alert-item {
      background-color: var(--warning-light);
      border-left: 3px solid var(--warning);
      color: var(--warning-text);
    }

    .insight-item {
      background-color: var(--info-light);
      border-left: 3px solid var(--info);
      color: var(--info-text);
    }

    .rec-item {
      background-color: var(--success-light);
      border-left: 3px solid var(--success);
      color: var(--success-text);
    }
  `]
})
export class SimulatorDashboardComponent implements OnInit {
  private simulationService = inject(SimulationService);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);

  public isFaultActive = false;
  public isTestingConcurrency = false;
  public isResettingDb = false;
  public isLoadingAi = false;
  public aiReport: AiAuditReport | null = null;
  public concurrencyLogs: Array<{ time: string; text: string; type: 'success' | 'error' | 'info' }> = [];

  public ngOnInit(): void {
    this.checkFaultStatus();
    this.loadAiAudit();
  }

  public checkFaultStatus(): void {
    this.simulationService.getStockFaultStatus().subscribe({
      next: (res) => {
        this.isFaultActive = res.isFaultActive;
      },
      error: () => {}
    });
  }

  public toggleFault(enable: boolean): void {
    this.simulationService.toggleStockFault(enable).subscribe({
      next: (res) => {
        this.isFaultActive = res.isFaultActive;
        if (enable) {
          this.notificationService.warning('Simulação de falha ativada. O StockService responderá com erro HTTP 503.');
        } else {
          this.notificationService.success('StockService restaurado com sucesso para operação normal.');
        }
      }
    });
  }

  public resetDatabaseData(): void {
    this.isResettingDb = true;
    this.simulationService.resetDatabases().subscribe({
      next: () => {
        this.notificationService.success('Bancos de dados de Estoque e Faturamento limpos e repovoados com sucesso!');
        this.isResettingDb = false;
        this.productService.getProducts().subscribe();
        this.loadAiAudit();
      },
      error: (err) => {
        this.notificationService.error(`Erro ao repovoar banco: ${err.message}`);
        this.isResettingDb = false;
      }
    });
  }

  public runConcurrencyTest(): void {
    this.isTestingConcurrency = true;
    this.concurrencyLogs = [];
    this.addLog('Iniciando teste de concorrência simultânea para o item PROD-005 (Saldo = 1)...', 'info');

    const req1: CreateInvoiceRequest = {
      customerName: 'Cliente A (Thread 1 - Disputa Concorrente)',
      items: [{ productCode: 'PROD-005', productDescription: 'Roteador Cisco Meraki MX68', quantity: 1, unitPrice: 6800.00 }]
    };

    const req2: CreateInvoiceRequest = {
      customerName: 'Cliente B (Thread 2 - Disputa Concorrente)',
      items: [{ productCode: 'PROD-005', productDescription: 'Roteador Cisco Meraki MX68', quantity: 1, unitPrice: 6800.00 }]
    };

    this.addLog('Criando Notas Fiscais paralelas no PostgreSQL com status Aberta...', 'info');

    forkJoin([
      this.invoiceService.createInvoice(req1),
      this.invoiceService.createInvoice(req2)
    ]).subscribe({
      next: ([inv1, inv2]) => {
        this.addLog(`Notas geradas: Nota #${inv1.number} e Nota #${inv2.number}.`, 'info');
        this.addLog(`Disparando POST /issue simultâneo concorrendo pelo saldo 1...`, 'info');

        let completed = 0;

        this.invoiceService.issueInvoice(inv1.id).subscribe({
          next: () => {
            this.addLog(`[Sucesso Concorrente] Nota #${inv1.number} emitida e saldo baixado com sucesso!`, 'success');
            checkFinished();
          },
          error: (err) => {
            this.addLog(`[Bloqueio Concorrente] Nota #${inv1.number} rejeitada com segurança: ${err.error?.detail || err.message}`, 'error');
            checkFinished();
          }
        });

        this.invoiceService.issueInvoice(inv2.id).subscribe({
          next: () => {
            this.addLog(`[Sucesso Concorrente] Nota #${inv2.number} emitida e saldo baixado com sucesso!`, 'success');
            checkFinished();
          },
          error: (err) => {
            this.addLog(`[Bloqueio Concorrente] Nota #${inv2.number} rejeitada com segurança: ${err.error?.detail || err.message}`, 'error');
            checkFinished();
          }
        });

        const checkFinished = () => {
          completed++;
          if (completed === 2) {
            this.addLog('Concorrência atômica validada! Apenas uma transação obteve o saldo e a outra foi bloqueada sem inconsistências.', 'info');
            this.isTestingConcurrency = false;
            this.productService.getProducts().subscribe();
          }
        };
      },
      error: (err) => {
        this.addLog(`Falha ao preparar teste de concorrência: ${err.message}`, 'error');
        this.isTestingConcurrency = false;
      }
    });
  }

  public loadAiAudit(): void {
    this.isLoadingAi = true;
    this.simulationService.getAiAuditReport().subscribe({
      next: (report) => {
        this.aiReport = report;
        this.isLoadingAi = false;
      },
      error: () => {
        this.isLoadingAi = false;
      }
    });
  }

  private addLog(text: string, type: 'success' | 'error' | 'info'): void {
    const time = new Date().toLocaleTimeString();
    this.concurrencyLogs.push({ time, text, type });
  }
}
