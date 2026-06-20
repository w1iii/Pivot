const required = [
  'JWT_SECRET',
  'DATABASE_URL',
  'ALPHA_VANTAGE_KEY',
  'GROQ_API_KEY',
] as const;

const optional = ['REDIS_URL'];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
      'Copy .env.example to .env and fill in values.'
    );
  }
}
