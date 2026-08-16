import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Novo Cadastro de Produto</h3>
          <button type="button" class="btn btn-outline btn-sm" (click)="close.emit()">✕</button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="code">Código do Produto (SKU) *</label>
              <input
                id="code"
                type="text"
                class="form-control"
                placeholder="Ex: PROD-100"
                formControlName="code"
              />
              @if (isFieldInvalid('code')) {
                <div class="form-error">O código do produto é obrigatório (máx 50 caracteres).</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Descrição / Nome do Produto *</label>
              <input
                id="description"
                type="text"
                class="form-control"
                placeholder="Ex: Monitor Dell 27 4K"
                formControlName="description"
              />
              @if (isFieldInvalid('description')) {
                <div class="form-error">A descrição é obrigatória (máx 255 caracteres).</div>
              }
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label" for="stockQuantity">Saldo Inicial em Estoque *</label>
                <input
                  id="stockQuantity"
                  type="number"
                  step="1"
                  min="0"
                  class="form-control"
                  placeholder="0"
                  formControlName="stockQuantity"
                />
                @if (isFieldInvalid('stockQuantity')) {
                  <div class="form-error">O saldo deve ser maior ou igual a zero.</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="unitPrice">Preço Unitário (R$) *</label>
                <input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-control"
                  placeholder="0.00"
                  formControlName="unitPrice"
                />
                @if (isFieldInvalid('unitPrice')) {
                  <div class="form-error">O preço deve ser maior ou igual a zero.</div>
                }
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid || isSubmitting">
              @if (isSubmitting) {
                <span class="spinner"></span> Salvando...
              } @else {
                Cadastrar Produto
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);

  public isSubmitting = false;

  public productForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]]
  });

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  public onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    this.productService.createProduct({
      code: formValue.code,
      description: formValue.description,
      stockQuantity: Number(formValue.stockQuantity),
      unitPrice: Number(formValue.unitPrice)
    }).subscribe({
      next: (created) => {
        this.notificationService.success(`Produto '${created.code}' cadastrado com sucesso!`);
        this.isSubmitting = false;
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
