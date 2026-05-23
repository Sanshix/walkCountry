# 《会走路的村庄》后端 MVP 技术实现方案

你们这次只做 **2 条路线**，所以后端不要设计成复杂的“智能路线推荐系统”，而应该设计成：

> **两条固定主题路线 + 真实村庄点位资料库 + AI 个性化生成 + 用户记录 + 最终报告生成**

这样最适合 2 天黑客松，开发快、稳定、好演示、后期也能扩展。

---

# 一、后端 MVP 目标

你作为后端，需要保证前端可以跑通这条完整链路：

```text
用户选择路线类型
→ 后端返回推荐路线
→ 前端进入点位
→ 后端根据用户身份和点位资料生成故事 / 任务 / 问题
→ 用户提交点位感受
→ 后端保存用户记录
→ 最后生成个人观察报告 / 故事卡
```

这就是后端 MVP 的核心。

---

# 二、推荐技术栈

考虑你们只有 2 天，我建议后端使用：

## 推荐方案：Node.js + Express + JSON 文件 + 大模型 API

| 模块    | 技术                                | 原因                |
| ----- | --------------------------------- | ----------------- |
| 后端框架  | Node.js + Express                 | 开发快，接口简单，和前端联调方便  |
| 数据存储  | JSON 文件 / 内存对象                    | 黑客松够用，不必一开始上复杂数据库 |
| 用户会话  | uuid 生成 sessionId                 | 不做登录，也能区分不同用户     |
| AI 调用 | OpenAI-compatible API / 其他大模型 API | 用于生成点位故事和最终报告     |
| 跨域    | cors                              | 方便前端本地联调          |
| 环境变量  | dotenv                            | 管理 API Key        |
| 二维码   | qrcode                            | 可选，用于生成和扫码点位二维码      |

---

# 三、为什么不要一开始上数据库

你们现在的核心不是数据系统，而是演示闭环。

MVP 阶段数据量很小：

* 2 条路线
* 5～8 个点位
* 少量用户输入
* 一份最终报告

所以第一版可以先用：

```text
data/spots.json
data/routes.json
内存 sessions 对象
```

这样开发最快。

如果第二天还有时间，再加 SQLite 或 MongoDB。

---

# 四、后端核心模块设计

后端可以拆成 5 个模块：

```text
1. 路线模块 Route
2. 点位模块 Spot
3. AI 生成模块 AI
4. 用户会话模块 Session
5. 报告生成模块 Report
```

---

# 五、两条路线设计

你们现在明确做 2 条路线。

## 路线一：数字游民乡建深度线

### 定位

面向数字游民、乡建研究者、新村民观察者、青年创业者。

### 体验目标

让用户从乡建、空间更新、新村民创业、社区共创的角度理解村庄。

### 建议路线名

## **新村民与乡建观察线**

或者：

## **数字游民的乡建深潜线**

### 点位示例

```text
村口
→ 老屋
→ 公共空间
→ 咖啡屋 / 民宿
→ 新村民创业点 / 农场
```

### 生成内容重点

* 老屋如何被重新使用
* 新村民为什么来到这里
* 村庄空间如何被更新
* 民宿、咖啡、农场如何形成新生活方式
* 数字游民如何与乡村发生关系

---

## 路线二：游客风景人文线

### 定位

面向普通游客、亲子家庭、摄影爱好者、城市白领。

### 体验目标

让用户轻松看风景、了解人文、完成拍照和故事体验。

### 建议路线名

## **风景与乡愁漫游线**

或者：

## **第一次打开村庄的人文风景线**

### 点位示例

```text
村口
→ 柿子树 / 植物点
→ 老屋
→ 山路 / 星空点
→ 咖啡屋 / 公共空间
```

### 生成内容重点

* 看见村庄的自然风景
* 理解老屋和乡愁
* 感受植物、季节和生活气息
* 引导拍照、停留、记录
* 生成适合传播的故事卡

