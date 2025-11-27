# Deco My Tree

### 运行前端

在根目录下运行

```
npm init
npm run dev
```

### 运行数据库

在 `server` 目录下创建一个 `.env` 文件，内容如下：

```
# 数据库连接 (SQLite 文件路径)
DATABASE_URL="file:./dev.db"

# 加密密钥 (随便乱打一串复杂的字符，千万别告诉别人)
SECRET_KEY="Xmas2025_Super_Secret_Key_!@#$"
```

接着在 `server` 目录执行

```
npm install express cors dotenv crypto-js @prisma/client
npm install prisma@5.10.0 --save-dev
npm install @prisma/client@5.10.0
npx prisma migrate dev --name init
node index.js
```

同时打开前端和数据库，即可访问。

### Cheat mode

将 `/server/index.js` 中 `CHRISTMAS_DATE` 修改到一个过去的时间即可。
