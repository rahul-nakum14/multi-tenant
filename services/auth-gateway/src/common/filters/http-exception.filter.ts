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

const SENSITIVE_HEADERS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
]);

function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [
            key,
            SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value,
        ]),
    );
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
            headers: sanitizeHeaders(req.headers as Record<string, unknown>),
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
                code: this.resolveCode(status),
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

    private resolveCode(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE',
        };
        return codes[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
    }
}
