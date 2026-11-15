import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { ErrorCode, ErrorResponse } from "@mystery-game/contracts";
import { AppError, errorStatus } from "./app-error.js";

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/** Every non-2xx HTTP response body is `{ code: ErrorCode }`. */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== "http") return;
    const res = host.switchToHttp().getResponse<JsonResponse>();
    const { status, code } = this.toError(exception);
    const body: ErrorResponse = { code };
    res.status(status).json(body);
  }

  private toError(exception: unknown): { status: number; code: ErrorCode } {
    if (exception instanceof AppError) {
      return { status: errorStatus[exception.code], code: exception.code };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // e.g. malformed JSON body (400) or unknown route (404)
      if (status === 400) return { status, code: "INVALID_PAYLOAD" };
      if (status === 401) return { status, code: "UNAUTHORIZED" };
      if (status < 500) return { status, code: "INVALID_PAYLOAD" };
    }
    this.logger.error(exception);
    return { status: 500, code: "INTERNAL" };
  }
}
