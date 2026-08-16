import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado ao se comunicar com o servidor.';
      let errorTitle = 'Erro no Sistema';

      if (error.error && typeof error.error === 'object') {
        const problem = error.error;
        if (problem.detail) {
          errorMessage = problem.detail;
        } else if (problem.title) {
          errorMessage = problem.title;
        } else if (problem.message) {
          errorMessage = problem.message;
        }

        if (problem.errors && typeof problem.errors === 'object') {
          const fieldErrors = Object.entries(problem.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join(' | ');
          if (fieldErrors) {
            errorMessage += ` Detalhes: ${fieldErrors}`;
          }
        }
      } else if (typeof error.error === 'string' && error.error.trim().length > 0) {
        errorMessage = error.error;
      }

      switch (error.status) {
        case 0:
          errorTitle = 'Serviço Indisponível (Conexão Recusada)';
          errorMessage = 'Não foi possível estabelecer conexão com o microsserviço. Verifique se os contêineres Docker ou serviços locais estão ativos.';
          notificationService.error(errorMessage, errorTitle);
          break;

        case 400:
          errorTitle = 'Requisição Inválida';
          notificationService.warning(errorMessage, errorTitle);
          break;

        case 404:
          errorTitle = 'Recurso Não Encontrado';
          notificationService.warning(errorMessage, errorTitle);
          break;

        case 409:
          errorTitle = 'Conflito de Saldo / Concorrência';
          notificationService.error(errorMessage, errorTitle);
          break;

        case 503:
          errorTitle = 'Falha de Resiliência no Microsserviço';
          errorMessage = errorMessage || 'O microsserviço está temporariamente indisponível (Simulação de Falha ou Queda).';
          notificationService.error(errorMessage, errorTitle);
          break;

        case 500:
        default:
          errorTitle = `Erro no Servidor (HTTP ${error.status})`;
          notificationService.error(errorMessage, errorTitle);
          break;
      }

      return throwError(() => error);
    })
  );
};
