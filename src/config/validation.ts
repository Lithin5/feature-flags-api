import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(5001),
  CORS_ORIGINS: Joi.string().default('http://localhost:5000'),
});
