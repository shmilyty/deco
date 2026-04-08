import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configSource = readFileSync(join(root, 'config.js'), 'utf8');
const authSource = readFileSync(join(root, 'routes', 'auth.js'), 'utf8');
const modalSource = readFileSync(
  join(root, '..', 'src', 'components', 'AuthModal.vue'),
  'utf8'
);

const failures = [];

if (!configSource.includes('EMAIL_VERIFICATION_REQUIRED')) {
  failures.push('config.js does not expose EMAIL_VERIFICATION_REQUIRED');
}

if (!authSource.includes('config.EMAIL_VERIFICATION_REQUIRED')) {
  failures.push('auth.js does not branch on EMAIL_VERIFICATION_REQUIRED');
}

if (!authSource.includes('res.json({ success: true, token')) {
  failures.push('signup path does not return a token for disabled verification');
}

if (!modalSource.includes('if (data.token)')) {
  failures.push('AuthModal signup flow does not handle token responses');
}

if (failures.length > 0) {
  console.error('Email verification toggle regression check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Email verification toggle regression check passed.');
