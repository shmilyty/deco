
# 🎄 Deco My Tree (Christmas Time Capsule)

<div align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat" alt="License: GPL v3" />
</div>
<br />

> 🎁 一棵属于冬日的「时间胶囊」圣诞树。挂上你的祝福，静待圣诞节解锁。

## 📖 项目简介

**Deco My Tree** 是一个多用户互动的圣诞主题全栈应用。每个用户可以种一棵属于自己的圣诞树，朋友们可以在树上挂礼物（写祝福、传照片）。

核心玩法是 **「时间胶囊」** 机制：所有留言在圣诞节前加密封存，12 月 25 日统一解锁。

## ✨ 功能特性

**多用户系统**
- 📧 邮箱 + 密码注册登录（Argon2 加密，邮箱验证）
- 🔗 LinuxDo OAuth 第三方登录
- 🌲 每人一棵专属圣诞树，可设置公开/私密/仅链接可访问
- ⭐ 关注其他人的树

**互动体验**
- 🎄 点击树上空白处挂礼物，支持上传最多 3 张图片
- 🔒 时间封印：圣诞节前留言 AES 加密，节日当天自动解锁
- 📄 每棵树 10 个礼物，满了自动分页到新树
- 🥚 2% 概率隐藏彩蛋图标

**UI 设计**
- ❄️ 全屏雪花特效 + 暖色渐变背景
- 🃏 3D 翻转卡片（填写面 / 预览面）
- ⏰ 圣诞倒计时（自动计算下一个圣诞节）
- 📱 完美移动端适配（safe-area、dvh、专注模式）
- 🏠 封面介绍页（文案可通过配置文件自定义）

**安全**
- 🛡️ API 速率限制（express-rate-limit）
- 🤖 Cloudflare Turnstile 人机验证
- 🔐 CORS 白名单、文件上传类型过滤
- ✅ 生产环境强制校验必要环境变量

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Vue 3, Vue Router 4, Vite 7 |
| 后端 | Node.js, Express 5, JWT |
| 数据库 | SQLite, Prisma 5 ORM |
| 认证 | Argon2 (密码), LinuxDo OAuth, Nodemailer (邮件验证) |
| 部署 | PM2, Caddy (HTTPS), Cloudflare |

## 📂 目录结构

```
deco/
├── src/                     # 前端源码
│   ├── components/          #   组件 (ChristmasTree, ChristmasCard, AuthModal...)
│   ├── composables/         #   组合式函数 (useAuth)
│   ├── config/              #   前端配置 (封面页文案 landing.js)
│   ├── views/               #   页面 (Landing, Home, TreeView, About...)
│   └── router/              #   路由
├── server/                  # 后端源码
│   ├── config.js            #   环境变量 & 配置
│   ├── index.js             #   Express 入口
│   ├── routes/              #   路由 (auth.js, trees.js)
│   ├── middleware/           #   中间件 (auth.js)
│   ├── lib/                 #   工具库 (crypto, upload, email, prisma)
│   ├── prisma/              #   数据库 Schema & 迁移
│   └── uploads/             #   用户上传图片
├── dist/                    # 前端构建产物
├── public/                  # 静态资源 (树图片, 图标)
└── vite.config.js           # Vite 配置
```

## 🚀 本地开发

### 1. 克隆 & 安装

```bash
git clone https://github.com/shmilyty/deco.git
cd deco

# 前端
npm install

# 后端
cd server
npm install
```

### 2. 初始化数据库

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

### 3. 启动

需要两个终端：

```bash
# 终端 1：后端（端口 3000）
cd server
node index.js

# 终端 2：前端（端口 5173）
npm run dev
```

访问 http://localhost:5173/tree/ 。开发模式下无需配置 OAuth，自动使用模拟登录。

------

## ☁️ 生产部署

推荐 **Ubuntu + PM2 + Caddy** 。

### 1. 服务器环境

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs

# PM2
sudo npm install -g pm2
```

### 2. 部署代码

```bash
cd /root/deco
git clone https://github.com/shmilyty/deco.git .
npm install
cd server && npm install
```

### 3. 配置环境变量

```bash
# 生成密钥
openssl rand -hex 32  # 用于 SECRET_KEY
openssl rand -hex 32  # 用于 JWT_SECRET
```

创建 `server/.env`（参考 `server/.env.example`）：

```ini
NODE_ENV=production
DATABASE_URL=file:./prod.db

SECRET_KEY=你的随机密钥1
JWT_SECRET=你的随机密钥2

# LinuxDo OAuth（在 connect.linux.do 创建应用）
LINUXDO_CLIENT_ID=xxx
LINUXDO_CLIENT_SECRET=xxx
LINUXDO_REDIRECT_URI=https://你的域名/tree/api/auth/callback

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=xxx

# CORS
ALLOWED_ORIGINS=https://你的域名

# 管理员
ADMIN_LINUXDO_ID=你的LinuxDo用户ID

# SMTP 邮件（可选，不配则验证链接打印到日志）
# SMTP_HOST=smtp.qq.com
# SMTP_PORT=465
# SMTP_USER=noreply@example.com
# SMTP_PASS=授权码
# SMTP_FROM=Deco My Tree <noreply@example.com>

# 邮箱域名白名单（可选，不设=允许所有）
# EMAIL_DOMAIN_WHITELIST=gmail.com,qq.com,163.com
```

### 4. 构建 & 启动

```bash
# 构建前端
cd /root/deco
npm run build

# 初始化数据库
cd server
npx prisma generate
npx prisma migrate deploy

# 启动
pm2 start index.js --name decotree
pm2 save && pm2 startup
```

### 5. Caddy 反向代理

`/etc/caddy/Caddyfile`:

```caddyfile
your-domain.com {
    tls /etc/caddy/cert.pem /etc/caddy/key.pem

    handle /tree/* {
        reverse_proxy localhost:3000
    }

    handle /uploads/* {
        reverse_proxy localhost:3000
    }

    handle {
        redir https://your-domain.com/tree/ 301
    }
}
```

```bash
sudo systemctl reload caddy
```

### 6. 验证

- 访问 `https://你的域名/tree/` 看到封面页
- 点击登录测试 OAuth 和邮箱注册
- 挂礼物测试图片上传

------

## ⚙️ 自定义配置

### 封面页文案

编辑 `src/config/landing.js`，修改标题、介绍、功能亮点等文案后重新 `npm run build`。

### 时间胶囊解锁日期

在 `server/.env` 中设置：

```ini
UNLOCK_DATE=2025-12-25T00:00:00
```

## 🤝 贡献

欢迎提交 Pull Request 和 Issues！

## 📄 License

[GNU General Public License v3.0](LICENSE)
