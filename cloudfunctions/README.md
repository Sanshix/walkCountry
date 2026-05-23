# 会走路的村庄：TCB 后端 MVP

这是「会走路的村庄」AI 导览小程序的后端 MVP，实现为腾讯云开发（CloudBase / TCB）云函数，并额外提供本地 mock 运行环境。

项目能力：

- 获取村庄漫游路线
- 根据用户身份、兴趣、时间创建体验 session
- 获取点位 AI 个性化导览内容
- 保存点位记录和图片 fileID
- 生成最终观察报告
- 初始化 routes / spots 数据
- 兼容 Semi / 乡建数字身份 OAuth2 + PKCE 登录流程的云函数版本
- 未配置 AI 时自动返回兜底内容，本地测试可完整跑通

## 目录结构

```text
cloudfunctions/
├── getRoutes/
├── createSession/
├── getSpotContent/
├── submitNote/
├── generateReport/
├── initData/
├── semiAuthLogin/
├── semiAuthCallback/
├── semiAuthUnbind/
└── semiAuthRefresh/
local-dev/
├── mockCloud.js
├── run.js
├── testAll.js
├── resetDb.js
└── seedData.js
.env.example
package.json
README.md
```

说明：核心后端开发内容统一在 `cloudfunctions/` 内。`local-dev/` 只用于本地模拟 `wx-server-sdk`、数据库和 openid。

## 环境要求

- Node.js >= 18
- npm >= 8
- 腾讯云开发环境（真实部署时需要）

## 本地运行

本地模式不需要安装第三方依赖，因为会通过 `local-dev/mockCloud.js` 模拟 `wx-server-sdk`。

```bash
npm install
npm run reset:local
npm run init
npm run test:all
```

也可以单独测试：

```bash
npm run test:getRoutes
npm run test:createSession
npm run test:getSpotContent
npm run test:submitNote
npm run test:generateReport
npm run test:semiLogin
```

本地 mock 数据库文件会自动生成在：

```text
local-dev/mock-db.json
```

默认 mock openid：

```text
mock_openid_001
```

可通过环境变量覆盖：

```bash
MOCK_OPENID=another_user npm run test:all
```

## AI 配置

复制 `.env.example` 并按需配置环境变量。注意：本地脚本不会自动加载 `.env`，可以直接用命令行环境变量传入。

```bash
AI_API_KEY=sk-xxx AI_MODEL=gpt-4o-mini npm run test:all
```

如果 `AI_API_KEY` 为空：

- `getSpotContent` 返回点位兜底内容
- `generateReport` 返回报告兜底内容
- 返回中 `meta.fallback = true`
- 整体流程仍可跑通

## 云函数说明

### 1. initData

初始化 2 条路线和 7 个点位。幂等执行，多次调用不会重复插入。

```js
wx.cloud.callFunction({
  name: 'initData',
  data: {}
});
```

### 2. getRoutes

获取全部路线。

```js
wx.cloud.callFunction({
  name: 'getRoutes',
  data: {}
});
```

### 3. createSession

创建导览 session。

```js
wx.cloud.callFunction({
  name: 'createSession',
  data: {
    routeType: 'digital_nomad',
    userType: '数字游民',
    interest: '乡建观察',
    duration: '45分钟'
  }
});
```

路线匹配规则：

1. 优先匹配 `routeType`
2. 其次匹配 `targetUsers` 中的 `userType`
3. 仍未匹配时使用 `visitor_scenery_humanities`

### 4. getSpotContent

获取点位内容。

```js
wx.cloud.callFunction({
  name: 'getSpotContent',
  data: {
    sessionId: 'xxx',
    spotId: 'old_house'
  }
});
```

会校验：

- 当前用户 openid 与 session.openid 一致
- spotId 属于 session.routeSpotIds
- AI 失败时使用 fallback

### 5. submitNote

保存用户记录。

```js
wx.cloud.callFunction({
  name: 'submitNote',
  data: {
    sessionId: 'xxx',
    spotId: 'old_house',
    note: '这栋老屋让我感觉村庄的过去和未来正在交接。',
    images: ['cloud://xxx/photo1.jpg']
  }
});
```

