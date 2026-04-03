const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const argon2 = require('argon2');
const config = require('../config');
const prisma = require('../lib/prisma');
const { requireAuth, checkTreeAccess } = require('../middleware/auth');
const { sanitizeUsername } = require('../lib/crypto');
const { sendVerificationEmail, isEmailDomainAllowed } = require('../lib/email');

// Helper: sign JWT for a user
function signJwt(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ============================
// Email + Password Auth
// ============================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: '邮箱、密码和用户名不能为空' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: '密码至少需要 8 位' });
    }
    if (!isEmailDomainAllowed(email)) {
      return res.status(400).json({ error: '不支持该邮箱域名注册' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    const passwordHash = await argon2.hash(password);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cleanName = sanitizeUsername(username);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        username: cleanName,
        emailVerified: false,
        verifyToken,
        verifyTokenExp,
      },
    });

    sendVerificationEmail(user.email, verifyToken).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    res.json({ success: true, message: '注册成功，请查收验证邮件' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/email-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: '请先验证邮箱', needVerify: true });
    }

    const token = signJwt(user);
    res.json({ success: true, token });
  } catch (err) {
    console.error('Email login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const frontendBase = config.IS_DEV ? config.DEV_FRONTEND_URL : '';

  if (!token) {
    return res.redirect(`${frontendBase}/tree/?auth_error=missing_token`);
  }

  try {
    const user = await prisma.user.findUnique({ where: { verifyToken: token } });

    if (!user) {
      return res.redirect(`${frontendBase}/tree/?auth_error=invalid_token`);
    }
    if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
      return res.redirect(`${frontendBase}/tree/?auth_error=token_expired`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
    });

    const jwtToken = signJwt(user);
    res.redirect(`${frontendBase}/tree/?token=${jwtToken}&verified=1`);
  } catch (err) {
    console.error('Verify email error:', err);
    res.redirect(`${frontendBase}/tree/?auth_error=verify_failed`);
  }
});

router.post('/resend-verify', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '邮箱不能为空' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.json({ success: true, message: '如果邮箱存在，验证邮件已发送' });
    if (user.emailVerified) return res.json({ success: true, message: '邮箱已验证' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExp },
    });

    sendVerificationEmail(user.email, verifyToken).catch(err => {
      console.error('Failed to resend verification email:', err);
    });

    res.json({ success: true, message: '验证邮件已发送' });
  } catch (err) {
    console.error('Resend verify error:', err);
    res.status(500).json({ error: '发送失败' });
  }
});

// ============================
// LinuxDo OAuth
// ============================

if (config.IS_DEV) {
  router.get('/dev-login', async (req, res) => {
    const devUsername = sanitizeUsername(req.query.username || 'dev_user');
    const devLinuxdoId = parseInt(req.query.id) || 99999;

    try {
      const isAdmin = devLinuxdoId === config.ADMIN_LINUXDO_ID;
      const user = await prisma.user.upsert({
        where: { linuxdoId: devLinuxdoId },
        update: { username: devUsername, isAdmin },
        create: {
          linuxdoId: devLinuxdoId,
          username: devUsername,
          avatarUrl: null,
          trustLevel: 1,
          isAdmin,
        },
      });

      const jwtToken = signJwt(user);
      res.redirect(`${config.DEV_FRONTEND_URL}/tree/?token=${jwtToken}`);
    } catch (err) {
      console.error('Dev login error:', err);
      res.status(500).json({ error: 'Dev login failed' });
    }
  });
}

router.get('/login', (req, res) => {
  if (config.IS_DEV && (!config.LINUXDO_CLIENT_ID || config.LINUXDO_CLIENT_ID === 'your_client_id_here')) {
    return res.redirect('/api/auth/dev-login?username=test_user&id=99999');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: config.LINUXDO_CLIENT_ID,
    response_type: 'code',
    redirect_uri: config.LINUXDO_REDIRECT_URI,
    state,
  });
  res.redirect(`https://connect.linux.do/oauth2/authorize?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const frontendBase = config.IS_DEV ? config.DEV_FRONTEND_URL : '';

  if (!code) return res.redirect(`${frontendBase}/tree/?auth_error=missing_code`);

  try {
    const tokenRes = await axios.post(
      'https://connect.linux.do/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.LINUXDO_REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: config.LINUXDO_CLIENT_ID, password: config.LINUXDO_CLIENT_SECRET },
      }
    );
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://connect.linux.do/api/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const linuxdoUser = userRes.data;

    const isAdmin = linuxdoUser.id === config.ADMIN_LINUXDO_ID;
    const cleanUsername = sanitizeUsername(linuxdoUser.username);
    const user = await prisma.user.upsert({
      where: { linuxdoId: linuxdoUser.id },
      update: {
        username: cleanUsername,
        avatarUrl: linuxdoUser.avatar_url || null,
        trustLevel: linuxdoUser.trust_level || 0,
        isAdmin,
      },
      create: {
        linuxdoId: linuxdoUser.id,
        username: cleanUsername,
        avatarUrl: linuxdoUser.avatar_url || null,
        trustLevel: linuxdoUser.trust_level || 0,
        isAdmin,
      },
    });

    const jwtToken = signJwt(user);
    res.redirect(`${frontendBase}/tree/?token=${jwtToken}`);
  } catch (err) {
    console.error('OAuth callback error:', err.response?.data || err.message);
    res.redirect(`${frontendBase}/tree/?auth_error=1`);
  }
});

// ============================
// Current user
// ============================

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        tree: true,
        follows: {
          include: {
            tree: {
              include: {
                owner: { select: { username: true, avatarUrl: true } },
                _count: { select: { decorations: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const visibleFollows = user.follows.filter(f => checkTreeAccess(f.tree, user));

    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
      email: user.email,
      emailVerified: user.emailVerified,
      tree: user.tree ? { id: user.tree.id, slug: user.tree.slug, title: user.tree.title } : null,
      followedTrees: visibleFollows.map(f => ({
        id: f.tree.id,
        slug: f.tree.slug,
        title: f.tree.title,
        owner: f.tree.owner,
        decorationCount: f.tree._count.decorations,
      })),
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
