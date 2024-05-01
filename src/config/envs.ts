import * as joi from 'joi';
import 'dotenv/config';

interface EnvVars {
  PORT: number,
  NATS_SERVERS: string,
  JWT_SECRET: string,
}

const envsSchema = joi.object({
  PORT: joi.number().required(),
  NATS_SERVERS: joi.string().required(),
  JWT_SECRET: joi.string().required(),
}).unknown(true)

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Configuration error: ${ error.message } `);
}

const envVars: EnvVars = value;

export const envs = {
  PORT: envVars.PORT,
  NATS_SERVERS: envVars.NATS_SERVERS,
  JWT_SECRET: envVars.JWT_SECRET,
}