---

# 六、后端目录结构建议

建议项目结构如下：

```text
village-agent-backend/
├── package.json
├── .env
├── server.js
├── data/
│   ├── routes.json
│   └── spots.json
├── services/
│   ├── aiService.js
│   ├── routeService.js
│   ├── spotService.js
│   └── reportService.js
├── prompts/
│   ├── spotPrompt.js
│   └── reportPrompt.js
├── utils/
│   └── response.js
└── README.md
```

---

# 七、核心数据结构设计

## 1. 路线数据 routes.json

```json
[
  {
    "id": "digital_nomad_village_research",
    "name": "新村民与乡建观察线",
    "routeType": "digital_nomad",
    "targetUsers": ["数字游民", "乡建研究者", "青年创业者", "新村民观察者"],
    "duration": "45分钟",
    "theme": "从乡建、空间更新和新村民创业角度理解村庄",
    "description": "这条路线适合想深入理解乡村变化的人。它会带你从村口进入村庄，在老屋、公共空间、民宿和新村民创业点之间，看见传统村落如何被重新使用。",
    "spotIds": ["village_gate", "old_house", "public_space", "cafe", "new_villager_space"]
  },
  {
    "id": "visitor_scenery_humanities",
    "name": "风景与乡愁漫游线",
    "routeType": "visitor",
    "targetUsers": ["普通游客", "亲子家庭", "摄影爱好者", "城市白领"],
    "duration": "40分钟",
    "theme": "看风景、听故事、理解乡村人文",
    "description": "这条路线适合第一次来到村庄的游客。它会带你看见村口、植物、老屋、山路和公共空间，在轻松漫游中理解村庄的自然与人文。",
    "spotIds": ["village_gate", "persimmon_tree", "old_house", "mountain_path", "public_space"]
  }
]
```

---

## 2. 点位数据 spots.json

每个点位建议这样设计：

```json
[
  {
    "id": "old_house",
    "name": "老屋",
    "village": "四坪村",
    "type": "建筑 / 乡愁 / 乡建",
    "image": "/images/old_house.jpg",
    "intro": "这是一栋保留较完整的传统老屋，见证了村庄生活方式的变迁。",
    "storyMaterial": "老屋曾经是几代人共同生活的空间，如今面临修缮、再利用和公共化的可能。它既是村庄记忆的载体，也是乡建实践中重要的空间资源。",
    "details": ["木门", "瓦片", "墙面裂纹", "门口台阶", "屋檐阴影"],
    "tags": ["老屋", "乡愁", "空间更新", "建筑", "乡建"],
    "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
    "defaultTask": "拍下一处你认为最有时间感的细节。",
    "defaultQuestion": "如果这栋老屋重新被使用，你希望它变成什么？"
  }
]
```

---

# 八、用户会话数据结构

不做登录，但要有 sessionId。

用户进入路线后，后端生成一个 session。

```json
{
  "sessionId": "abc123",
  "routeId": "digital_nomad_village_research",
  "routeName": "新村民与乡建观察线",
  "userType": "数字游民",
  "interest": "乡建观察",
  "duration": "45分钟",
  "currentSpotIndex": 0,
  "visitedSpots": [],
  "notes": [
    {
      "spotId": "old_house",
      "spotName": "老屋",
      "note": "这栋老屋让我感觉村庄的过去和未来正在交接。"
    }
  ]
}
```

MVP 阶段可以先存在内存里：

```js
const sessions = {};
```

现场演示足够。

---

# 九、后端 API 设计

## 1. 健康检查接口

```http
GET /api/health
```

返回：

```json
{
  "success": true,
  "message": "Village Agent backend is running"
}
```

---

## 2. 获取路线列表

```http
GET /api/routes
```

作用：前端进入页面时获取两条路线。

返回：

