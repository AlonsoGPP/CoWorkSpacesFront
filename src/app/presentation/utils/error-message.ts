import { isAppHttpError } from '../../domain/errors/app-http-error';

export function toErrorMessage(error: unknown): string {
  if (isAppHttpError(error)) {
    const details = error.details.length > 0 ? ` (${error.details.join(' | ')})` : '';
    return `${error.message}${details}`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Ocurrio un error inesperado';
}
