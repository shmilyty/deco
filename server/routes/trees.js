const express = require('express');
const router = express.Router();
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const prisma = require('../lib/prisma');
const { optionalAuth, requireAuth, checkTreeAccess } = require('../middleware/auth');
const { encrypt, decrypt } = require('../lib/crypto');
const upload = require('../lib/upload');

const decorationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '留言太频繁了，请稍后再试' },
});

// ============================
// Tree CRUD
// ============================

router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const isAdmin = req.user && req.user.isAdmin;
    const where = isAdmin ? {} : { isPublic: true };

    const [trees, total] = await Promise.all([
      prisma.tree.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { decorations: true } },
        },
      }),
      prisma.tree.count({ where }),
    ]);

    res.json({
      data: trees.map(t => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        isPublic: t.isPublic,
        isAccessible: t.isAccessible,
        owner: t.owner,
        decorationCount: t._count.decorations,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('List trees error:', err);
    res.status(500).json({ error: '获取树列表失败' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.tree.findUnique({
      where: { ownerId: req.user.id },
    });
    if (existing) {
      return res.status(409).json({ error: '你已经有一棵树了', tree: { id: existing.id, slug: existing.slug } });
    }

    const { title } = req.body || {};
    const tree = await prisma.tree.create({
      data: {
        title: title || 'My Christmas Tree',
        ownerId: req.user.id,
      },
    });
    res.json({ success: true, tree: { id: tree.id, slug: tree.slug, title: tree.title } });
  } catch (err) {
    console.error('Create tree error:', err);
    res.status(500).json({ error: '创建失败' });
  }
});

router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({
      where: { slug: req.params.slug },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { decorations: true } },
      },
    });
    if (!tree) return res.status(404).json({ error: '树不存在' });

    if (!checkTreeAccess(tree, req.user)) {
      return res.status(403).json({ error: '这棵树不对外开放' });
    }

    res.json({
      id: tree.id,
      slug: tree.slug,
      title: tree.title,
      isPublic: tree.isPublic,
      isAccessible: tree.isAccessible,
      owner: tree.owner,
      decorationCount: tree._count.decorations,
      createdAt: tree.createdAt,
      isOwner: req.user ? req.user.id === tree.ownerId : false,
    });
  } catch (err) {
    console.error('Get tree error:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

router.patch('/:slug', requireAuth, async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({ where: { slug: req.params.slug } });
    if (!tree) return res.status(404).json({ error: '树不存在' });

    if (req.user.id !== tree.ownerId && !req.user.isAdmin) {
      return res.status(403).json({ error: '无权修改' });
    }

    const { title, isPublic, isAccessible } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = String(title).slice(0, 50);
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);
    if (isAccessible !== undefined) updateData.isAccessible = Boolean(isAccessible);

    if (updateData.isPublic === true) {
      updateData.isAccessible = true;
    }

    const updated = await prisma.tree.update({
      where: { slug: req.params.slug },
      data: updateData,
    });

    res.json({
      success: true,
      tree: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        isPublic: updated.isPublic,
        isAccessible: updated.isAccessible,
      },
    });
  } catch (err) {
    console.error('Update tree error:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// ============================
// Follow
// ============================

router.post('/:slug/follow', requireAuth, async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({ where: { slug: req.params.slug } });
    if (!tree) return res.status(404).json({ error: '树不存在' });
    if (tree.ownerId === req.user.id) return res.status(400).json({ error: '不能关注自己的树' });
    if (!checkTreeAccess(tree, req.user)) {
      return res.status(403).json({ error: '这棵树不对外开放' });
    }

    await prisma.follow.upsert({
      where: { userId_treeId: { userId: req.user.id, treeId: tree.id } },
      update: {},
      create: { userId: req.user.id, treeId: tree.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: '关注失败' });
  }
});

router.delete('/:slug/follow', requireAuth, async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({ where: { slug: req.params.slug } });
    if (!tree) return res.status(404).json({ error: '树不存在' });

    await prisma.follow.deleteMany({
      where: { userId: req.user.id, treeId: tree.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: '取消关注失败' });
  }
});

// ============================
// Decorations (per tree)
// ============================

router.get('/:slug/decorations', optionalAuth, async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({ where: { slug: req.params.slug } });
    if (!tree) return res.status(404).json({ error: '树不存在' });

    if (!checkTreeAccess(tree, req.user)) {
      return res.status(403).json({ error: '这棵树不对外开放' });
    }

    const allDecorations = await prisma.decoration.findMany({
      where: { treeId: tree.id },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const isUnlocked = now >= config.UNLOCK_DATE;
    const isOwner = req.user ? req.user.id === tree.ownerId : false;
    const isAdmin = req.user ? req.user.isAdmin : false;

    const safeData = allDecorations.map(item => {
      let images = [];
      try {
        if (item.images) images = JSON.parse(item.images);
      } catch (e) { images = []; }

      const safeItem = {
        id: item.id,
        x: item.x,
        y: item.y,
        icon: item.icon,
        nickname: item.nickname,
        isPrivate: item.isPrivate,
        createdAt: item.createdAt,
        images,
      };

      if (isUnlocked) {
        if (item.isPrivate && !isOwner && !isAdmin) {
          safeItem.content = '🔒 仅树主可见';
        } else {
          try {
            safeItem.content = decrypt(item.content);
          } catch (e) {
            safeItem.content = '[解密失败]';
          }
        }
      } else {
        safeItem.content = '🔒 封印中...';
      }

      return safeItem;
    });

    res.json({ isUnlocked, data: safeData });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.post('/:slug/decorations', decorationLimiter, optionalAuth, upload.array('images', 3), async (req, res) => {
  try {
    const tree = await prisma.tree.findUnique({ where: { slug: req.params.slug } });
    if (!tree) return res.status(404).json({ error: '树不存在' });

    if (!checkTreeAccess(tree, req.user)) {
      return res.status(403).json({ error: '这棵树不对外开放' });
    }

    const { x, y, icon, nickname, content, isPrivate, token } = req.body;
    const files = req.files || [];

    if (!config.IS_DEV && !token) return res.status(400).json({ error: '验证码缺失' });
    if (!content) return res.status(400).json({ error: '内容不能为空' });

    if (!config.IS_DEV) {
      try {
        const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await axios.post(verifyUrl, {
          secret: config.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip,
        });
        if (!result.data.success) {
          return res.status(403).json({ error: '人机验证失败，你是机器人吗？' });
        }
      } catch (err) {
        console.error('验证服务出错:', err);
        return res.status(500).json({ error: '验证服务暂时不可用' });
      }
    }

    const imagePaths = files.map(f => '/uploads/' + f.filename);
    const encryptedContent = encrypt(content);

    const newDecoration = await prisma.decoration.create({
      data: {
        x: String(x),
        y: String(y),
        icon,
        nickname,
        content: encryptedContent,
        isPrivate: Boolean(isPrivate === 'true' || isPrivate === true),
        images: JSON.stringify(imagePaths),
        treeId: tree.id,
      },
    });

    if (req.user && req.user.id !== tree.ownerId) {
      try {
        await prisma.follow.upsert({
          where: { userId_treeId: { userId: req.user.id, treeId: tree.id } },
          update: {},
          create: { userId: req.user.id, treeId: tree.id },
        });
      } catch (e) { /* ignore follow failure */ }
    }

    res.json({ success: true, id: newDecoration.id });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: '服务器出小差了' });
  }
});

module.exports = router;
