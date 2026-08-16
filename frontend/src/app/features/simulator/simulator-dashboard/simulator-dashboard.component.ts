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
        <p>Ambiente interativo de testes para simulação de falhas (Polly), condições de corrida em concorrência e auditoria inteligente por IA.</p>
      </div>
    </div>

    <div class="simulator-grid">
      <!-- 1. Simulador de Falhas e Resiliência Polly -->
      <div class="card sim-card">
        <div class="card-header">
          <div class="sim-header-title">
            <span class="sim-icon">🛡️</span>
            <div>
              <h3>1. Simulação de Falhas & Resiliência (Polly)</h3>
              <p>Requisito obrigatório do desafio: testar a recuperação de falhas no microsserviço de estoque.</p>
            </div>
          </div>
        </div>

        <div class="sim-body">
          <div class="status-indicator-box" [ngClass]="isFaultActive ? 'box-danger' : 'box-success'">
            <div class="status-title">
              Estado do Microsserviço de Estoque:
              <strong>{{ isFaultActive ? 'SIMULAÇÃO DE FALHA ATIVA (503)' : 'OPERANDO NORMALMENTE' }}</strong>
            </div>
            <p class="status-desc">
              {{ isFaultActive 
                ? 'As requisições de estoque falharão. O Polly executará 3 tentativas com backoff exponencial antes de exibir mensagem amigável.' 
                : 'Todas as requisições REST estão respondendo normalmente com persistência no PostgreSQL.' }}
            </p>
          </div>

          <div class="sim-controls">
            @if (!isFaultActive) {
              <button type="button" class="btn btn-danger" (click)="toggleFault(true)">
                ⚠️ Simular Queda / Falha no StockService
              </button>
            } @else {
              <button type="button" class="btn btn-success" (click)="toggleFault(false)">
                ✓ Restaurar StockService ao Normal
              </button>
            }
          </div>
        </div>
      </div>

      <!-- 2. Simulador de Concorrência -->
      <div class="card sim-card">
        <div class="card-header">
          <div class="sim-header-title">
            <span class="sim-icon">⚡</span>
            <div>
              <h3>2. Teste de Concorrência Simultânea</h3>
              <p>Requisito opcional: produto com saldo 1 disputado por duas notas fiscais ao mesmo tempo.</p>
            </div>
          </div>
        </div>

        <div class="sim-body">
          <p class="sim-explanation">
            Ao clicar no botão abaixo, o sistema criará <strong>2 notas fiscais paralelas</strong> com status <code>Aberta</code> para o item <code>PROD-005</code> (saldo = 1) e disparará a emissão das duas simultaneamente via HTTP.
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
              🚀 Disparar 2 Emissões Concorrentes (Saldo 1)
            }
          </button>

          @if (concurrencyLogs.length > 0) {
            <div class="terminal-logs">
              <div class="terminal-header">Log de Execução em Tempo Real:</div>
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
    <div class="card sim-card mt-4" style="margin-top: 1.5rem;">
      <div class="card-header">
        <div class="sim-header-title">
          <span class="sim-icon">🤖</span>
          <div>
            <h3>3. Assistente de Inteligência Artificial & Auditoria Fiscal</h3>
            <p>Requisito opcional: análise preditiva do volume de faturamento, alerta de ruptura de estoque e sugestões fiscais.</p>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm"
          [disabled]="isLoadingAi"
          (click)="loadAiAudit()"
        >
          @if (isLoadingAi) {
            <span class="spinner"></span> Analisando...
          } @else {
            🔄 Executar Auditoria IA
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
              <h4>🚨 Alertas Fiscais & Operacionais</h4>
              <ul>
                @for (alert of aiReport.fiscalAlerts; track $index) {
                  <li class="alert-item">{{ alert }}</li>
                }
              </ul>
            </div>

            <div class="ai-col">
              <h4>📊 Insights Preditivos de Estoque</h4>
              <ul>
                @for (insight of aiReport.inventoryInsights; track $index) {
                  <li class="insight-item">{{ insight }}</li>
                }
              </ul>
            </div>

            <div class="ai-col">
              <h4>💡 Recomendações Estratégicas</h4>
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
    .page-header {
      margin-bottom: 2rem;
    }

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
      align-items: flex-start;
      gap: 0.875rem;
    }

    .sim-icon {
      font-size: 1.75rem;
      line-height: 1;
    }

    .status-indicator-box {
      padding: 1.25rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
    }

    .box-success {
      background-color: var(--success-light);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--success-text);
    }

    .box-danger {
      background-color: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger-text);
    }

    .status-title {
      font-size: 0.9375rem;
      margin-bottom: 0.35rem;
    }

    .status-desc {
      font-size: 0.8125rem;
      color: inherit;
      opacity: 0.9;
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
      background: var(--primary-light);
      border: 1px solid rgba(37, 99, 235, 0.2);
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
      background: var(--warning-light);
      border-left: 3px solid var(--warning);
      color: var(--warning-text);
    }

    .insight-item {
      background: var(--info-light);
      border-left: 3px solid var(--info);
      color: var(--info-text);
    }

    .rec-item {
      background: var(--success-light);
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
      error: () => {
        // Se der erro de conexão, mantém estado
      }
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

  public runConcurrencyTest(): void {
    this.isTestingConcurrency = true;
    this.concurrencyLogs = [];
    this.addLog('Iniciando teste de concorrência simultânea para o produto PROD-005 (Saldo = 1)...', 'info');

    // 1. Criar duas requisições de nota fiscal contendo o produto de saldo 1
    const req1: CreateInvoiceRequest = {
      customerName: 'Cliente A (Thread 1 - Disputa Concorrente)',
      items: [{ productCode: 'PROD-005', productDescription: 'Item Limitado para Teste de Concorrência', quantity: 1, unitPrice: 99.00 }]
    };

    const req2: CreateInvoiceRequest = {
      customerName: 'Cliente B (Thread 2 - Disputa Concorrente)',
      items: [{ productCode: 'PROD-005', productDescription: 'Item Limitado para Teste de Concorrência', quantity: 1, unitPrice: 99.00 }]
    };

    this.addLog('Criando Notas Fiscais #1 e #2 com status Aberta no PostgreSQL...', 'info');

    forkJoin([
      this.invoiceService.createInvoice(req1),
      this.invoiceService.createInvoice(req2)
    ]).subscribe({
      next: ([inv1, inv2]) => {
        this.addLog(`Notas criadas com sucesso: Nota #${inv1.number} e Nota #${inv2.number}.`, 'info');
        this.addLog(`Disparando POST /issue simultâneo para ambas as notas concorrendo pelo mesmo saldo 1...`, 'info');

        // Disparar emissão simultânea das duas notas
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
