# 会走路的村庄 —— AI 实地叙事导览 Agent

这是一个可直接导入微信开发者工具运行的原生小程序 Demo。

## 页面流程
首页 → 身份选择 → 兴趣与游览时间 → AI 路线生成中 → 路线总览 → 点位讲解 → AI 语音讲解 → 用户发表 → 故事报告

## 导入方式
1. 解压压缩包。
2. 打开微信开发者工具。
3. 选择「导入项目」。
4. 项目目录选择 `walking-village-miniprogram-final`。
5. AppID 可使用测试号。
6. 直接编译运行。

## 目录说明
- `miniprogram/pages`：所有页面都在主包。
- `miniprogram/pkg-assets`：图片资源按页面分类。
- `miniprogram/utils/mockRoutes.js`：三条差异化路线 Mock 数据。
- `miniprogram/utils/routeMatcher.js`：身份 + 兴趣 + 时间的路线匹配逻辑。
- `cloudfunctions/aiRouteGen`：AI 调用云函数，失败时自动返回 cloud-mock。

## 云函数部署
1. 开通微信云开发。
2. 在微信开发者工具右键 `cloudfunctions/aiRouteGen` 上传并部署。
3. 如需真实 AI，配置环境变量：
   - `OPENAI_API_KEY` 或 `AI_API_KEY`
   - `AI_BASE_URL`，可选
   - `AI_MODEL`，可选

未配置 AI Key 时，云函数会自动返回 Mock 数据，不影响演示。

## Mock fallback
- 云函数 AI 调用失败：返回 `source: cloud-mock`。
- 前端调用云函数失败：使用 `utils/mockRoutes.js` 中的本地路线。
- 因此即使网络、云函数或 AI 服务不可用，也可以完整演示。

## 图片替换
当前图片是占位图。后期替换真实村庄图片时，把对应图片放到：
`miniprogram/pkg-assets/<页面名>/`。

如需让大图不进入主包，建议把图片上传到云存储/CDN，并修改：
`miniprogram/utils/config.js` 中的 `IMAGE_BASE_URL`。

## 三条路线
1. 数字游民乡建观察路线
2. 游客人文风景路线
3. 亲子研学非遗体验路线

路线会根据用户身份、兴趣和游览时间自动匹配，不会所有用户都看到同一条路线。
