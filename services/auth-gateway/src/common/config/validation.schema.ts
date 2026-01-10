import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),

    DATABASE_URL: Joi.string().required(),
    DATABASE_LOGGING: Joi.boolean().default(false),

    REDIS_URL: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
});
