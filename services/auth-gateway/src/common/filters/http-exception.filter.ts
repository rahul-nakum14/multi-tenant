import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Inject,
    Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const SENSITIVE_FIELDS = new Set([
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'authorization',
    'cookie',
    'set-cookie',
]);

function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(headers)) {
        result[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : value;
    }
    return result;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(
        @Optional()
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
    ) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const isClientError = status >= 400 && status < 500;
        const isServerError = status >= 500;

        const requestContext = {
            requestId: req.requestId ?? req.headers['x-request-id'],
            tenantId: req.tenantId,
            method: req.method,
            path: req.path,
            statusCode: status,
        };

        if (isServerError && this.logger) {
            this.logger.error('Unhandled server error', {
                ...requestContext,
                error: {
                    name: exception instanceof Error ? exception.name : 'UnknownError',
                    message: exception instanceof Error ? exception.message : String(exception),
                    stack: exception instanceof Error ? exception.stack : undefined,
                },
            });
        } else if (isClientError && this.logger) {
            this.logger.warn('Client error', {
                ...requestContext,
                message:
                    exception instanceof HttpException
                        ? this.extractMessage(exception)
                        : 'Bad request',
            });
        }

        const body: Record<string, unknown> = {
            error: {
                code: this.resolveCode(exception, status),
                message: isServerError
                    ? 'An unexpected error occurred'
                    : this.extractMessage(exception),
                statusCode: status,
                requestId: requestContext.requestId,
                timestamp: new Date().toISOString(),
            },
        };

        if (!res.headersSent) {
            res.status(status).json(body);
        }
    }

    private extractMessage(exception: unknown): string {
        if (!(exception instanceof HttpException)) return 'An error occurred';
        const resp = exception.getResponse();
        if (typeof resp === 'string') return resp;
        if (typeof resp === 'object' && resp !== null) {
            const r = resp as Record<string, unknown>;
            if (Array.isArray(r['message'])) return (r['message'] as string[]).join('; ');
            if (typeof r['message'] === 'string') return r['message'];
        }
        return exception.message;
    }

    private resolveCode(exception: unknown, status: number): string {
        if (status === 401) return 'UNAUTHORIZED';
        if (status === 403) return 'FORBIDDEN';
        if (status === 404) return 'NOT_FOUND';
        if (status === 409) return 'CONFLICT';
        if (status === 422) return 'UNPROCESSABLE';
        if (status === 400) return 'BAD_REQUEST';
        if (status >= 500) return 'INTERNAL_ERROR';
        return 'ERROR';
    }
}
