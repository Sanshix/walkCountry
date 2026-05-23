# 任务：开发"会走路的村庄"后端 MVP，基于腾讯云开发（TCB）

# 备注： 本任务不是实现 README 中的 FastAPI 后端，而是将 README 描述的产品能力迁移为微信小程序可调用的 TCB 云函数后端 MVP。前端调用方式从 REST API 改为 wx.cloud.callFunction，用户身份从普通 session 改为微信 openid。具体实现思路以本文件描述为准。

## 项目概述

基于腾讯云开发（CloudBase / TCB）开发后端云函数，为"会走路的村庄"AI 导览小程序提供 API。使用 TCB 云函数 + 文档型数据库 + 云存储，接入微信登录，支持图片上传。


## 技术栈

- 运行环境：TCB 云函数（Node.js 18+）
- 数据库：TCB 文档型数据库（MongoDB-like）
- 存储：TCB 云存储
- 登录：微信登录（TCB 内置鉴权，通过 wx-server-sdk 获取 openid）
- AI：fetch 调用 OpenAI 兼容 API
- 依赖：wx-server-sdk
- 所有需要 HTTP 请求的云函数必须使用 node-fetch@2


## 目录结构

```
cloudfunctions/
├── getRoutes/
│   ├── index.js
│   └── package.json
├── createSession/
│   ├── index.js
│   └── package.json
├── getSpotContent/
│   ├── index.js
│   └── package.json
├── submitNote/
│   ├── index.js
│   └── package.json
├── generateReport/
│   ├── index.js
│   └── package.json
├── getUploadToken/
│   ├── index.js
│   └── package.json
└── _shared/
    ├── aiService.js
    ├── prompts.js
    └── config.js
```

## 数据库集合设计

### 集合：routes
```json
{
  "_id": "digital_nomad_village_research",
  "name": "新村民与乡建观察线",
  "routeType": "digital_nomad",
  "targetUsers": ["数字游民", "乡建研究者", "青年创业者", "新村民观察者"],
  "duration": "45分钟",
  "theme": "从乡建、空间更新和新村民创业角度理解村庄",
  "description": "这条路线适合想深入理解乡村变化的人。它会带你从村口进入村庄，在老屋、公共空间、民宿和新村民创业点之间，看见传统村落如何被重新使用。",
  "spotIds": ["village_gate", "old_house", "public_space", "cafe", "new_villager_space"]
}
```

第二条路线：
```json
{
  "_id": "visitor_scenery_humanities",
  "name": "风景与乡愁漫游线",
  "routeType": "visitor",
  "targetUsers": ["普通游客", "亲子家庭", "摄影爱好者", "城市白领"],
  "duration": "40分钟",
  "theme": "看风景、听故事、理解乡村人文",
  "description": "这条路线适合第一次来到村庄的游客。它会带你看见村口、植物、老屋、山路和公共空间，在轻松漫游中理解村庄的自然与人文。",
  "spotIds": ["village_gate", "persimmon_tree", "old_house", "mountain_path", "public_space"]
}
```

### 集合：spots
```json
{
  "_id": "village_gate",
  "name": "村口",
  "village": "四坪村",
  "type": "入口 / 标志 / 起点",
  "image": "cloud://xxx/village_gate.jpg",
  "intro": "这里是进入四坪村的第一站。村口的老树和石墙标记着村庄的边界，也是外来者与村庄相遇的起点。",
  "storyMaterial": "四坪村的村口保留着一棵百年老树和一段石砌矮墙。过去，村民从这里出发去赶集、去城里打工；如今，新村民和游客从这里进入村庄，开始一段新的关系。村口既是地理边界，也是心理边界。",
  "details": ["老树根部的青苔", "石墙上的刻痕", "路面从水泥变为石板的交界", "村口的指示牌", "远处可见的屋顶轮廓"],
  "tags": ["村口", "边界", "起点", "老树", "石墙"],
  "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
  "defaultTask": "站在村口，观察从哪个细节开始，你感觉自己'进入'了村庄。",
  "defaultQuestion": "你觉得一个村庄的入口应该给人什么样的感觉？"
}
```

