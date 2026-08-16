export enum InvoiceStatus {
  Aberta = 1,
  Fechada = 2
}

export interface InvoiceItem {
  id: string;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  number: number;
  issueDate: string;
  status: InvoiceStatus;
  statusDescription: string;
  customerName: string;
  customerDocument: string;
  totalAmount: number;
  issuedAt?: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface CreateInvoiceItemRequest {
  productCode: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceRequest {
  customerName: string;
  customerDocument?: string;
  items: CreateInvoiceItemRequest[];
}

export interface IssueInvoiceResponse {
  success: boolean;
  message: string;
  invoice: Invoice;
}

export interface AiAuditReport {
  summary: string;
  fiscalAlerts: string[];
  inventoryInsights: string[];
  recommendations: string[];
  analyzedAt: string;
}
