import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
    configService: ConfigService,
): DataSourceOptions => ({
    type: 'postgres',
    url: configService.get<string>('app.database.url'),
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    synchronize: false,
    logging: configService.get<boolean>('app.database.logging'),
    ssl:
        configService.get<string>('app.nodeEnv') === 'production'
            ? { rejectUnauthorized: false }
            : false,
});

export const dataSourceFactory = async (
    configService: ConfigService,
): Promise<DataSource> => {
    const dataSource = new DataSource(getDatabaseConfig(configService));
    await dataSource.initialize();
    return dataSource;
};