其他点位（old_house, public_space, cafe, new_villager_space, persimmon_tree, mountain_path）同样结构，每个都要有完整的中文内容。

**old_house（老屋）**：type "建筑 / 乡愁 / 乡建"，storyMaterial 描述传统民居的木结构、曾经的多代同堂生活、如今的修缮与再利用可能。

**public_space（公共空间）**：type "社区 / 共创 / 乡建"，storyMaterial 描述由旧建筑改造的公共客厅/图书室，新老村民共同使用的场所。

**cafe（咖啡屋）**：type "新业态 / 生活方式 / 创业"，storyMaterial 描述新村民开设的咖啡馆，连接城市生活方式与乡村空间。

**new_villager_space（新村民创业点）**：type "创业 / 农业 / 新村民"，storyMaterial 描述返乡青年或外来创业者的工作空间/农场。

**persimmon_tree（柿子树）**：type "植物 / 季节 / 风景"，storyMaterial 描述村中标志性的柿子树，秋天挂满果实，是村庄时间感的象征。

**mountain_path（山路）**：type "自然 / 步道 / 风景"，storyMaterial 描述连接村庄与山林的步道，可以看到远山和梯田。

### 集合：sessions
```json
{
  "_id": "自动生成",
  "openid": "微信用户openid",
  "routeId": "digital_nomad_village_research",
  "routeName": "新村民与乡建观察线",
  "routeTheme": "从乡建、空间更新和新村民创业角度理解村庄",
  "userType": "数字游民",
  "interest": "乡建观察",
  "duration": "45分钟",
  "currentSpotIndex": 0,
  "visitedSpots": [],
  "notes": [],
  "createdAt": "时间戳",
  "status": "active"
}
```

### 集合：notes（独立存储，方便查询）
```json
{
  "_id": "自动生成",
  "sessionId": "session的_id",
  "openid": "微信用户openid",
  "spotId": "old_house",
  "spotName": "老屋",
  "note": "这栋老屋让我感觉村庄的过去和未来正在交接。",
  "images": ["cloud://xxx/photo1.jpg", "cloud://xxx/photo2.jpg"],
  "createdAt": "时间戳"
}
```

## 云函数实现

### 通用模式

每个云函数的基本结构：
```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  // 业务逻辑
};
```

### 1. getRoutes
触发：前端调用
逻辑：从 routes 集合查询所有路线，返回列表
返回：`{ success: true, data: [路线列表] }`

### 2. createSession
触发：用户选择路线后调用
入参：`{ routeType, userType, interest, duration }`
逻辑：
1. 通过 OPENID 获取用户身份
2. 根据 routeType 从 routes 集合查询匹配路线（routeType 字段匹配）
3. 根据路线的 spotIds 从 spots 集合批量查询点位基本信息（id, name, intro, image）
4. 创建 session 文档写入 sessions 集合
5. 返回 sessionId、路线信息、点位列表

返回：
```json
{
  "success": true,
  "data": {
    "sessionId": "xxx",
    "route": { "id": "", "name": "", "duration": "", "description": "" },
    "spots": [{ "id": "", "name": "", "intro": "", "image": "" }]
  }
}
```

### 3. getSpotContent
入参：`{ sessionId, spotId }`
逻辑：
1. 从 sessions 集合查询 session，验证 openid 匹配
2. 从 spots 集合查询点位完整资料
3. 调用 AI 生成个性化内容（传入 userType, interest, routeName, routeTheme, 点位资料）
4. AI 失败时返回兜底内容
5. 更新 session 的 visitedSpots（如果该 spotId 不在列表中则添加）

返回：
```json
{
  "success": true,
  "data": {
    "spotId": "",
    "spotName": "",
    "image": "",
    "intro": "",
    "aiStory": "",
    "task": "",
    "photoTip": "",
    "question": ""
  }
}
```

### 4. submitNote
入参：`{ sessionId, spotId, note, images }`
images 是云存储 fileID 数组（图片由前端直接上传到云存储，这里只存 fileID）
逻辑：
1. 验证 session 存在且 openid 匹配
2. 从 spots 集合获取 spotName
3. 写入 notes 集合
4. 同时更新 session.notes 数组（push { spotId, spotName, note, images }）

