import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HealthCheckResult,
    HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../infra/database/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    @Get()
    liveness(): { status: string } {
        return { status: 'ok' };
    }

    @Get('ready')
    @HealthCheck()
    readiness(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.checkDatabase(),
            () => this.checkRedis(),
        ]);
    }

    private async checkDatabase(): Promise<HealthIndicatorResult> {
        const isUp = await this.prisma.healthCheck();
        if (!isUp) throw new Error('Database unreachable');
        return { database: { status: 'up' } };
    }

    private async checkRedis(): Promise<HealthIndicatorResult> {
        const isUp = await this.redis.healthCheck();
        if (!isUp) throw new Error('Redis unreachable');
        return { redis: { status: 'up' } };
    }
}
