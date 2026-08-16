import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/notas-fiscais" class="back-link">← Voltar para Faturamento</a>
        <h1>Nova Nota Fiscal de Venda</h1>
        <p>Preencha os dados do cliente e selecione múltiplos produtos do estoque.</p>
      </div>
    </div>

    <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
      <!-- Dados do Destinatário -->
      <div class="card mb-4" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <h3>1. Dados do Destinatário / Cliente</h3>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem;">
          <div class="form-group">
            <label class="form-label" for="customerName">Razão Social / Nome do Cliente *</label>
            <input
              id="customerName"
              type="text"
              class="form-control"
              placeholder="Ex: Tech Corp Soluções Empresariais Ltda"
              formControlName="customerName"
            />
            @if (isFieldInvalid('customerName')) {
              <div class="form-error">O nome do cliente é obrigatório.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="customerDocument">CNPJ / CPF</label>
            <input
              id="customerDocument"
              type="text"
              class="form-control"
              placeholder="Ex: 00.000.000/0001-00"
              formControlName="customerDocument"
            />
          </div>
        </div>
      </div>

      <!-- Itens da Nota Fiscal -->
      <div class="card mb-4" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h3>2. Produtos & Itens da Nota</h3>
            <p style="font-size: 0.8125rem;">Selecione os produtos disponíveis no estoque e informe as quantidades.</p>
          </div>

          <button type="button" class="btn btn-outline btn-sm" (click)="addItem()">
            <span>+ Adicionar Outro Produto</span>
          </button>
        </div>

        <div formArrayName="items" class="items-list">
          @for (item of items.controls; track $index; let i = $index) {
            <div [formGroupName]="i" class="item-row">
              <div class="item-index">#{{ i + 1 }}</div>

              <div class="item-select-col">
                <label class="form-label">Produto *</label>
                <select class="form-control" formControlName="productCode" (change)="onProductSelect(i)">
                  <option value="">Selecione um produto...</option>
                  @for (prod of availableProducts; track prod.id) {
                    <option [value]="prod.code">
                      {{ prod.code }} - {{ prod.description }} (Saldo: {{ prod.stockQuantity }} un | {{ prod.unitPrice | currency:'BRL' }})
                    </option>
                  }
                </select>
              </div>

              <div class="item-qty-col">
                <label class="form-label">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  class="form-control"
                  placeholder="1"
                  formControlName="quantity"
                  (input)="calculateTotals()"
                />
              </div>

              <div class="item-price-col">
                <label class="form-label">Preço Unit. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  formControlName="unitPrice"
                  (input)="calculateTotals()"
                />
              </div>

              <div class="item-subtotal-col">
                <label class="form-label">Subtotal</label>
                <div class="subtotal-display">
                  {{ getItemSubtotal(i) | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>

              <div class="item-action-col">
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  [disabled]="items.length === 1"
                  (click)="removeItem(i)"
                  title="Remover item"
                >
                  ✕
                </button>
              </div>
            </div>
          }
        </div>

        <div class="total-summary">
          <div class="total-label">Total Geral da Nota Fiscal:</div>
          <div class="total-value-highlight">
            {{ totalAmount | currency:'BRL':'symbol':'1.2-2' }}
          </div>
        </div>
      </div>

      <!-- Ações do Formulário -->
      <div class="form-actions">
        <a routerLink="/notas-fiscais" class="btn btn-secondary">Cancelar</a>
        <button type="submit" class="btn btn-primary btn-lg" [disabled]="invoiceForm.invalid || isSubmitting">
          @if (isSubmitting) {
            <span class="spinner"></span> Gravando Nota...
          } @else {
            Salvar Nota Fiscal (Status: Aberta)
          }
        </button>
      </div>
    </form>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.75rem;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 0.5rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .item-row {
      display: grid;
      grid-template-columns: 40px 3fr 1fr 1fr 1.2fr 48px;
      gap: 0.75rem;
      align-items: flex-end;
      padding: 1rem;
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .item-index {
      font-weight: 700;
      color: var(--text-muted);
      padding-bottom: 0.75rem;
      text-align: center;
    }

    .subtotal-display {
      height: 38px;
      display: flex;
      align-items: center;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .total-summary {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1.5rem;
      padding: 1.25rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
    }

    .total-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .total-value-highlight {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-dark);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  `]
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  public availableProducts: Product[] = [];
  public isSubmitting = false;
  public totalAmount = 0;

  public invoiceForm: FormGroup = this.fb.group({
    customerName: ['', [Validators.required, Validators.maxLength(150)]],
    customerDocument: [''],
    items: this.fb.array([])
  });

  public get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  public ngOnInit(): void {
    // Carregar produtos do estoque para preencher a seleção
    this.productService.getProducts('', 1, 100).subscribe(result => {
      this.availableProducts = result.items;
      if (this.items.length === 0) {
        this.addItem();
      }
    });
  }

  public createItemFormGroup(): FormGroup {
    return this.fb.group({
      productCode: ['', Validators.required],
      productDescription: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  public addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  public removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotals();
    }
  }

  public onProductSelect(index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    const selectedCode = itemGroup.get('productCode')?.value;
    const product = this.availableProducts.find(p => p.code === selectedCode);

    if (product) {
      itemGroup.patchValue({
        productDescription: product.description,
        unitPrice: product.unitPrice
      });
      this.calculateTotals();
    }
  }

  public getItemSubtotal(index: number): number {
    const itemGroup = this.items.at(index);
    if (!itemGroup) return 0;
    const qty = Number(itemGroup.get('quantity')?.value || 0);
    const price = Number(itemGroup.get('unitPrice')?.value || 0);
    return qty * price;
  }

  public calculateTotals(): void {
    let sum = 0;
    for (let i = 0; i < this.items.length; i++) {
      sum += this.getItemSubtotal(i);
    }
    this.totalAmount = sum;
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  public onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const val = this.invoiceForm.value;

    this.invoiceService.createInvoice({
      customerName: val.customerName,
      customerDocument: val.customerDocument,
      items: val.items.map((i: any) => ({
        productCode: i.productCode,
        productDescription: i.productDescription,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice)
      }))
    }).subscribe({
      next: (invoice) => {
        this.notificationService.success(`Nota Fiscal Nº ${invoice.number} criada com sucesso (Status: Aberta).`);
        this.isSubmitting = false;
        this.router.navigate(['/notas-fiscais', invoice.id]);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
