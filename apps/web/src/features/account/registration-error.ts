import { ApiClientError } from "../../api/client";

export interface RegistrationErrorDetails {
  code: string;
  requestId?: string;
}

export function registrationErrorDetails(error: unknown): RegistrationErrorDetails {
  if (error instanceof ApiClientError) {
    return error.requestId
      ? { code: error.code, requestId: error.requestId }
      : { code: error.code };
  }
  return { code: "INTERNAL_ERROR" };
}
