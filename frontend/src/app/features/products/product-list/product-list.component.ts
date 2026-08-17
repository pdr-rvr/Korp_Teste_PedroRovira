import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { ProductModalComponent } from '../product-modal/product-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Controle de Estoque & Produtos</h1>
        <p>Catálogo de produtos empresariais, monitoramento de saldos físicos e cadastro de novos itens.</p>
      </div>

      <button type="button" class="btn btn-primary" (click)="openCreateModal()">
        <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Novo Produto</span>
      </button>
    </div>

    <!-- Filtros e Busca Reativa com RxJS -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div class="search-bar">
        <div class="search-input-wrapper">
          <svg class="svg-icon search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar por código (SKU) ou descrição do produto..."
            [formControl]="searchControl"
          />
          @if (searchControl.value) {
            <button type="button" class="search-clear" (click)="clearSearch()">✕</button>
          }
        </div>
      </div>
    </div>

    <!-- Tabela de Produtos -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Código (SKU)</th>
              <th>Descrição do Produto</th>
              <th>Preço Unitário</th>
              <th>Saldo em Estoque</th>
              <th>Status do Saldo</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            @if (products.length === 0) {
              <tr>
                <td colspan="6" class="text-center py-5">
                  <p>Nenhum produto encontrado no catálogo de estoque.</p>
                </td>
              </tr>
            } @else {
              @for (product of products; track product.id) {
                <tr>
                  <td>
                    <strong class="sku-tag">{{ product.code }}</strong>
                  </td>
                  <td>
                    <div class="prod-desc">{{ product.description }}</div>
                  </td>
                  <td>
                    <strong class="prod-price">{{ product.unitPrice | currency:'BRL':'symbol':'1.2-2' }}</strong>
                  </td>
                  <td>
                    <span class="stock-qty">{{ product.stockQuantity | number:'1.0-2' }} un</span>
                  </td>
                  <td>
                    @if (product.stockQuantity === 0) {
                      <span class="badge badge-danger">Esgotado</span>
                    } @else if (product.stockQuantity <= 3) {
                      <span class="badge badge-warning">Estoque Baixo</span>
                    } @else {
                      <span class="badge badge-success">Disponível</span>
                    }
                  </td>
                  <td>
                    <span class="created-date">{{ product.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro de Produto -->
    @if (isCreateModalOpen) {
      <app-product-modal
        (close)="isCreateModalOpen = false"
        (saved)="loadProducts()"
      ></app-product-modal>
    }
  `,
  styles: [`
    .search-input-wrapper {
      position: relative;
      width: 100%;
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

    .sku-tag {
      font-family: monospace;
      font-size: 0.875rem;
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-xs);
      color: var(--primary-dark);
    }

    .prod-desc {
      font-weight: 600;
      color: var(--text-primary);
    }

    .prod-price {
      color: var(--text-primary);
    }

    .stock-qty {
      font-weight: 700;
      color: var(--text-primary);
    }

    .created-date {
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();

  public products: Product[] = [];
  public searchControl = new FormControl('');
  public isCreateModalOpen = false;

  public ngOnInit(): void {
    this.loadProducts();

    // Busca reativa limpa com switchMap (cancela requisições anteriores em trânsito)
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.productService.getProducts(term || '', 1, 50)),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.products = result.items;
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadProducts(): void {
    const term = this.searchControl.value || '';
    this.productService.getProducts(term, 1, 50).subscribe(result => {
      this.products = result.items;
    });
  }

  public clearSearch(): void {
    this.searchControl.setValue('');
  }

  public openCreateModal(): void {
    this.isCreateModalOpen = true;
  }
}
