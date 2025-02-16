const Joi = require("joi");

function validateEnv(envConfig, schema) {
  const { error, value } = schema.validate(envConfig, { allowUnknown: true });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}

module.exports = { validateEnv };