返回：`{ success: true, message: "记录成功" }`

### 5. generateReport
入参：`{ sessionId }`
逻辑：
1. 查询 session，获取用户信息和路线信息
2. 查询该 session 的所有 notes
3. 调用 AI 生成报告
4. AI 失败时返回兜底报告
5. 将报告存入 session 文档的 report 字段

返回：
```json
{
  "success": true,
  "data": {
    "title": "",
    "identity": "",
    "routeName": "",
    "summary": "",
    "moments": [],
    "nextSuggestion": ""
  }
}
```

### 6. getUploadToken（可选，如果前端直传不够用）
实际上 TCB 小程序端可以直接用 `wx.cloud.uploadFile` 上传，不需要额外的 token 接口。此函数可以不实现，前端直接上传即可。

## AI 调用（_shared/aiService.js）

```js
const config = require('./config');

async function callAI(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(`${config.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

module.exports = { callAI };
```

### _shared/config.js
```js
module.exports = {
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini'
};
```

环境变量在 TCB 云函数配置中设置。

## Prompt 模板（_shared/prompts.js）

### generateSpotPrompt({ userType, interest, routeName, routeTheme, spotName, spotIntro, storyMaterial, details, tags })

```
你是"会走路的村庄"的 AI 实地叙事导览 Agent。

请根据游客身份、路线主题和点位资料，生成该点位的导览内容。

要求：
1. 只能基于提供的点位资料生成，不要编造不存在的历史事实。
2. 语言要有画面感，但不要过度文学化。
3. 根据游客身份调整内容重点。
4. 输出 JSON 格式。

游客身份：${userType}
游客兴趣：${interest}
路线名称：${routeName}
路线主题：${routeTheme}

点位名称：${spotName}
点位介绍：${spotIntro}
点位故事素材：${storyMaterial}
可观察细节：${details.join('、')}
点位标签：${tags.join('、')}

请输出以下 JSON：
{
  "aiStory": "点位故事，120字以内",
  "task": "一个具体观察任务",
  "photoTip": "一个拍照提示",
  "question": "一个可以引导游客思考的问题"
}
```

### generateReportPrompt({ userType, routeName, routeTheme, spotNames, notes })

```
你是"会走路的村庄"的 AI 田野观察报告生成器。

请根据游客路线、经过点位和游客输入，生成一份个人村庄观察报告。

要求：
1. 不要编造游客没有经历的点位。
2. 必须结合游客输入内容。
3. 语言温暖、清晰、有记忆点。
4. 字数控制在 300 字以内。
5. 输出 JSON 格式。

游客身份：${userType}
路线名称：${routeName}
路线主题：${routeTheme}
经过点位：${spotNames.join('、')}
游客输入：${JSON.stringify(notes)}

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

## 兜底机制（关键）

每个调用 AI 的云函数必须 try/catch：

点位兜底：
```js
const fallback = {
  aiStory: `${spot.name}是这条路线中的重要点位。它连接了村庄的空间、记忆和当下生活。`,
  task: spot.defaultTask || "请观察这个点位中最吸引你的一个细节。",
  photoTip: "请拍下一处你觉得最能代表这个地方的画面。",
  question: spot.defaultQuestion || "你想给这个地方留下一句什么话？"
};
```

报告兜底：
```js
const fallback = {
  title: "我的村庄观察报告",
  identity: session.userType,
  routeName: session.routeName,
  summary: "这次体验中，你沿着路线经过了多个村庄点位，并留下了自己的观察和感受。这不是一次普通游览，而是一次你和村庄共同生成的故事。",
  moments: ["你选择了一条属于自己的村庄路线。", "你在点位中完成了观察和记录。", "你为这个村庄留下了一段个人记忆。"],
  nextSuggestion: "下次可以尝试另一条路线，从新的角度重新打开村庄。"
};
```

## 数据库初始化脚本

创建一个 initData 云函数（或本地脚本），用于首次部署时向 routes 和 spots 集合写入初始数据。包含完整的两条路线和 7 个点位数据。

## 图片上传说明

前端小程序直接使用 `wx.cloud.uploadFile` 上传图片到云存储，获得 fileID 后传给 submitNote 云函数。后端不需要处理上传逻辑，只需存储和返回 fileID。

## 注意事项

1. 每个云函数是独立部署的，_shared 目录的文件需要在每个用到的云函数中复制一份，或者使用 TCB 的层（layer）功能。实际开发中，建议在每个云函数的 package.json 同级放置需要的共享文件。
2. wx-server-sdk 的 cloud.init() 必须在每个云函数入口调用。
3. 数据库操作使用 TCB 的 SDK：db.collection('xxx').doc('id').get() / .add() / .update()
4. 云函数环境变量在腾讯云控制台 > 云开发 > 云函数 > 对应函数 > 配置中设置 AI_BASE_URL、AI_API_KEY、AI_MODEL。

## 验收标准

1. 所有云函数代码完整，可直接部署
2. initData 函数包含完整的初始数据
3. 每个云函数独立可运行，依赖声明完整
4. AI 未配置时所有接口仍返回兜底内容
5. 数据库操作正确使用 TCB SDK 语法
6. 微信登录通过 cloud.getWXContext() 获取 openid，所有写操作验证 openid

～～～～～～～～～～～～～～

## Codex 开发补充要求

本任务是将 README 中的产品能力迁移为微信小程序可调用的 TCB 云函数后端 MVP，不实现 README 中的 FastAPI 后端。

### 实现范围

必须实现以下云函数：

1. getRoutes
2. createSession
3. getSpotContent
4. submitNote
5. generateReport
6. initData

不实现 getUploadToken。图片上传由前端使用 wx.cloud.uploadFile 完成。

### 运行环境

- Node 运行环境基于 Node.js 18 LTS
- 使用 CommonJS
- 使用 wx-server-sdk
- 每个云函数必须有自己的 package.json
- 不使用 TCB layer；共享文件直接复制到需要的云函数目录中

### 返回格式

所有云函数必须返回统一格式：

成功：

{
  "success": true,
  "data": {}
}

失败：

{
  "success": false,
  "errorCode": "INVALID_PARAMS",
  "message": "错误说明"
}

AI 失败但使用兜底内容时，仍返回 success: true，并增加：

{
  "meta": {
    "fallback": true
  }
}

### 权限要求

- getRoutes 可不校验 openid
- createSession 必须使用 cloud.getWXContext() 获取 OPENID
- getSpotContent、submitNote、generateReport 必须验证 session.openid === OPENID
- 用户不能访问或修改其他 openid 的 session 和 notes

### 数据库要求

- initData 必须幂等，多次执行不会重复插入数据
- routes 至少包含 2 条 MVP 路线
- spots 必须包含 7 个完整点位：
  - village_gate
  - old_house
  - public_space
  - cafe
  - new_villager_space
  - persimmon_tree
  - mountain_path

### createSession 路线匹配规则

1. 如果传入 routeType，优先用 routeType 匹配 routes.routeType
2. 如果未匹配，则用 userType 命中 routes.targetUsers
3. 如果仍未匹配，则默认使用 visitor_scenery_humanities
4. 查询 spots 后必须按照 route.spotIds 的顺序重新排序

### 参数校验

- sessionId、spotId 必须为非空字符串
- note 最长 500 字
- images 必须是数组，最多 9 张
- images 中每一项必须是 cloud:// 开头的 fileID
- userType、interest、duration 缺失时使用空字符串或默认值

### AI 要求

- AI_API_KEY 为空时，不调用 AI，直接走兜底
- AI 请求超时时间 5 秒
- AI 返回必须解析为 JSON
- JSON.parse 失败时必须走兜底
- 不允许因为 AI 失败导致接口失败

## MVP文档中只是写了2条路线作为示例，实际路线数根据数据情况而变化

### 验收方式

Codex 完成后必须输出：

1. 完整目录结构
2. 每个云函数的 index.js
3. 每个云函数的 package.json
4. initData 的完整 2 条 routes 和 7 个 spots 数据
5. 本地/TCB 部署说明
6. 每个云函数的调用示例参数和示例返回