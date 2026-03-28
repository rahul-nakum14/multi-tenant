import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
    Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(
        @Optional()
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request>();
        const { method, path } = req;
        const startMs = Date.now();

        if (this.logger) {
            this.logger.info('Incoming request', {
                requestId: req.requestId,
                tenantId: req.tenantId,
                method,
                path,
            });
        }

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = context.switchToHttp().getResponse<Response>();
                    const durationMs = Date.now() - startMs;

                    if (this.logger) {
                        this.logger.info('Request completed', {
                            requestId: req.requestId,
                            tenantId: req.tenantId,
                            method,
                            path,
                            statusCode: res.statusCode,
                            durationMs,
                        });
                    }
                },
                error: () => {
                    const durationMs = Date.now() - startMs;

                    if (this.logger) {
                        this.logger.info('Request failed', {
                            requestId: req.requestId,
                            tenantId: req.tenantId,
                            method,
                            path,
                            durationMs,
                        });
                    }
                },
            }),
        );
    }
}