```json
{
  "success": true,
  "data": [
    {
      "id": "digital_nomad_village_research",
      "name": "新村民与乡建观察线",
      "duration": "45分钟",
      "theme": "从乡建、空间更新和新村民创业角度理解村庄"
    },
    {
      "id": "visitor_scenery_humanities",
      "name": "风景与乡愁漫游线",
      "duration": "40分钟",
      "theme": "看风景、听故事、理解乡村人文"
    }
  ]
}
```

---

## 3. 创建体验会话 / 生成路线

```http
POST /api/sessions
```

请求：

```json
{
  "routeType": "digital_nomad",
  "userType": "数字游民",
  "interest": "乡建观察",
  "duration": "45分钟"
}
```

后端逻辑：

```text
1. 根据 routeType 匹配路线
2. 创建 sessionId
3. 返回路线信息和点位列表
```

返回：

```json
{
  "success": true,
  "data": {
    "sessionId": "abc123",
    "route": {
      "id": "digital_nomad_village_research",
      "name": "新村民与乡建观察线",
      "duration": "45分钟",
      "description": "这条路线适合想深入理解乡村变化的人...",
      "spots": [
        {
          "id": "village_gate",
          "name": "村口",
          "intro": "这里是进入村庄的第一站。"
        },
        {
          "id": "old_house",
          "name": "老屋",
          "intro": "这是一栋保留较完整的传统老屋。"
        }
      ]
    }
  }
}
```

---

## 4. 获取点位 AI 内容

```http
GET /api/sessions/:sessionId/spots/:spotId
```

作用：当前端点击某个点位时，后端生成该点位的个性化内容。

返回：

```json
{
  "success": true,
  "data": {
    "spotId": "old_house",
    "spotName": "老屋",
    "image": "/images/old_house.jpg",
    "intro": "这是一栋保留较完整的传统老屋，见证了村庄生活方式的变迁。",
    "aiStory": "你现在站在一栋老屋前。对数字游民来说，它不是一个被遗忘的空间，而是一个值得重新想象的节点...",
    "task": "请观察这栋老屋中最适合被重新使用的一个角落。",
    "photoTip": "尝试拍下门、窗、屋檐或墙面纹理，记录它和当代生活之间的距离。",
    "question": "如果你要在这里发起一个乡村共创项目，你会把它改造成什么？"
  }
}
```

后端逻辑：

```text
1. 根据 sessionId 找到用户身份和路线
2. 根据 spotId 找到点位资料
3. 调用 AI 生成个性化内容
4. 如果 AI 失败，返回默认兜底内容
```

---

## 5. 提交点位记录

```http
POST /api/sessions/:sessionId/notes
```

请求：

```json
{
  "spotId": "old_house",
  "note": "这栋老屋让我感觉村庄的过去和未来正在交接。"
}
```

返回：

```json
{
  "success": true,
  "message": "记录成功"
}
```

---

## 6. 生成最终报告

```http
POST /api/sessions/:sessionId/report
```

作用：用户走完路线后，生成个人报告。

返回：

```json
{
  "success": true,
  "data": {
    "title": "我和四坪村发生的 5 个瞬间",
    "identity": "数字游民",
    "routeName": "新村民与乡建观察线",
    "summary": "今天，你不是简单地参观四坪村，而是从一个数字游民的视角，看见了老屋、公共空间和新村民生活之间的连接...",
    "moments": [
      "在村口，你开始用乡建观察的方式进入村庄。",
      "在老屋前，你看见了空间再利用的可能。",
      "在咖啡屋旁，你感受到新村民生活方式正在形成。"
    ],
    "nextSuggestion": "下次可以尝试风景与乡愁漫游线，从更轻松的游客视角重新打开这个村庄。"
  }
}
```

---

# 十、AI 调用策略

这是后端最重要的部分。

你们不要让 AI 做所有事情。

## 正确策略

```text
路线选择：规则固定
点位资料：真实采集
点位内容：AI 根据资料生成
最终报告：AI 根据用户记录生成
```

