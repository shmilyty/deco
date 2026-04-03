const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

if (config.SMTP_ENABLED) {
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(to, token) {
  const baseUrl = config.IS_DEV ? config.DEV_FRONTEND_URL : '';
  const verifyUrl = `${baseUrl}/tree/api/auth/verify-email?token=${token}`;

  if (!transporter) {
    console.log('📧 [SMTP not configured] Verification email for', to);
    console.log('   Link:', verifyUrl);
    return;
  }

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to,
    subject: '验证你的邮箱 - Deco My Tree',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:20px;">
        <h2 style="color:#d42426;text-align:center;">🎄 Deco My Tree</h2>
        <p>你好！请点击下面的链接验证你的邮箱：</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${verifyUrl}"
             style="background:#d42426;color:white;padding:12px 30px;border-radius:50px;text-decoration:none;font-weight:bold;">
            验证邮箱
          </a>
        </p>
        <p style="color:#999;font-size:0.85rem;">链接有效期为 24 小时。如果不是你本人操作，请忽略此邮件。</p>
      </div>
    `,
  });
}

function isEmailDomainAllowed(email) {
  if (config.EMAIL_DOMAIN_WHITELIST.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && config.EMAIL_DOMAIN_WHITELIST.includes(domain);
}

module.exports = { sendVerificationEmail, isEmailDomainAllowed };
