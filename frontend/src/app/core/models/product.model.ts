export interface Product {
  id: string;
  code: string;
  description: string;
  stockQuantity: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  code: string;
  description: string;
  stockQuantity: number;
  unitPrice: number;
}

export interface UpdateProductRequest {
  description: string;
  stockQuantity: number;
  unitPrice: number;
}

export interface DeductStockItem {
  productCode: string;
  quantity: number;
}

export interface DeductStockRequest {
  items: DeductStockItem[];
}

export interface DeductStockResponse {
  success: boolean;
  message: string;
  updatedProducts: Product[];
}
