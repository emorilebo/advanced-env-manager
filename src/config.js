const Joi = require("joi");

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").required(),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
}).unknown(); 

module.exports = { envSchema };
