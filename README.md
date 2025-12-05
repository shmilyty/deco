
# 🎄 Deco Tree (Christmas Time Capsule)

<div align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.0-4FC08D?style=flat&logo=vue.js" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</div>
<br />

> 🎁 一个充满节日氛围的“数字时间胶囊”。在这个下雪的冬夜，给圣诞树挂上你的祝福，静待圣诞节解锁。

## 📖 项目简介 (Introduction)

**Deco Tree** 是一个全栈互动的圣诞主题网页应用。用户可以选择精美的图标、上传照片并写下祝福挂在虚拟的圣诞树上。

最有意思的是它的 **“时间胶囊”** 机制：所有留言在 **12月25日** 之前都是“封印”状态（内容被加密隐藏），只有到了圣诞节当天，所有的祝福才会自动解封，供大家查阅。

## ✨ 核心功能 (Features)

* **🎄 互动圣诞树**：点击树梢即可挂上礼物，支持动态增加新树（分页查看）。
* **🔒 时间封印 (Time Lock)**：
    * 圣诞节前：留言内容被 AES 加密，UI 显示为“封印中”。
    * 圣诞节后：自动解密，展示完整祝福和图片。
* **📸 多媒体支持**：支持上传图片（最多3张），带有预览和压缩功能。
* **🎨 沉浸式 UI**：
    * 全屏雪花特效 & 暖色调渐变背景。
    * 精美的毛玻璃 (Glassmorphism) 卡片设计。
    * 3D 翻转卡片交互（填写面/预览面）。
    * 左上角圣诞倒计时（带入场动画）。
* **📱 完美移动端适配**：
    * 解决 iOS/Android 滚动回弹问题。
    * 专注模式：移动端写信时自动隐藏干扰元素。
    * 流式布局适配各种尺寸屏幕。
* **🥚 隐藏彩蛋**：切换图标时有 2% 概率触发特殊发光图标。

## 🛠 技术栈 (Tech Stack)

* **前端**：Vue 3 (Composition API), Vite, CSS3 (Animations, Grid/Flex)
* **后端**：Node.js, Express, Multer (文件上传)
* **数据库**：SQLite, Prisma ORM
* **部署**：PM2, Caddy (自动 HTTPS), Cloudflare

## 🚀 本地开发 (Local Development)

### 1. 克隆项目
```bash
git clone [https://github.com/你的用户名/deco-tree.git](https://github.com/你的用户名/deco-tree.git)
cd deco-tree
```

### 2. 安装依赖

需要分别安装根目录（前端）和 `server` 目录（后端）的依赖。

Bash

```
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 3. 配置数据库

确保在 `server` 目录下。

Bash

```
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移 (创建 dev.db)
npx prisma migrate dev --name init
```

### 4. 启动项目

你需要打开两个终端窗口：

- **终端 1 (后端)**：

  Bash

  ```
  cd server
  node index.js
  ```

- **终端 2 (前端)**：

  Bash

  ```
  # 回到根目录
  npm run dev
  ```

访问 `http://localhost:5173` 即可看到效果。

------

## ☁️ 服务器部署指南 (Deployment)

本项目推荐使用 **Ubuntu + PM2 + Caddy** 进行部署。

### 1. 环境准备

确保服务器已安装 Node.js (v20+) 和 PM2。

Bash

```
# 安装 Node.js
curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

### 2. 部署代码

将代码上传至服务器 `/var/www/decotree`（示例路径）。

Bash

```
cd /var/www/decotree
npm install
cd server
npm install
```

### 3. 配置环境变量

在 `server` 目录下创建 `.env` 文件：

代码段

```
DATABASE_URL="file:./prod.db"
SECRET_KEY="这里填写一个复杂的随机字符串作为加密密钥"
```

初始化生产环境数据库：

Bash

```
npx prisma generate
npx prisma migrate deploy
```

### 4. 构建前端

后端配置了静态托管 `../dist`，所以需要先构建前端。

Bash

```
# 在项目根目录
npm run build
```

### 5. 启动服务 (PM2)

Bash

```
cd server
pm2 start index.js --name "decotree"
pm2 save
pm2 startup
```

### 6. 配置反向代理 (Caddy)

使用 Caddy 处理 HTTPS 和路径转发（假设挂载在 `/tree/` 子路径）。

`/etc/caddy/Caddyfile`:

代码段

```
your-domain.com {
    # 如果使用 Cloudflare 源服务器证书
    tls /etc/caddy/cert.pem /etc/caddy/key.pem

    # 将 /tree/ 路径转发给 Node.js 后端
    handle_path /tree/* {
        reverse_proxy localhost:3000
    }

    # 兜底重定向
    handle {
        redir [https://your-domain.com/tree/](https://your-domain.com/tree/) 301
    }
}
```

重启 Caddy：`sudo systemctl reload caddy`

------

## 📂 目录结构

Plaintext

```
deco-tree/
├── dist/               # 前端构建产物 (Vue打包后)
├── public/             # 静态资源 (图标、图片)
├── src/                # 前端源代码
│   ├── components/     # 组件 (ChristmasTree, Card, Countdown...)
│   ├── views/          # 页面 (Home, About)
│   └── ...
├── server/             # 后端源代码
│   ├── prisma/         # 数据库 Schema 和 SQLite 文件
│   ├── uploads/        # 用户上传的图片存储目录
│   └── index.js        # Express 入口文件
└── vite.config.js      # Vite 配置
```

## 🤝 贡献 (Contributing)

如果你有好的点子（比如烟花特效，或是账号绑定），欢迎提交 Pull Request！

1. Fork 本仓库
2. 新建分支 `git checkout -b feature/NewFeature`
3. 提交更改 `git commit -m 'Add some feature'`
4. 推送到分支 `git push origin feature/NewFeature`
5. 提交 Pull Request

## 📄 License

- 本项目使用 GNU General Public License v3.0
