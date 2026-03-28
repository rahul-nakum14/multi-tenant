import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { API_PREFIX, API_VERSION } from './common/constants';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const nestLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const winstonLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);

  app.useLogger(nestLogger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port')!;

  app.use(cookieParser());

  app.setGlobalPrefix(API_PREFIX);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
  app.useGlobalInterceptors(new LoggingInterceptor(winstonLogger));

  app.enableCors({
    origin:
      configService.get<string>('app.nodeEnv') === 'production'
        ? ['https://app.example.com']
        : true,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Auth Gateway API')
    .setDescription('Multi-tenant SaaS Authentication & Authorization Gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('tenants', 'Tenant/Organization management')
    .addTag('health', 'Health check endpoints')
    .build();

  SwaggerModule.setup(
    `${API_PREFIX}/docs`,
    app,
    SwaggerModule.createDocument(app, config),
  );

  app.enableShutdownHooks();

  await app.listen(port);

  winstonLogger.info('Service started', {
    port,
    env: configService.get<string>('app.nodeEnv'),
    prefix: API_PREFIX,
    version: API_VERSION,
    docs: `http://localhost:${port}/${API_PREFIX}/docs`,
  });

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, async () => {
      winstonLogger.info(`Received ${signal}, shutting down gracefully`);
      await app.close();
      winstonLogger.info('Server closed');
      process.exit(0);
    });
  }
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
