import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { AppHttpError } from '../../domain/errors/app-http-error';
import { ErrorResponse } from '../../domain/models/contracts';

function fallbackErrorCodeByStatus(status: number): string {
  switch (status) {
    case 401:
      return 'authentication_error';
    case 400:
      return 'domain_error';
    case 404:
      return 'not_found';
    case 409:
      return 'domain_conflict';
    case 422:
      return 'request_validation_error';
    case 500:
      return 'internal_server_error';
    default:
      return 'unknown_error';
  }
}

function readErrorPayload(error: HttpErrorResponse): Partial<ErrorResponse> {
  if (typeof error.error !== 'object' || error.error === null) {
    return {};
  }

  return error.error as Partial<ErrorResponse>;
}

export function mapBackendError(error: HttpErrorResponse): AppHttpError {
  const payload = readErrorPayload(error);
  const payloadDetails = Array.isArray(payload.details)
    ? payload.details.filter((detail): detail is string => typeof detail === 'string')
    : [];

  return {
    status: error.status,
    errorCode: payload.error_code ?? fallbackErrorCodeByStatus(error.status),
    message:
      payload.message ??
      (error.status === 0 ? 'No se pudo conectar con el backend' : 'Error inesperado del servidor'),
    details: payloadDetails
  };
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const mappedError = mapBackendError(error);
      return throwError(() => mappedError);
    })
  );
};
