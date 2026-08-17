import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api-response.model';
import { CreateInvoiceRequest, Invoice, InvoiceStatus, IssueInvoiceResponse } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.billingApiUrl}/invoices`;

  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  public invoices$ = this.invoicesSubject.asObservable();

  private paginationSubject = new BehaviorSubject<PagedResult<Invoice> | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  public getInvoices(status?: InvoiceStatus, search: string = '', page: number = 1, pageSize: number = 10): Observable<PagedResult<Invoice>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResult<Invoice>>(this.apiUrl, { params }).pipe(
      tap(result => {
        this.invoicesSubject.next(result.items);
        this.paginationSubject.next(result);
      })
    );
  }

  public getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  public createInvoice(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, request);
  }

  public issueInvoice(id: string): Observable<IssueInvoiceResponse> {
    // Gerar chave UUID de idempotência para garantir proteção contra disparos duplicados
    const idempotencyKey = crypto.randomUUID();
    const headers = new HttpHeaders().set('X-Idempotency-Key', idempotencyKey);

    return this.http.post<IssueInvoiceResponse>(`${this.apiUrl}/${id}/issue`, {}, { headers });
  }
}
