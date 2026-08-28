# Meeple POS · 桌游库存维护

React + Vite + Tailwind CSS 的离线优先 PWA 样板，针对 iPad 与手机的后台库存维护场景设计。

## 目录结构

```
src/
  components/        # ItemForm、ImageGallery
  lib/stockStore.js  # 可替换的数据访问层（当前为 localStorage）
  App.jsx            # 列表与编辑视图
public/              # 静态 manifest、图标
.github/workflows/   # GitHub Pages CI/CD
```

## 本地运行

```bash
npm install
npm run dev
npm run build
```

浏览器 localStorage 保存游戏资料与 Data URL 图片，断网时仍可读取与编辑已缓存的应用资源和数据。Data URL 适合原型和少量小图；生产环境请把 `readImage` 的上传逻辑替换为 Firebase Storage 或 Cloudinary，并只保存返回的 URL。

## 部署

### GitHub Pages

1. `git init`、`git add .`、`git commit -m "Initial Meeple POS"`，然后建立并推送至 GitHub 的 `main` 分支。
2. 在仓库 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**。
3. 已提供的工作流会在每次推送 `main` 后构建与部署。工作流会自动处理仓库子路径。

### Netlify

1. 将 GitHub 仓库导入 Netlify。
2. Netlify 会读取 `netlify.toml`：Build command 为 `npm run build`，Publish directory 为 `dist`。
3. 点击 Deploy；SPA fallback 和 PWA 静态资源已配置。

### Firebase Hosting

1. 在 Firebase Console 创建项目，然后执行 `npm install -g firebase-tools`、`firebase login`、`firebase use --add`。
2. 构建后运行 `firebase deploy --only hosting`。`firebase.json` 已包含 `dist` 发布目录和 SPA rewrite。

## 接入 Firebase（生产建议）

Firebase Web SDK 已安装，并提供 `src/lib/firebase.js`。复制 `.env.example` 为 `.env.local`，填入 Firebase Console 中 Web App 的配置值后即可启用 SDK；未配置时应用继续保持本地离线模式。

建立 `games` Firestore collection，图片上传至 `games/{gameId}/{uuid}`，文档只存储图片 URL、名称及库存字段。下一步将 `src/lib/stockStore.js` 的 `getGames` / `saveGames` 替换为 Firestore 的实时查询与写入，即可保持 UI 组件不变。对 Storage 设置仅限已登录员工写入，并以 Firestore rules 限制库存字段编辑权限。