参数限制：

- `note` 最长 500 字
- `images` 最多 9 张
- 每张图片必须是 `cloud://` fileID

### 6. generateReport

生成最终观察报告。

```js
wx.cloud.callFunction({
  name: 'generateReport',
  data: {
    sessionId: 'xxx'
  }
});
```

如果没有用户 notes，不调用 AI，直接返回兜底报告。

## Semi / 乡建数字身份兼容说明

需求文档中的 Semi 登录是 OAuth2 Authorization Code Flow + PKCE。由于本项目后端形态是 TCB 云函数，不引入 Express / HTTP Server，因此这里实现为 4 个云函数：

- `semiAuthLogin`：生成 state、code_verifier、code_challenge，并返回 Semi 授权 URL
- `semiAuthCallback`：接收 code / state，换 token，获取 userinfo，绑定或创建本地用户，签发本系统 appToken
- `semiAuthRefresh`：刷新 Semi token
- `semiAuthUnbind`：解绑 Semi 身份

前端小程序或 H5 可以先调用 `semiAuthLogin`，拿到 `authUrl` 后跳转。

本地 mock 测试：

```bash
npm run test:all
```

其中 `semiAuthCallback` 会使用 mock code 和 mock userinfo 跑通，不需要真实 Semi 配置。

生产环境需要配置：

```text
SEMI_CLIENT_ID
SEMI_CLIENT_SECRET
SEMI_REDIRECT_URI
SEMI_SCOPES
SEMI_AUTHORIZATION_URL
SEMI_TOKEN_URL
SEMI_USERINFO_URL
APP_SESSION_SECRET
```

安全说明：示例中 token 使用 base64 演示加密占位。生产环境必须替换为 KMS 或 AES-GCM 等真实加密方案，并做好 refresh token 轮换并发控制。

## 腾讯云开发部署说明

1. 在微信开发者工具或腾讯云开发控制台创建 CloudBase 环境。
2. 创建数据库集合：
   - `routes`
   - `spots`
   - `sessions`
   - `notes`
   - 如需 Semi：`oauthStates`、`users`、`external_identities`
3. 分别上传并部署 `cloudfunctions/` 下的云函数。
4. 每个云函数进入自身目录后安装依赖：

```bash
npm install
```

5. 为 `getSpotContent` 和 `generateReport` 配置环境变量：

```text
AI_BASE_URL
AI_API_KEY
AI_MODEL
```

6. 如需 Semi 登录，为 Semi 相关云函数配置环境变量：

```text
SEMI_CLIENT_ID
SEMI_CLIENT_SECRET
SEMI_REDIRECT_URI
SEMI_SCOPES
SEMI_AUTHORIZATION_URL
SEMI_TOKEN_URL
SEMI_USERINFO_URL
APP_SESSION_SECRET
```

7. 先调用 `initData` 初始化数据。
8. 前端使用 `wx.cloud.callFunction` 调用各云函数。

## 统一返回格式

成功：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "errorCode": "INVALID_PARAMS",
  "message": "错误说明"
}
```

AI 兜底：

```json
{
  "success": true,
  "data": {},
  "meta": {
    "fallback": true
  }
}
```

## 验收 checklist

- [ ] `npm run reset:local` 可以清空本地 mock 数据库
- [ ] `npm run init` 可以写入 2 条 routes 和 7 个 spots
- [ ] `npm run test:getRoutes` 可以获取路线列表
- [ ] `npm run test:createSession` 可以创建 session
- [ ] `npm run test:getSpotContent` 在无 AI Key 时返回 fallback 内容
- [ ] `npm run test:submitNote` 可以保存 note 和 cloud fileID
- [ ] `npm run test:generateReport` 在无 AI Key 时返回 fallback 报告
- [ ] `npm run test:all` 可以完整跑通业务链路
- [ ] TCB 部署后每个用户只能访问自己的 session
- [ ] `getRoutes` 不写死路线数量
- [ ] `createSession` 返回的 spots 顺序与 route.spotIds 一致
- [ ] `initData` 重复执行不会产生重复数据
