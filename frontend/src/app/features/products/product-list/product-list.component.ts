import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
        <p>Gerencie o catálogo de produtos, monitore saldos e cadastre novos itens.</p>
      </div>

      <button type="button" class="btn btn-primary" (click)="openCreateModal()">
        <span>+ Novo Produto</span>
      </button>
    </div>

    <!-- Filtros e Busca Reativa com RxJS -->
    <div class="card mb-4" style="margin-bottom: 1.5rem;">
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar por código (SKU) ou descrição (RxJS debounceTime)..."
            [formControl]="searchControl"
          />
          @if (searchControl.value) {
            <button type="button" class="search-clear" (click)="clearSearch()">✕</button>
          }
        </div>
      </div>
    </div>

    <!-- Tabela de Produtos -->
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Código (SKU)</th>
            <th>Descrição</th>
            <th>Preço Unitário</th>
            <th>Saldo em Estoque</th>
            <th>Status do Saldo</th>
            <th>Cadastrado em</th>
          </tr>
        </thead>
        <tbody>
          @for (product of products; track product.id) {
            <tr>
              <td>
                <strong class="sku-tag">{{ product.code }}</strong>
              </td>
              <td>{{ product.description }}</td>
              <td>{{ product.unitPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <span class="stock-value" [ngClass]="{'stock-zero': product.stockQuantity === 0}">
                  {{ product.stockQuantity | number:'1.0-2' }} un
                </span>
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
              <td>{{ product.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="text-center py-5">
                <div class="empty-state">
                  <span class="empty-icon">📦</span>
                  <h4>Nenhum produto encontrado</h4>
                  <p>Cadastre um novo produto ou ajuste os termos de busca.</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Modal de Cadastro -->
    @if (isModalOpen) {
      <app-product-modal
        (close)="isModalOpen = false"
        (saved)="loadProducts()"
      ></app-product-modal>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.75rem;
      padding-right: 2.5rem;
      height: 46px;
      font-size: 0.9375rem;
    }

    .search-clear {
      position: absolute;
      right: 1rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.875rem;
    }

    .sku-tag {
      font-family: monospace;
      font-size: 0.875rem;
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--primary-dark);
    }

    .stock-value {
      font-weight: 700;
      font-size: 0.9375rem;
    }

    .stock-zero {
      color: var(--danger);
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
export class ProductListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();

  public products: Product[] = [];
  public isModalOpen = false;
  public searchControl = new FormControl('');

  // Angular Lifecycle Hook: OnInit
  public ngOnInit(): void {
    this.loadProducts();

    // RxJS: Busca reativa com debounceTime e distinctUntilChanged
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.loadProducts(query || '');
      });

    // Assinar ao BehaviorSubject de produtos para atualizações em tempo real
    this.productService.products$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.products = items;
      });
  }

  // Angular Lifecycle Hook: OnDestroy (libera inscrições de memória)
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadProducts(search: string = ''): void {
    this.productService.getProducts(search).subscribe();
  }

  public clearSearch(): void {
    this.searchControl.setValue('');
  }

  public openCreateModal(): void {
    this.isModalOpen = true;
  }
}
