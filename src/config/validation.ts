import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(5001),
  CORS_ORIGINS: Joi.string().default('http://localhost:5000'),
  COOKIE_DOMAIN: Joi.string().optional(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
