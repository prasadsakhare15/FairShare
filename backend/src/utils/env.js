/**
 * Validate required environment variables on startup.
 * Call this before starting the server.
 */
const required = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const optional = {
  PORT: 3001,
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  NODE_ENV: 'development',
  CORS_ORIGIN: '*',
};

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Check .env or .env.example.`
    );
  }
  // Apply defaults for optional
  for (const [key, defaultValue] of Object.entries(optional)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = String(defaultValue);
    }
  }
}

export const isProduction = () => process.env.NODE_ENV === 'production';
