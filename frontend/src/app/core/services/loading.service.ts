import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _isLoading = signal<boolean>(false);
  private _activeRequests = signal<number>(0);

  public isLoading = this._isLoading.asReadonly();

  public show(): void {
    this._activeRequests.update(count => count + 1);
    this._isLoading.set(true);
  }

  public hide(): void {
    this._activeRequests.update(count => {
      const next = Math.max(0, count - 1);
      if (next === 0) {
        this._isLoading.set(false);
      }
      return next;
    });
  }
}
