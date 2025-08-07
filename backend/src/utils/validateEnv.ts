/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing
 */
export const validateEnv = (): void => {
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_SECRET',
    'REFRESH_TOKEN_EXPIRES_IN',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'FRONTEND_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  console.log('✅ Environment variables validated');
};