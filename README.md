# AI电商运营管家 - 响应式最终工作流版

这版包含：

- 电脑端完整 SaaS 工作台
- 手机端轻量操作台，底部导航
- AI店铺复盘诊断
- AI竞品情报
- AI素材工作流
- AI短视频工作流
- AI成交作战台
- AI运营导师后台
- 店铺授权中心，单平台最高 100 个店铺
- AI积分/算力中心
- 登录注册、验证码、找回密码、实名认证页面结构

## 本地运行

```bash
npm install
cp .env.example .env
node server.js
```

浏览器打开：

```text
http://localhost:3000
```

## 服务器更新

```bash
cd /www/aishopai
git pull
npm install
pm2 restart aishopai
```


## 2026-05 更新
- 修复 AI店铺复盘首次诊断逻辑：首次诊断不显示昨日任务、不检查上次计划。
- 新增诊断历史记录：第二次开始读取上次诊断与客户执行反馈。
- 诊断后自动保存下次复盘检查项。
