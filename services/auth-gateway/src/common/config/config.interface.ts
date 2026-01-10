export interface DatabaseConfig {
    url: string;
    logging: boolean;
}

export interface RedisConfig {
    url: string;
}

export interface JwtConfig {
    secret: string;
    expiry: string;
    refreshExpiry: string;
}

export interface AppConfig {
    nodeEnv: string;
    port: number;
    database: DatabaseConfig;
    redis: RedisConfig;
    jwt: JwtConfig;
}
