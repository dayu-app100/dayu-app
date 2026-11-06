# 大鱼 App · iOS 打包指南

App 本体是 `www/` 里的 H5（Capacitor 壳），编译 iOS 必须有 macOS 环境。没有 Mac 也没关系，走下面的「云端构建」。

## 路线 A：GitHub Actions 云端构建（推荐，无需 Mac）

1. 把 `dayu-app/` 整个目录推到一个 GitHub 仓库（workflow 已放在 `.github/workflows/build-ios.yml`）。
2. 仓库页 → **Actions** → `Build iOS (unsigned ipa)` → **Run workflow**。
3. 跑完（约 5-8 分钟）在该次运行页下载产物 **dayu-unsigned-ipa**，得到 `dayu-unsigned.ipa`。

拿到 ipa 后安装到手机：

| 方式 | 说明 |
|---|---|
| **巨魔 TrollStore**（推荐） | 支持 iOS 14.0-16.6.1 及部分 17.0，**直接安装未签名 ipa**，永久有效不掉签 |
| **全能签 / 爱思助手自签** | 需 Apple ID 签名；免费证书 7 天有效需续签，付费证书可长期 |

> 注意：巨魔不支持的新系统版本，只能走全能签等签名方案。

## 路线 B：本地 Mac 构建

```bash
cd dayu-app
npm install
npx cap add ios        # 生成 ios/ 工程（仅首次）
npx cap sync ios       # www 有更新后同步
npx cap open ios       # 打开 Xcode
# Xcode 里选真机 → Run，或 Product > Archive 出 ipa
```

## App 首次启动配置

App 打包后是「壳 + 远程数据」结构，用户首次打开需要在 **我的 → 服务器** 里填写你的卡密服务器公网地址（如 `https://api.xxx.com`）。

把服务端部署到公网：

```bash
# 任意 Linux 服务器（装好 Node 20+）
scp -r dayu/server user@your-server:/opt/dayu
ssh user@your-server
cd /opt/dayu/server
ADMIN_TOKEN=换一个强管理令牌 PORT=8787 node server.js
# 建议用 pm2 守护 + nginx 反代 + HTTPS（iOS 要求接口必须 HTTPS）
```

## 修改 App 的地方

| 要改什么 | 改哪里 |
|---|---|
| App 名称 / 包名 | `capacitor.config.json` 的 `appName` / `appId` |
| 微信客服 | `www/index.html` 顶部的 `WX_ID = 'A98988r'` |
| 素材包内容 | 服务端 `server.js` 的 `PACKS` 数组 + App 里 `COVERS` 封面 |
| App 图标 | 改 `scripts/gen-icons.js` 后 `npm run icons`，再 `npx cap sync ios` |

## 已知事项

- 设备指纹目前用本地持久化随机 ID；重装 App 会变（TrollStore 覆盖安装不变）。如需更强绑定，原生层接入 `UIDevice.identifierForVendor`（后续可加 Capacitor 插件）。
- `www/index.html` 与 `dayu/public` 无重复：服务端 `/app` 已改为直接托管 `dayu-app/www`。
