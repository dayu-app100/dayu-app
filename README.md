# 大鱼直播助手 · iOS App

Capacitor 6 壳 + H5 界面（`www/`）。推送到 GitHub 后由 Actions 自动编译出**未签名 ipa**，用巨魔 TrollStore 或全能签安装。

## 一、上传到 GitHub（3 分钟）

在**本目录（dayu-app）**打开终端执行：

```bash
git init
git add .
git commit -m "init: 大鱼直播助手 iOS"
git branch -M main
git remote add origin https://github.com/你的用户名/dayu-app.git
git push -u origin main
```

> 仓库先在 GitHub 网页新建一个**空仓库**（不要勾选 README / .gitignore），名字随意，比如 `dayu-app`。
> 推送时要求账号密码 → 密码位置填 **Personal Access Token**（GitHub → Settings → Developer settings → Tokens → 生成 classic token，勾 `repo` 权限）。

## 二、云端编译

1. 仓库页 → **Actions** 标签
2. 左侧 `Build iOS (unsigned ipa)` → 右侧 **Run workflow** → 绿色按钮
3. 等 5~8 分钟，出现绿勾
4. 点进这次运行 → 页面底部 **Artifacts** → 下载 `dayu-unsigned-ipa.zip`
5. 解压得到 **`dayu-unsigned.ipa`** ← 这就是安装包

如果失败，点开红色步骤看日志，常见原因：
- `npx cap add ios` 报 CocoaPods 错误 → 重新 Run 一次（runner 偶发）
- xcodebuild 报 scheme 找不到 → 把日志发我

## 三、安装到 iPhone

### 方式 A：巨魔 TrollStore（推荐，永久不掉签）
支持 iOS 14.0 – 16.6.1、17.0（具体看机型）。已装 TrollStore 的话：
把 `dayu-unsigned.ipa` 传到手机（微信/AirDrop/iCloud 都行）→ 用 TrollStore 打开 → Install。

### 方式 B：全能签 / 爱思助手自签
1. 把 ipa 传到手机
2. 全能签里选择该 ipa → 用自己的 Apple ID 签名 → 安装
3. 免费证书 7 天过期需重签；付费证书可 1 年

## 四、首次打开要做的设置

App 打开后点底部「**服务器设置**」，填入卡密服务器地址，例如：

- 局域网测试：`http://192.168.1.10:8787`
- 公网：`https://api.你的域名.com`

然后回到首页输入卡密激活。

> 注：workflow 里已自动给 Info.plist 加了「允许明文 HTTP」，方便你用 http 测试。正式对外请务必上 HTTPS。

## 五、改东西

| 项目 | 位置 |
|---|---|
| App 名称 / 包名 | `capacitor.config.json` |
| 头像 | `www/assets/avatar.jpg` |
| 微信客服 | `www/index.html` 中 `const WX_ID = 'A98988r'` |
| 界面文案 / 布局 | `www/index.html` |
| App 图标 | `scripts/gen-icons.js` 改完执行 `node scripts/gen-icons.js` |

改完 `git push`，Actions 会自动重新编译（push 到 main 且改动 `www/**` 时触发）。
