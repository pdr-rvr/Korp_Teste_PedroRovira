import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { documentValidator } from '../../../core/validators/document.validator';
import { CpfCnpjMaskDirective } from '../../../shared/directives/cpf-cnpj-mask.directive';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CpfCnpjMaskDirective],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/notas-fiscais" class="back-link">← Voltar para Faturamento</a>
        <h1>Nova Nota Fiscal de Venda</h1>
        <p>Preencha os dados do cliente e selecione múltiplos produtos do estoque com validações em tempo real.</p>
      </div>
    </div>

    <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
      <!-- 1. Dados do Destinatário -->
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
              <div class="form-error">O nome do cliente é obrigatório (máx 150 caracteres).</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="customerDocument">CNPJ ou CPF (com validação)</label>
            <input
              id="customerDocument"
              type="text"
              class="form-control"
              placeholder="00.000.000/0000-00 ou 000.000.000-00"
              formControlName="customerDocument"
              appCpfCnpjMask
            />
            @if (isFieldInvalid('customerDocument')) {
              <div class="form-error">
                @if (invoiceForm.get('customerDocument')?.errors?.['invalidCpf']) {
                  CPF informado possui dígito verificador inválido.
                } @else if (invoiceForm.get('customerDocument')?.errors?.['invalidCnpj']) {
                  CNPJ informado possui dígito verificador inválido.
                } @else {
                  Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 2. Itens da Nota Fiscal -->
      <div class="card mb-4" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h3>2. Produtos & Itens da Nota</h3>
            <p style="font-size: 0.8125rem;">O preço unitário é fixado conforme o catálogo de estoque. Não é permitida adulteração manual.</p>
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem;">
                  <label class="form-label" style="margin-bottom: 0;">Produto do Catálogo *</label>
                  @if (getSelectedProduct(i); as prod) {
                    <span class="stock-badge" [ngClass]="prod.stockQuantity > 0 ? 'stock-ok' : 'stock-zero'">
                      Saldo disponível: {{ prod.stockQuantity }} un
                    </span>
                  }
                </div>

                <select class="form-control" formControlName="productCode" (change)="onProductSelect(i)">
                  <option value="">Selecione um produto...</option>
                  @for (prod of availableProducts; track prod.id) {
                    <option
                      [value]="prod.code"
                      [disabled]="prod.stockQuantity <= 0 || isProductAlreadySelectedInOtherRow(prod.code, i)"
                    >
                      {{ prod.code }} - {{ prod.description }}
                      @if (prod.stockQuantity <= 0) {
                        (Esgotado - Saldo 0)
                      } @else if (isProductAlreadySelectedInOtherRow(prod.code, i)) {
                        (Já selecionado na nota)
                      } @else {
                        (Saldo: {{ prod.stockQuantity }} un | {{ prod.unitPrice | currency:'BRL' }})
                      }
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
                  (keydown)="onlyPositiveIntegers($event)"
                  (input)="onQuantityChange(i)"
                />
              </div>

              <!-- Preço Unitário Oficial Travado (Somente Leitura) -->
              <div class="item-price-col">
                <label class="form-label">Preço Unit. (Oficial)</label>
                <div class="price-display-box">
                  <span class="price-value">{{ getItemUnitPrice(i) | currency:'BRL':'symbol':'1.2-2' }}</span>
                  <span class="lock-tag" title="Preço unitário fixado pelo catálogo oficial de produtos">🔒 Tabela</span>
                </div>
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

            <!-- Alerta de Saldo Insuficiente por Linha -->
            @if (isQuantityExceeded(i)) {
              <div class="stock-warning-alert">
                ⚠️ Atenção: A quantidade informada ({{ getQuantityValue(i) }}) é maior que o saldo disponível em estoque ({{ getMaxStockValue(i) }} un).
              </div>
            }
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
        <button
          type="submit"
          class="btn btn-primary btn-lg"
          [disabled]="invoiceForm.invalid || hasAnyStockExceeded() || isSubmitting"
        >
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
      grid-template-columns: 40px 3.2fr 1fr 1.3fr 1.2fr 48px;
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

    .stock-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .stock-ok {
      background: var(--success-light);
      color: var(--success-text);
    }

    .stock-zero {
      background: var(--danger-light);
      color: var(--danger-text);
    }

    .stock-warning-alert {
      background: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger-text);
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      margin-top: -0.5rem;
    }

    .price-display-box {
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      background: #e2e8f0;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .price-value {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .lock-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      background: rgba(0, 0, 0, 0.05);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
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
    customerDocument: ['', [documentValidator()]],
    items: this.fb.array([])
  });

  public get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  public ngOnInit(): void {
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
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      maxStock: [0]
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
        unitPrice: product.unitPrice,
        maxStock: product.stockQuantity
      });

      // Se quantidade atual for maior que o saldo, ajusta para o saldo
      const qty = itemGroup.get('quantity')?.value || 1;
      if (qty > product.stockQuantity && product.stockQuantity > 0) {
        itemGroup.patchValue({ quantity: product.stockQuantity });
      }

      this.calculateTotals();
    }
  }

  public onlyPositiveIntegers(event: KeyboardEvent): void {
    // Bloquear teclas -, +, e, ., ,
    if (['-', '+', 'e', 'E', '.', ','].includes(event.key)) {
      event.preventDefault();
    }
  }

  public onQuantityChange(index: number): void {
    const itemGroup = this.items.at(index);
    if (itemGroup) {
      let qty = Number(itemGroup.get('quantity')?.value || 1);
      if (qty < 1) {
        itemGroup.patchValue({ quantity: 1 }, { emitEvent: false });
      } else {
        itemGroup.patchValue({ quantity: Math.floor(qty) }, { emitEvent: false });
      }
    }
    this.calculateTotals();
  }

  public getSelectedProduct(index: number): Product | undefined {
    const itemGroup = this.items.at(index);
    if (!itemGroup) return undefined;
    const code = itemGroup.get('productCode')?.value;
    return this.availableProducts.find(p => p.code === code);
  }

  public getItemUnitPrice(index: number): number {
    const prod = this.getSelectedProduct(index);
    if (prod) return prod.unitPrice;
    return Number(this.items.at(index)?.get('unitPrice')?.value || 0);
  }

  public isProductAlreadySelectedInOtherRow(productCode: string, currentRowIndex: number): boolean {
    for (let i = 0; i < this.items.length; i++) {
      if (i !== currentRowIndex) {
        const itemCode = this.items.at(i).get('productCode')?.value;
        if (itemCode === productCode) {
          return true;
        }
      }
    }
    return false;
  }

  public isQuantityExceeded(index: number): boolean {
    const itemGroup = this.items.at(index);
    if (!itemGroup) return false;
    const code = itemGroup.get('productCode')?.value;
    if (!code) return false;

    const prod = this.availableProducts.find(p => p.code === code);
    if (!prod) return false;

    const qty = Number(itemGroup.get('quantity')?.value || 0);
    return qty > prod.stockQuantity;
  }

  public getQuantityValue(index: number): number {
    return Number(this.items.at(index)?.get('quantity')?.value || 0);
  }

  public getMaxStockValue(index: number): number {
    const code = this.items.at(index)?.get('productCode')?.value;
    const prod = this.availableProducts.find(p => p.code === code);
    return prod ? prod.stockQuantity : 0;
  }

  public hasAnyStockExceeded(): boolean {
    for (let i = 0; i < this.items.length; i++) {
      if (this.isQuantityExceeded(i)) return true;
    }
    return false;
  }

  public getItemSubtotal(index: number): number {
    const itemGroup = this.items.at(index);
    if (!itemGroup) return 0;
    const qty = Number(itemGroup.get('quantity')?.value || 0);
    const price = this.getItemUnitPrice(index);
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
    if (this.invoiceForm.invalid || this.hasAnyStockExceeded()) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const val = this.invoiceForm.value;

    this.invoiceService.createInvoice({
      customerName: val.customerName.trim(),
      customerDocument: val.customerDocument ? val.customerDocument.trim() : undefined,
      items: val.items.map((i: any, index: number) => ({
        productCode: i.productCode,
        productDescription: i.productDescription,
        quantity: Number(i.quantity),
        unitPrice: this.getItemUnitPrice(index)
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