这样能保证稳定。

---

## 点位内容生成 Prompt

```text
你是“会走路的村庄”的 AI 实地叙事导览 Agent。

请根据游客身份、路线主题和点位资料，生成该点位的导览内容。

要求：
1. 只能基于提供的点位资料生成，不要编造不存在的历史事实。
2. 语言要有画面感，但不要过度文学化。
3. 内容要适合室内路演展示，也适合未来实地扫码使用。
4. 根据游客身份调整内容重点。
5. 输出 JSON 格式。

游客身份：{{userType}}
游客兴趣：{{interest}}
路线名称：{{routeName}}
路线主题：{{routeTheme}}

点位名称：{{spotName}}
点位介绍：{{spotIntro}}
点位故事素材：{{storyMaterial}}
可观察细节：{{details}}
点位标签：{{tags}}

请输出以下 JSON：
{
  "aiStory": "点位故事，120字以内",
  "task": "一个具体观察任务",
  "photoTip": "一个拍照提示",
  "question": "一个可以引导游客思考或采访的问题"
}
```

---

## 最终报告生成 Prompt

```text
你是“会走路的村庄”的 AI 田野观察报告生成器。

请根据游客路线、经过点位和游客输入，生成一份适合路演展示的个人村庄观察报告。

要求：
1. 不要编造游客没有经历的点位。
2. 必须结合游客输入内容。
3. 语言温暖、清晰、有记忆点。
4. 字数控制在 300 字以内。
5. 输出 JSON 格式。

游客身份：{{userType}}
路线名称：{{routeName}}
路线主题：{{routeTheme}}
经过点位：{{spotNames}}
游客输入：{{notes}}

请输出以下 JSON：
{
  "title": "报告标题",
  "identity": "游客身份",
  "routeName": "路线名称",
  "summary": "整体总结",
  "moments": ["瞬间1", "瞬间2", "瞬间3"],
  "nextSuggestion": "下次推荐"
}
```

---

# 十一、兜底机制一定要做

现场演示最怕 AI 接口失败。

所以你必须做兜底机制。

## 点位内容兜底

如果 AI 调用失败，返回：

```js
{
  aiStory: `${spot.name} 是这条路线中的重要点位。它连接了村庄的空间、记忆和当下生活。`,
  task: spot.defaultTask || "请观察这个点位中最吸引你的一个细节。",
  photoTip: "请拍下一处你觉得最能代表这个地方的画面。",
  question: spot.defaultQuestion || "你想给这个地方留下一句什么话？"
}
```

---

## 报告兜底

如果 AI 调用失败，返回：

```js
{
  title: "我的村庄观察报告",
  summary: "这次体验中，你沿着系统生成的路线，经过了多个村庄点位，并留下了自己的观察和感受。这不是一次普通游览，而是一次你和村庄共同生成的故事。",
  moments: [
    "你选择了一条属于自己的村庄路线。",
    "你在点位中完成了观察和记录。",
    "你为这个村庄留下了一段个人记忆。"
  ],
  nextSuggestion: "下次可以尝试另一条路线，从新的角度重新打开村庄。"
}
```

---

# 十二、MVP 开发优先级

## P0：必须完成

这些必须第一天跑通。

```text
1. 后端服务启动
2. /api/health
3. /api/routes
4. /api/sessions
5. /api/sessions/:sessionId/spots/:spotId
6. /api/sessions/:sessionId/notes
7. /api/sessions/:sessionId/report
8. routes.json
9. spots.json
10. AI 失败兜底
```

---

## P1：有时间再做

```text
1. 二维码生成
2. 简单用户历史记录
3. 报告缓存
4. 本地文件保存用户输入
5. 后台点位管理接口
```

---

## P2：不要在黑客松做

