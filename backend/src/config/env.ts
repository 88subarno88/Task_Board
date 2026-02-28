import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  corsOrigin: string;
}

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`ERROR: Environment variable ${key} is missing. Please check  .env file!`);
  }
  return value;
};

export const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000, //default Port:3000
  nodeEnv: getEnv('NODE_ENV', 'development'),
  databaseUrl: getEnv('DATABASE_URL'), //required for Prisma connection

  // JWT secrets for the authentication requirement
  jwtAccessSecret: getEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Frontend Vite URL
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
};

export default config;
