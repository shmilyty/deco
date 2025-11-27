# Deco My Tree

![](/public/demo.png)
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
npx prisma migrate dev --name init
node index.js
```

在服务器上同时打开前端和后端，然后邀请你的朋友们吧！

### Cheat mode

将 `/server/index.js` 中 `CHRISTMAS_DATE` 修改到一个过去的时间即可。

