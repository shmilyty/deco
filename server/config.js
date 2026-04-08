require('dotenv').config();

const IS_DEV = process.env.NODE_ENV !== 'production';

function parseBooleanEnv(value, defaultValue) {
  if (value == null || value === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
}

if (IS_DEV) {
  if (!process.env.SECRET_KEY) {
    process.env.SECRET_KEY = 'dev-only-secret-key';
    console.warn('⚠️  SECRET_KEY not set, using dev default');
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-jwt-secret';
    console.warn('⚠️  JWT_SECRET not set, using dev default');
  }
} else {
  const required = [
    'SECRET_KEY',
    'JWT_SECRET',
    'LINUXDO_CLIENT_ID',
    'LINUXDO_CLIENT_SECRET',
    'LINUXDO_REDIRECT_URI',
    'TURNSTILE_SECRET_KEY',
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Please check your .env file. See .env.example for reference.');
    process.exit(1);
  }
}

// Email domain whitelist: comma-separated list of allowed domains, empty = allow all
const EMAIL_DOMAIN_WHITELIST = (process.env.EMAIL_DOMAIN_WHITELIST || '')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

const EMAIL_VERIFICATION_REQUIRED = parseBooleanEnv(
  process.env.EMAIL_VERIFICATION_REQUIRED,
  true
);

module.exports = {
  IS_DEV,
  PORT: parseInt(process.env.PORT) || 3000,
  SECRET_KEY: process.env.SECRET_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_LINUXDO_ID: parseInt(process.env.ADMIN_LINUXDO_ID) || 0,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
  LINUXDO_CLIENT_ID: process.env.LINUXDO_CLIENT_ID || '',
  LINUXDO_CLIENT_SECRET: process.env.LINUXDO_CLIENT_SECRET || '',
  LINUXDO_REDIRECT_URI: process.env.LINUXDO_REDIRECT_URI || '',
  UNLOCK_DATE: new Date(process.env.UNLOCK_DATE || '2025-12-25T00:00:00'),
  DEV_FRONTEND_URL: process.env.DEV_FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Deco My Tree <noreply@example.com>',
  SMTP_ENABLED: !!process.env.SMTP_HOST,

  EMAIL_VERIFICATION_REQUIRED,

  // Email whitelist
  EMAIL_DOMAIN_WHITELIST,
};
