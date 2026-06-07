export interface AppHttpError {
  status: number;
  errorCode: string;
  message: string;
  details: string[];
}

export function isAppHttpError(value: unknown): value is AppHttpError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AppHttpError>;
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.errorCode === 'string' &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.details)
  );
}
