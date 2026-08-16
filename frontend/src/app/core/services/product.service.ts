import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api-response.model';
import { CreateProductRequest, DeductStockRequest, DeductStockResponse, Product, UpdateProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.stockApiUrl}/products`;

  // Estado reativo com RxJS BehaviorSubject
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private paginationSubject = new BehaviorSubject<PagedResult<Product> | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  public getProducts(search: string = '', page: number = 1, pageSize: number = 10): Observable<PagedResult<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResult<Product>>(this.apiUrl, { params }).pipe(
      tap(result => {
        this.productsSubject.next(result.items);
        this.paginationSubject.next(result);
      })
    );
  }

  public getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  public getProductByCode(code: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/by-code/${encodeURIComponent(code)}`);
  }

  public createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, request).pipe(
      tap(() => this.getProducts().subscribe())
    );
  }

  public updateProduct(id: string, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => this.getProducts().subscribe())
    );
  }

  public deductStock(request: DeductStockRequest): Observable<DeductStockResponse> {
    return this.http.post<DeductStockResponse>(`${this.apiUrl}/deduct`, request).pipe(
      tap(() => this.getProducts().subscribe())
    );
  }
}