```text
1. 登录注册
2. 权限管理
3. 多村庄后台
4. 复杂地图导航
5. GPS 到点触发
6. 支付系统
7. 完整 SaaS 架构
8. 图片上传与审核
9. WebSocket
10. 复杂推荐算法
```

---

# 十三、第一天后端开发顺序

你从 0 开发，可以按这个顺序来。

## 第一步：初始化项目

```bash
mkdir village-agent-backend
cd village-agent-backend
npm init -y
npm install express cors dotenv uuid
npm install nodemon -D
```

如果要调大模型，再装对应 SDK，或者直接用 `fetch` 调 HTTP API。

---

## 第二步：写基础 server.js

先完成：

```text
Express 服务
cors
json body parser
/api/health
```

目标是先让前端能访问。

---

## 第三步：写 data/routes.json 和 data/spots.json

先不用 AI，先把两条路线和 5 个点位写死。

目标是：

```text
GET /api/routes 能返回路线
POST /api/sessions 能创建体验
```

---

## 第四步：实现 session 逻辑

用内存保存：

```js
const sessions = {};
```

创建 session 时保存：

```text
sessionId
route
userType
interest
duration
notes
```

---

## 第五步：实现点位内容接口

先不接 AI，返回固定内容。

等前端能跑通后，再接 AI。

---

## 第六步：接入 AI

只接两个地方：

```text
1. 点位内容生成
2. 最终报告生成
```

不要让 AI 负责路线选择。

---

## 第七步：加兜底

所有 AI 调用必须 try/catch。

AI 失败时，接口仍然返回成功数据。

---

## 第八步：联调前端

确认前端能完成：

```text
选择路线
查看点位
提交感受
生成报告
```

---

# 十四、后端验收标准

你的后端完成后，至少要满足以下标准：

## 1. 可以启动

```bash
npm run dev
```

## 2. 健康检查正常

```http
GET http://localhost:3000/api/health
```

## 3. 可以返回两条路线

```http
GET http://localhost:3000/api/routes
```

## 4. 可以创建体验会话

```http
POST http://localhost:3000/api/sessions
```

## 5. 可以获取点位内容

```http
GET http://localhost:3000/api/sessions/abc123/spots/old_house
```

## 6. 可以提交用户感受

```http
POST http://localhost:3000/api/sessions/abc123/notes
```

## 7. 可以生成报告

```http
POST http://localhost:3000/api/sessions/abc123/report
```

## 8. AI 挂了也不影响演示

这是最重要的。

---

# 十五、推荐后端整体实现逻辑

整个后端可以理解成：

```text
routes.json 负责“路线骨架”
spots.json 负责“真实村庄内容”
session 负责“用户本次体验”
AI 负责“个性化表达”
report 负责“最终故事闭环”
```

---

# 十六、你们 MVP 的后端边界

你不要试图在后端实现一个很复杂的“真正 Agent”。

黑客松 MVP 里，后端只需要表现出 Agent 感：

```text
根据用户选择理解意图
根据路线组织点位
根据点位资料生成故事
根据用户输入生成总结
```

这已经足够让评委理解：

> 这是一个把真实村庄内容转化为个性化漫游体验的 AI Agent。

---

# 十七、最终推荐方案总结

你这次后端最适合采用：

> **Node.js + Express + JSON 数据 + Session 内存存储 + 大模型生成 + 兜底文案**

后端核心接口只做 6 个：

```text
GET  /api/health
GET  /api/routes
POST /api/sessions
GET  /api/sessions/:sessionId/spots/:spotId
POST /api/sessions/:sessionId/notes
POST /api/sessions/:sessionId/report
```

核心数据只做 2 份：

```text
routes.json：两条路线
spots.json：5～8 个真实点位
```

核心 AI 只接 2 个地方：

```text
点位故事生成
最终报告生成
```

这套方案开发量小、稳定性高、非常适合 2 天黑客松落地。下一步建议直接进入后端项目骨架搭建。
