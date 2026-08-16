import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiAuditReport } from '../models/invoice.model';

export interface FaultToggleResponse {
  isFaultActive: boolean;
  message: string;
}

export interface FaultStatusResponse {
  isFaultActive: boolean;
  statusCode: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private http = inject(HttpClient);
  private stockUrl = `${environment.stockApiUrl}/products`;
  private billingUrl = `${environment.billingApiUrl}/invoices`;

  public toggleStockFault(enable: boolean, statusCode: number = 503, message?: string): Observable<FaultToggleResponse> {
    return this.http.post<FaultToggleResponse>(`${this.stockUrl}/fault-toggle`, {
      enable,
      statusCode,
      message
    });
  }

  public getStockFaultStatus(): Observable<FaultStatusResponse> {
    return this.http.get<FaultStatusResponse>(`${this.stockUrl}/fault-status`);
  }

  public getAiAuditReport(): Observable<AiAuditReport> {
    return this.http.get<AiAuditReport>(`${this.billingUrl}/ai-audit`);
  }

  public resetDatabases(): Observable<[any, any]> {
    return forkJoin([
      this.http.post(`${this.stockUrl}/reset-seed`, {}),
      this.http.post(`${this.billingUrl}/reset-seed`, {})
    ]);
  }
}
