import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Não bloquear para chamadas de status em background se houver
  if (!req.headers.has('X-Silent-Request')) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!req.headers.has('X-Silent-Request')) {
        loadingService.hide();
      }
    })
  );
};
