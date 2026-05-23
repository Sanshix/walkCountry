# Codex 任务书：开发「会走路的村庄」后端 MVP（腾讯云开发 TCB）

## 后端开发内容统一在文件夹“cloudfunctions“内

## 0. 任务定位

本任务不是实现 README 中的 FastAPI 后端，而是将 README 描述的产品能力迁移为微信小程序可调用的腾讯云开发 CloudBase / TCB 云函数后端 MVP。

前端调用方式从 REST API 改为 `wx.cloud.callFunction`。用户身份从普通 session 改为微信 openid。所有具体实现以本文档为准。

## 1. 项目目标

为「会走路的村庄」AI 导览小程序开发后端 MVP，支持：

1. 获取村庄漫游路线
2. 根据用户身份、兴趣、时间创建体验会话
3. 获取点位的 AI 个性化导览内容
4. 保存用户在点位的文字与图片记录
5. 根据用户路线和记录生成最终观察报告
6. 初始化 routes 和 spots 基础数据

本 MVP 使用：

- TCB 云函数
- TCB 文档型数据库
- TCB 云存储 fileID
- 微信 openid 鉴权
- OpenAI 兼容 API 生成内容
- AI 失败时必须走兜底内容，不允许影响主流程

## 2. 技术栈与硬性约束

### 2.1 运行环境

- 云函数运行环境：Node.js 18 LTS
- 模块系统：CommonJS
- 云开发 SDK：`wx-server-sdk`
- HTTP 请求：使用 Node.js 18 内置 `fetch`
- 不使用 `node-fetch`
- 不使用 TCB layer
- 每个云函数必须独立部署
- 每个云函数必须有自己的 `package.json`
- 需要 AI 能力的云函数必须复制共享文件到函数目录内

### 2.2 依赖要求

每个云函数的 `package.json` 至少包含：

```json
{
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

不得引入 Express、FastAPI、Koa、Hono 或任何 HTTP Server 框架。

## 3. 目录结构

请生成以下目录结构：

```text
cloudfunctions/
├── getRoutes/
│   ├── index.js
│   └── package.json
├── createSession/
│   ├── index.js
│   └── package.json
├── getSpotContent/
│   ├── index.js
│   ├── aiService.js
│   ├── prompts.js
│   ├── config.js
│   └── package.json
├── submitNote/
│   ├── index.js
│   └── package.json
├── generateReport/
│   ├── index.js
│   ├── aiService.js
│   ├── prompts.js
│   ├── config.js
│   └── package.json
└── initData/
    ├── index.js
    └── package.json
```

不实现 `getUploadToken`。图片上传由小程序前端直接使用 `wx.cloud.uploadFile` 完成，后端只接收并保存 `cloud://` fileID。

## 4. 通用云函数结构

每个云函数入口必须使用以下模式：

```js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  // business logic
};
```

## 5. 统一返回格式

所有云函数必须使用统一返回格式。

### 5.1 成功返回

```json
{
  "success": true,
  "data": {}
}
```

### 5.2 失败返回

```json
{
  "success": false,
  "errorCode": "INVALID_PARAMS",
  "message": "错误说明"
}
```

### 5.3 AI 失败但使用兜底内容

AI 失败不算接口失败。此时仍然返回 `success: true`，并附加 `meta.fallback = true`。

```json
{
  "success": true,
  "data": {},
  "meta": {
    "fallback": true
  }
}
```

## 6. 错误码规范

至少实现以下错误码：

```text
INVALID_PARAMS          参数错误
UNAUTHORIZED            未获得 openid 或无权限访问
ROUTE_NOT_FOUND         路线不存在
SPOT_NOT_FOUND          点位不存在
SESSION_NOT_FOUND       会话不存在或不属于当前用户
DB_ERROR                数据库操作失败
INTERNAL_ERROR          未预期错误
```

AI 失败不返回错误码，直接走兜底。

## 7. 数据库集合设计

### 7.1 routes 集合

字段结构：

```json
{
  "_id": "digital_nomad_village_research",
  "name": "新村民与乡建观察线",
  "routeType": "digital_nomad",
  "targetUsers": ["数字游民", "乡建研究者", "青年创业者", "新村民观察者"],
  "duration": "45分钟",
  "theme": "从乡建、空间更新和新村民创业角度理解村庄",
  "description": "这条路线适合想深入理解乡村变化的人。它会带你从村口进入村庄，在老屋、公共空间、民宿和新村民创业点之间，看见传统村落如何被重新使用。",
  "spotIds": ["village_gate", "old_house", "public_space", "cafe", "new_villager_space"],
  "createdAt": "serverDate",
  "updatedAt": "serverDate"
}
```

### 7.2 spots 集合

字段结构：

```json
{
  "_id": "village_gate",
  "name": "村口",
  "village": "四坪村",
  "type": "入口 / 标志 / 起点",
  "image": "cloud://xxx/village_gate.jpg",
  "intro": "这里是进入四坪村的第一站。村口的老树和石墙标记着村庄的边界，也是外来者与村庄相遇的起点。",
  "storyMaterial": "四坪村的村口保留着一棵百年老树和一段石砌矮墙。过去，村民从这里出发去赶集、去城里打工；如今，新村民和游客从这里进入村庄，开始一段新的关系。村口既是地理边界，也是心理边界。",
  "details": ["老树根部的青苔", "石墙上的刻痕"],
  "tags": ["村口", "边界", "起点"],
  "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
  "defaultTask": "站在村口，观察从哪个细节开始，你感觉自己'进入'了村庄。",
  "defaultQuestion": "你觉得一个村庄的入口应该给人什么样的感觉？",
  "createdAt": "serverDate",
  "updatedAt": "serverDate"
}
```

### 7.3 sessions 集合

字段结构：

```json
{
  "_id": "自动生成",
  "openid": "微信用户 openid",
  "routeId": "digital_nomad_village_research",
  "routeType": "digital_nomad",
  "routeName": "新村民与乡建观察线",
  "routeTheme": "从乡建、空间更新和新村民创业角度理解村庄",
  "routeSpotIds": ["village_gate", "old_house", "public_space", "cafe", "new_villager_space"],
  "userType": "数字游民",
  "interest": "乡建观察",
  "duration": "45分钟",
  "currentSpotIndex": 0,
  "visitedSpots": [],
  "notes": [],
  "report": null,
  "createdAt": "serverDate",
  "updatedAt": "serverDate",
  "status": "active"
}
```

说明：

- `routeSpotIds` 必须在创建 session 时写入，便于后续判断点位顺序。
- `notes` 只保存摘要，不作为主数据源。
- 用户记录的主数据存储在 `notes` 集合。

### 7.4 notes 集合

字段结构：

```json
{
  "_id": "自动生成",
  "sessionId": "session 的 _id",
  "openid": "微信用户 openid",
  "spotId": "old_house",
  "spotName": "老屋",
  "note": "这栋老屋让我感觉村庄的过去和未来正在交接。",
  "images": ["cloud://xxx/photo1.jpg", "cloud://xxx/photo2.jpg"],
  "createdAt": "serverDate"
}
```

## 8. 初始化数据要求

必须实现 `initData` 云函数。

### 8.1 initData 目标

- 写入 MVP 默认 routes 和 spots 数据
- 必须幂等
- 多次执行不会重复插入数据
- 如果同 `_id` 数据已存在，则执行 update / set 覆盖更新
- 至少包含 2 条 routes 和 7 个 spots

### 8.2 routes 初始数据

#### 路线 1：新村民与乡建观察线

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

#### 路线 2：风景与乡愁漫游线

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

说明：MVP 文档中只写 2 条路线作为默认初始数据，实际路线数量应根据数据库数据变化而变化。接口实现不得写死只有 2 条路线。

### 8.3 spots 初始数据

必须写入以下 7 个点位。`image` 字段可以先使用占位 fileID，例如 `cloud://placeholder.xxx/spot.jpg`，但字段必须存在。

#### village_gate：村口

```json
{
  "_id": "village_gate",
  "name": "村口",
  "village": "四坪村",
  "type": "入口 / 标志 / 起点",
  "image": "cloud://placeholder/village_gate.jpg",
  "intro": "这里是进入四坪村的第一站。村口的老树和石墙标记着村庄的边界，也是外来者与村庄相遇的起点。",
  "storyMaterial": "四坪村的村口保留着一棵百年老树和一段石砌矮墙。过去，村民从这里出发去赶集、去城里打工；如今，新村民和游客从这里进入村庄，开始一段新的关系。村口既是地理边界，也是心理边界。",
  "details": ["老树根部的青苔", "石墙上的刻痕", "路面从水泥变为石板的交界", "村口的指示牌", "远处可见的屋顶轮廓"],
  "tags": ["村口", "边界", "起点", "老树", "石墙"],
  "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
  "defaultTask": "站在村口，观察从哪个细节开始，你感觉自己'进入'了村庄。",
  "defaultQuestion": "你觉得一个村庄的入口应该给人什么样的感觉？"
}
```

#### old_house：老屋

```json
{
  "_id": "old_house",
  "name": "老屋",
  "village": "四坪村",
  "type": "建筑 / 乡愁 / 乡建",
  "image": "cloud://placeholder/old_house.jpg",
  "intro": "老屋是村庄记忆最集中的地方。木梁、瓦片、门槛和墙面都保存着几代人生活过的痕迹。",
  "storyMaterial": "四坪村的老屋多为传统民居，木结构、青瓦和厚墙构成了稳定的生活空间。过去，一栋老屋里常常住着几代人，堂屋、灶间和院落承载着日常劳作、节庆团聚和邻里往来。如今，一些老屋正在被重新修缮，也可能被改造为民宿、展厅、公共空间或青年驻留空间。老屋不只是怀旧对象，也是乡村更新的重要入口。",
  "details": ["木梁上的纹理", "老门槛的磨损", "瓦片的层次", "墙面修补的痕迹", "院落里留下的生活器物"],
  "tags": ["老屋", "建筑", "乡愁", "修缮", "再利用"],
  "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
  "defaultTask": "找一处老屋中最能体现时间痕迹的细节，并想象它曾经属于怎样的日常生活。",
  "defaultQuestion": "你觉得老屋被重新使用时，最应该保留下来的是什么？"
}
```

#### public_space：公共空间

```json
{
  "_id": "public_space",
  "name": "公共空间",
  "village": "四坪村",
  "type": "社区 / 共创 / 乡建",
  "image": "cloud://placeholder/public_space.jpg",
  "intro": "这里是村庄中的公共客厅，既是新老村民相遇的地方，也是游客理解村庄当下生活的窗口。",
  "storyMaterial": "这个公共空间由旧建筑改造而来，可能是公共客厅、图书室、活动室或小型展厅。它不只服务游客，也服务村民的日常交流。老人可以在这里聊天，孩子可以阅读，新村民可以组织分享会，外来访客也可以通过这里认识村庄。公共空间让乡建不再只是建筑更新，而是人与人关系的重新连接。",
  "details": ["公共桌椅的摆放", "墙上的活动海报", "书架上的书", "旧建筑保留下来的结构", "村民和游客共同使用的痕迹"],
  "tags": ["公共空间", "社区", "共创", "图书室", "公共客厅"],
  "suitableRoutes": ["digital_nomad_village_research", "visitor_scenery_humanities"],
  "defaultTask": "观察这个空间中有哪些设计是在邀请人停下来交流。",
  "defaultQuestion": "一个村庄为什么需要公共空间？它和城市里的咖啡馆或社区中心有什么不同？"
}
```

#### cafe：咖啡屋

```json
{
  "_id": "cafe",
  "name": "咖啡屋",
  "village": "四坪村",
  "type": "新业态 / 生活方式 / 创业",
  "image": "cloud://placeholder/cafe.jpg",
  "intro": "咖啡屋是新生活方式进入村庄后的一个小小窗口。它连接了城市经验、乡村空间和新的创业想象。",
  "storyMaterial": "这间咖啡屋由新村民或返乡青年经营。它把城市里的咖啡、阅读、远程办公和社交活动带入村庄，也让游客在停留中重新感受乡村空间。咖啡屋不是简单复制城市消费，而是在老房子、田野、山景和村民生活之间寻找新的平衡。它代表一种新的乡村业态：既面向外来者，也尝试与本地生活发生关系。",
  "details": ["窗外的村庄景色", "吧台与老建筑的关系", "菜单中的本地元素", "座位如何面向街巷或山景", "游客和村民是否共同使用空间"],
  "tags": ["咖啡", "新业态", "生活方式", "创业", "新村民"],
  "suitableRoutes": ["digital_nomad_village_research"],
  "defaultTask": "观察咖啡屋中有哪些元素来自城市，又有哪些元素属于村庄。",
  "defaultQuestion": "你觉得一家乡村咖啡屋应该更像城市咖啡馆，还是更像村庄的一部分？"
}
```

#### new_villager_space：新村民创业点

```json
{
  "_id": "new_villager_space",
  "name": "新村民创业点",
  "village": "四坪村",
  "type": "创业 / 农业 / 新村民",
  "image": "cloud://placeholder/new_villager_space.jpg",
  "intro": "这里展示了新村民进入乡村后的工作方式：有人做农业，有人做内容，有人做空间，也有人重新组织人与土地的关系。",
  "storyMaterial": "新村民创业点可能是一处工作室、小农场、共创空间或农产品实验点。返乡青年或外来创业者在这里尝试把设计、互联网、农业、教育和文旅结合起来。他们既带来新的工具和资源，也需要学习村庄原有的节奏、土地经验和人情关系。这个点位能让游客看到，乡村振兴并不只是风景变美，也包括新的职业、新的协作和新的生活选择。",
  "details": ["工作空间的布置", "农具和现代设备的并置", "产品包装或展示", "人与土地的连接方式", "新老村民合作的痕迹"],
  "tags": ["新村民", "创业", "农业", "返乡青年", "乡村振兴"],
  "suitableRoutes": ["digital_nomad_village_research"],
  "defaultTask": "观察这里的创业实践解决了村庄里的什么问题，或者创造了什么新的可能。",
  "defaultQuestion": "如果你在村庄里工作一个月，你最想尝试做什么？"
}
```

#### persimmon_tree：柿子树

```json
{
  "_id": "persimmon_tree",
  "name": "柿子树",
  "village": "四坪村",
  "type": "植物 / 季节 / 风景",
  "image": "cloud://placeholder/persimmon_tree.jpg",
  "intro": "柿子树是村庄季节感最鲜明的标志之一。秋天果实挂满枝头时，它会成为村里最容易被记住的风景。",
  "storyMaterial": "村中的柿子树陪伴着村民经历一年四季。春天发芽，夏天成荫，秋天果实变红，冬天枝干安静地站在屋旁或路边。对游客来说，柿子树是一处风景；对村民来说，它可能关联着采摘、晾晒、分享和童年记忆。它提醒人们，村庄的时间不是只由日历决定，也由植物、天气和农事慢慢标记。",
  "details": ["树干的纹理", "果实的颜色", "树影落在墙面的位置", "树与老屋的关系", "地上落叶或果实的痕迹"],
  "tags": ["柿子树", "季节", "植物", "乡愁", "风景"],
  "suitableRoutes": ["visitor_scenery_humanities"],
  "defaultTask": "围绕柿子树观察三种颜色，并记录它们分别让你想到什么季节。",
  "defaultQuestion": "你记忆中的乡村，是由哪一种植物或味道唤起的？"
}
```

#### mountain_path：山路

```json
{
  "_id": "mountain_path",
  "name": "山路",
  "village": "四坪村",
  "type": "自然 / 步道 / 风景",
  "image": "cloud://placeholder/mountain_path.jpg",
  "intro": "这条山路连接着村庄、山林和远处的梯田。沿着它行走，可以看到村庄与自然环境之间的关系。",
  "storyMaterial": "山路曾是村民进山、劳作、采集和连接外部道路的重要路径。它可能不宽，也并不总是平整，但承载着村庄和山林之间长期的往来。沿路可以看到远山、竹林、梯田、石阶和被踩出的泥土痕迹。对游客来说，山路是一段风景；对村庄来说，它是生活半径的一部分，也是理解土地、体力和时间的线索。",
  "details": ["路面的材质变化", "石阶或泥土的磨损", "远处山形", "梯田线条", "路边植物"],
  "tags": ["山路", "自然", "步道", "远山", "梯田"],
  "suitableRoutes": ["visitor_scenery_humanities"],
  "defaultTask": "在山路上停下来，观察一处能体现‘人走出来的路’的痕迹。",
  "defaultQuestion": "当你步行进入山林时，你对村庄的感受发生了什么变化？"
}
```

## 9. 云函数实现要求

## 9.1 getRoutes

### 功能

查询所有路线，返回路线列表。

### 入参

无必填参数。

### 权限

不需要校验 openid。

### 逻辑

1. 查询 `routes` 集合全部路线。
2. 按 `createdAt` 或默认顺序返回。
3. 返回路线基础信息。

### 成功返回

```json
{
  "success": true,
  "data": [
    {
      "id": "digital_nomad_village_research",
      "name": "新村民与乡建观察线",
      "routeType": "digital_nomad",
      "targetUsers": ["数字游民", "乡建研究者"],
      "duration": "45分钟",
      "theme": "从乡建、空间更新和新村民创业角度理解村庄",
      "description": "...",
      "spotIds": ["village_gate", "old_house"]
    }
  ]
}
```

## 9.2 createSession

### 功能

根据用户身份、兴趣、时间和可选 `routeType` 创建一次导览 session。

### 入参

```json
{
  "routeType": "digital_nomad",
  "userType": "数字游民",
  "interest": "乡建观察",
  "duration": "45分钟"
}
```

### 参数规则

- `routeType` 可选。
- `userType` 可选，缺失时使用空字符串。
- `interest` 可选，缺失时使用空字符串。
- `duration` 可选，缺失时使用路线默认 duration。

### 权限

必须通过 `cloud.getWXContext()` 获取 `OPENID`。如果无法获取，返回 `UNAUTHORIZED`。

### 路线匹配规则

1. 如果传入 `routeType`，优先用 `routes.routeType` 精确匹配。
2. 如果未匹配到路线，则用 `userType` 匹配 `routes.targetUsers`。
3. 如果仍未匹配，则默认使用 `_id = visitor_scenery_humanities` 的路线。
4. 如果默认路线也不存在，返回 `ROUTE_NOT_FOUND`。

### spots 查询要求

根据 `route.spotIds` 批量查询 spots 后，必须按照 `route.spotIds` 的顺序重新排序。

示例逻辑：

```js
const spotMap = {};
spotRes.data.forEach(spot => {
  spotMap[spot._id] = spot;
});

const orderedSpots = route.spotIds
  .map(id => spotMap[id])
  .filter(Boolean);
```

### session 写入要求

创建 `sessions` 文档，字段包括：

- openid
- routeId
- routeType
- routeName
- routeTheme
- routeSpotIds
- userType
- interest
- duration
- currentSpotIndex: 0
- visitedSpots: []
- notes: []
- report: null
- status: active
- createdAt: db.serverDate()
- updatedAt: db.serverDate()

### 成功返回

```json
{
  "success": true,
  "data": {
    "sessionId": "xxx",
    "route": {
      "id": "digital_nomad_village_research",
      "name": "新村民与乡建观察线",
      "routeType": "digital_nomad",
      "duration": "45分钟",
      "theme": "从乡建、空间更新和新村民创业角度理解村庄",
      "description": "..."
    },
    "spots": [
      {
        "id": "village_gate",
        "name": "村口",
        "intro": "...",
        "image": "cloud://placeholder/village_gate.jpg"
      }
    ]
  }
}
```

## 9.3 getSpotContent

### 功能

获取某个 session 下某个点位的导览内容，包括静态资料和 AI 个性化内容。

### 入参

```json
{
  "sessionId": "xxx",
  "spotId": "old_house"
}
```

### 参数校验

- `sessionId` 必须是非空字符串。
- `spotId` 必须是非空字符串。

### 权限

1. 获取当前 `OPENID`。
2. 查询 session。
3. 验证 `session.openid === OPENID`。
4. 如果不匹配，返回 `SESSION_NOT_FOUND` 或 `UNAUTHORIZED`。

### 逻辑

1. 查询 session。
2. 查询 spot 完整资料。
3. 确认 `spotId` 属于 `session.routeSpotIds`。
4. 使用 prompt 调用 AI 生成：
   - aiStory
   - task
   - photoTip
   - question
5. AI 失败时使用兜底内容。
6. 更新 session：
   - `visitedSpots` 使用 `_.addToSet(spotId)`。
   - 根据 `session.routeSpotIds.indexOf(spotId)` 更新 `currentSpotIndex`。
   - `updatedAt` 更新为 `db.serverDate()`。

### currentSpotIndex 更新规则

```js
const spotIndex = session.routeSpotIds.indexOf(spotId);
const nextIndex = Math.max(session.currentSpotIndex || 0, spotIndex);
```

如果 `spotIndex >= 0`，更新 `currentSpotIndex = nextIndex`。

### 兜底内容

```js
const fallback = {
  aiStory: `${spot.name}是这条路线中的重要点位。它连接了村庄的空间、记忆和当下生活。`,
  task: spot.defaultTask || '请观察这个点位中最吸引你的一个细节。',
  photoTip: '请拍下一处你觉得最能代表这个地方的画面。',
  question: spot.defaultQuestion || '你想给这个地方留下一句什么话？'
};
```

### 成功返回

```json
{
  "success": true,
  "data": {
    "spotId": "old_house",
    "spotName": "老屋",
    "image": "cloud://placeholder/old_house.jpg",
    "intro": "...",
    "aiStory": "...",
    "task": "...",
    "photoTip": "...",
    "question": "..."
  },
  "meta": {
    "fallback": false
  }
}
```

## 9.4 submitNote

### 功能

保存用户在某个点位提交的文字记录和图片 fileID。

### 入参

```json
{
  "sessionId": "xxx",
  "spotId": "old_house",
  "note": "这栋老屋让我感觉村庄的过去和未来正在交接。",
  "images": ["cloud://xxx/photo1.jpg", "cloud://xxx/photo2.jpg"]
}
```

### 参数校验

- `sessionId` 必须是非空字符串。
- `spotId` 必须是非空字符串。
- `note` 必须是字符串。
- `note` 最长 500 字。
- `images` 可选，缺失时默认为空数组。
- `images` 必须是数组。
- `images` 最多 9 张。
- `images` 每一项必须是以 `cloud://` 开头的字符串。

### 权限

1. 获取当前 `OPENID`。
2. 查询 session。
3. 验证 `session.openid === OPENID`。

### 逻辑

1. 校验参数。
2. 查询 session 并校验权限。
3. 确认 `spotId` 属于 `session.routeSpotIds`。
4. 查询 spot，获取 `spotName`。
5. 写入 `notes` 集合。
6. 使用 `_.push` 更新 `sessions.notes` 摘要数组。
7. 使用 `_.addToSet` 更新 `visitedSpots`。
8. 更新 `updatedAt`。

### session.notes 摘要结构

```json
{
  "noteId": "xxx",
  "spotId": "old_house",
  "spotName": "老屋",
  "note": "这栋老屋让我感觉村庄的过去和未来正在交接。",
  "images": ["cloud://xxx/photo1.jpg"],
  "createdAt": "client ISO string or serverDate"
}
```

说明：主数据以 `notes` 集合为准，`session.notes` 仅用于快速预览。

### 成功返回

```json
{
  "success": true,
  "data": {
    "noteId": "xxx",
    "message": "记录成功"
  }
}
```

## 9.5 generateReport

### 功能

根据 session 路线、已访问点位和用户 notes 生成最终观察报告。

### 入参

```json
{
  "sessionId": "xxx"
}
```

### 参数校验

- `sessionId` 必须是非空字符串。

### 权限

1. 获取当前 `OPENID`。
2. 查询 session。
3. 验证 `session.openid === OPENID`。

### 逻辑

1. 查询 session。
2. 查询该 session 下所有 notes，必须加上 `openid` 条件：

```js
db.collection('notes').where({
  sessionId,
  openid: OPENID
}).get()
```

3. 根据 `session.visitedSpots` 或 notes 中的 spotId 查询点位名称。
4. 如果 notes 为空，不调用 AI，直接返回兜底报告。
5. 如果 notes 不为空，调用 AI 生成报告。
6. AI 失败时返回兜底报告。
7. 将 report 写入 session.report。
8. 更新 session.updatedAt。

### 报告字段

```json
{
  "title": "报告标题",
  "identity": "游客身份",
  "routeName": "路线名称",
  "summary": "整体总结",
  "moments": ["瞬间1", "瞬间2", "瞬间3"],
  "nextSuggestion": "下次推荐"
}
```

### 兜底报告

```js
const fallback = {
  title: '我的村庄观察报告',
  identity: session.userType || '村庄漫游者',
  routeName: session.routeName,
  summary: '这次体验中，你沿着路线经过了多个村庄点位，并留下了自己的观察和感受。这不是一次普通游览，而是一次你和村庄共同生成的故事。',
  moments: [
    '你选择了一条属于自己的村庄路线。',
    '你在点位中完成了观察和记录。',
    '你为这个村庄留下了一段个人记忆。'
  ],
  nextSuggestion: '下次可以尝试另一条路线，从新的角度重新打开村庄。'
};
```

### 成功返回

```json
{
  "success": true,
  "data": {
    "title": "我的村庄观察报告",
    "identity": "数字游民",
    "routeName": "新村民与乡建观察线",
    "summary": "...",
    "moments": ["..."],
    "nextSuggestion": "..."
  },
  "meta": {
    "fallback": false
  }
}
```

## 9.6 initData

### 功能

初始化 routes 和 spots 数据。

### 入参

无必填参数。

### 权限

MVP 阶段可以不做管理员校验，但代码中需要写注释说明：生产环境应增加管理员校验或仅在部署时调用。

### 幂等实现要求

对每条 route 和 spot 使用固定 `_id`。

建议实现方式：

```js
await db.collection('routes').doc(route._id).set({
  data: {
    ...route,
    updatedAt: db.serverDate()
  }
});
```

如果 TCB 当前环境的 `set` 不可用，则使用：

1. 先 `doc(id).get()`
2. 存在则 `update`
3. 不存在则 `add({ data: { _id: id, ... } })`

### 成功返回

```json
{
  "success": true,
  "data": {
    "routes": 2,
    "spots": 7,
    "message": "初始化完成"
  }
}
```

## 10. AI 共享文件实现要求

`getSpotContent` 和 `generateReport` 需要以下共享文件：

- `aiService.js`
- `prompts.js`
- `config.js`

由于不使用 TCB layer，请将这三个文件复制到每个需要 AI 的云函数目录内。

## 10.1 config.js

```js
module.exports = {
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini'
};
```

## 10.2 aiService.js

必须实现 `callAI(prompt)`。

### 要求

1. 使用 Node.js 18 内置 `fetch`。
2. 如果 `AI_API_KEY` 为空，直接 throw `AI_NOT_CONFIGURED`。
3. 请求超时时间 5 秒。
4. 检查 HTTP 状态码，非 2xx 时 throw。
5. 检查 `data.choices[0].message.content` 是否存在。
6. 支持去除模型可能返回的 Markdown JSON 代码块。
7. JSON.parse 失败时 throw。
8. 上层云函数捕获错误并走 fallback。

### 参考实现结构

```js
const config = require('./config');

function cleanJsonContent(content) {
  if (!content || typeof content !== 'string') return '';
  return content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

async function callAI(prompt) {
  if (!config.AI_API_KEY) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${config.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_object'
        }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`AI_HTTP_ERROR_${res.status}`);
    }

    const data = await res.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!content) {
      throw new Error('AI_EMPTY_CONTENT');
    }

    return JSON.parse(cleanJsonContent(content));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  callAI
};
```

## 10.3 prompts.js

### generateSpotPrompt

```js
function generateSpotPrompt({
  userType,
  interest,
  routeName,
  routeTheme,
  spotName,
  spotIntro,
  storyMaterial,
  details,
  tags
}) {
  return `你是"会走路的村庄"的 AI 实地叙事导览 Agent。

请根据游客身份、路线主题和点位资料，生成该点位的导览内容。

要求：
1. 只能基于提供的点位资料生成，不要编造不存在的历史事实。
2. 语言要有画面感，但不要过度文学化。
3. 根据游客身份调整内容重点。
4. 输出严格 JSON，不要输出 Markdown，不要输出解释。

游客身份：${userType || '村庄漫游者'}
游客兴趣：${interest || '自然与人文'}
路线名称：${routeName}
路线主题：${routeTheme}

点位名称：${spotName}
点位介绍：${spotIntro}
点位故事素材：${storyMaterial}
可观察细节：${(details || []).join('、')}
点位标签：${(tags || []).join('、')}

请输出以下 JSON：
{
  "aiStory": "点位故事，120字以内",
  "task": "一个具体观察任务",
  "photoTip": "一个拍照提示",
  "question": "一个可以引导游客思考的问题"
}`;
}
```

### generateReportPrompt

```js
function generateReportPrompt({
  userType,
  routeName,
  routeTheme,
  spotNames,
  notes
}) {
  return `你是"会走路的村庄"的 AI 田野观察报告生成器。

请根据游客路线、经过点位和游客输入，生成一份个人村庄观察报告。

要求：
1. 不要编造游客没有经历的点位。
2. 必须结合游客输入内容。
3. 语言温暖、清晰、有记忆点。
4. 字数控制在 300 字以内。
5. 输出严格 JSON，不要输出 Markdown，不要输出解释。

游客身份：${userType || '村庄漫游者'}
路线名称：${routeName}
路线主题：${routeTheme}
经过点位：${(spotNames || []).join('、')}
游客输入：${JSON.stringify(notes || [])}

请输出以下 JSON：
{
  "title": "报告标题",
  "identity": "游客身份",
  "routeName": "路线名称",
  "summary": "整体总结",
  "moments": ["瞬间1", "瞬间2", "瞬间3"],
  "nextSuggestion": "下次推荐"
}`;
}

module.exports = {
  generateSpotPrompt,
  generateReportPrompt
};
```

## 11. 参数校验工具建议

可以在每个云函数内实现轻量校验函数，不需要额外依赖。

```js
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateImages(images) {
  if (images === undefined || images === null) return [];
  if (!Array.isArray(images)) throw new Error('INVALID_IMAGES');
  if (images.length > 9) throw new Error('TOO_MANY_IMAGES');
  for (const item of images) {
    if (typeof item !== 'string' || !item.startsWith('cloud://')) {
      throw new Error('INVALID_IMAGE_FILE_ID');
    }
  }
  return images;
}
```

## 12. 权限校验要求

除 `getRoutes` 和 `initData` 外，所有涉及用户数据的函数必须校验 openid。

### 12.1 createSession

必须获取 `OPENID` 并写入 session。

### 12.2 getSpotContent / submitNote / generateReport

必须：

1. 获取 `OPENID`
2. 查询 session
3. 校验 `session.openid === OPENID`
4. 不允许用户访问其他 openid 的 session、notes、report

## 13. TCB 数据库操作要求

### 13.1 数组去重添加

`visitedSpots` 必须使用：

```js
_.addToSet(spotId)
```

### 13.2 数组追加

`sessions.notes` 摘要必须使用：

```js
_.push(noteSummary)
```

### 13.3 时间字段

创建时写入：

```js
createdAt: db.serverDate(),
updatedAt: db.serverDate()
```

更新时写入：

```js
updatedAt: db.serverDate()
```

### 13.4 查询安全

查询 notes 时必须同时带上 `sessionId` 和 `openid`，避免越权读取。

## 14. 非功能要求

1. 所有云函数必须可独立部署。
2. 所有云函数必须有完整 try/catch。
3. 不允许因为 AI 未配置导致接口失败。
4. 不允许因为 AI 超时导致接口失败。
5. 不允许写死只有 2 条路线。
6. 不允许写死只有 7 个点位，除 initData 初始数据外。
7. 不允许返回内部错误堆栈给前端。
8. 日志可以使用 `console.error` 记录内部错误。
9. 返回给前端的错误信息必须简洁、中文、可理解。

## 15. 调用示例

### 15.1 getRoutes

前端调用：

```js
wx.cloud.callFunction({
  name: 'getRoutes',
  data: {}
});
```

### 15.2 createSession

前端调用：

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

### 15.3 getSpotContent

前端调用：

```js
wx.cloud.callFunction({
  name: 'getSpotContent',
  data: {
    sessionId: 'xxx',
    spotId: 'old_house'
  }
});
```

### 15.4 submitNote

前端调用：

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

### 15.5 generateReport

前端调用：

```js
wx.cloud.callFunction({
  name: 'generateReport',
  data: {
    sessionId: 'xxx'
  }
});
```

### 15.6 initData

前端或控制台调用：

```js
wx.cloud.callFunction({
  name: 'initData',
  data: {}
});
```

## 16. Codex 输出要求

请输出完整代码，不要只输出片段。

必须包含：

1. 完整目录结构
2. `getRoutes/index.js`
3. `getRoutes/package.json`
4. `createSession/index.js`
5. `createSession/package.json`
6. `getSpotContent/index.js`
7. `getSpotContent/aiService.js`
8. `getSpotContent/prompts.js`
9. `getSpotContent/config.js`
10. `getSpotContent/package.json`
11. `submitNote/index.js`
12. `submitNote/package.json`
13. `generateReport/index.js`
14. `generateReport/aiService.js`
15. `generateReport/prompts.js`
16. `generateReport/config.js`
17. `generateReport/package.json`
18. `initData/index.js`
19. `initData/package.json`
20. 部署说明
21. 每个云函数的测试调用示例

## 17. 验收标准

### 17.1 基础验收

1. 所有云函数代码完整，可直接部署。
2. 每个云函数都有独立 `package.json`。
3. 所有云函数使用 CommonJS。
4. 所有云函数使用 `wx-server-sdk`。
5. 不存在 FastAPI、Express、HTTP Server 代码。
6. 不存在 `getUploadToken` 必做实现。

### 17.2 数据验收

1. `initData` 可成功写入 2 条 routes。
2. `initData` 可成功写入 7 个 spots。
3. `initData` 多次执行不会重复插入数据。
4. `getRoutes` 返回数据库中的所有 routes，不写死数量。

### 17.3 权限验收

1. `createSession` 写入当前用户 openid。
2. `getSpotContent` 校验 session.openid。
3. `submitNote` 校验 session.openid。
4. `generateReport` 校验 session.openid。
5. 用户不能访问其他 openid 的 session。

### 17.4 AI 验收

1. 未配置 `AI_API_KEY` 时，`getSpotContent` 仍返回兜底内容。
2. 未配置 `AI_API_KEY` 时，`generateReport` 仍返回兜底报告。
3. AI 超时、HTTP 错误、JSON 解析失败时均返回兜底内容。
4. AI 失败时返回 `meta.fallback = true`。
5. AI 成功时返回 `meta.fallback = false`。

### 17.5 业务验收

1. `createSession` 可根据 `routeType` 匹配路线。
2. `createSession` 可根据 `userType` 匹配路线。
3. `createSession` 无匹配时使用默认路线。
4. `createSession` 返回 spots 顺序必须与 `route.spotIds` 一致。
5. `getSpotContent` 会更新 `visitedSpots`。
6. `getSpotContent` 会更新 `currentSpotIndex`。
7. `submitNote` 会写入 `notes` 集合。
8. `submitNote` 会更新 `sessions.notes` 摘要。
9. `generateReport` 会读取该 session 下 notes。
10. `generateReport` 会把 report 写回 session。

## 18. 部署说明要求

Codex 最终输出中必须包含简洁部署说明：

1. 在微信开发者工具或腾讯云开发控制台创建 CloudBase 环境。
2. 创建数据库集合：
   - routes
   - spots
   - sessions
   - notes
3. 分别上传并部署 `cloudfunctions` 下的云函数。
4. 为 `getSpotContent` 和 `generateReport` 配置环境变量：
   - `AI_BASE_URL`
   - `AI_API_KEY`
   - `AI_MODEL`
5. 先调用 `initData` 初始化数据。
6. 前端使用 `wx.cloud.callFunction` 调用各云函数。

## 19. 最终开发目标

完成后，前端应能按以下流程跑通：

1. 调用 `initData` 初始化数据。
2. 调用 `getRoutes` 获取路线。
3. 用户选择身份、兴趣和时间。
4. 调用 `createSession` 创建体验会话。
5. 按路线点位调用 `getSpotContent` 获取导览内容。
6. 用户上传图片到云存储，拿到 fileID。
7. 调用 `submitNote` 保存文字和图片记录。
8. 调用 `generateReport` 生成最终观察报告。

所有步骤在未配置 AI 的情况下也必须可跑通，只是返回兜底内容。
本项目同时需要支持 TCB 云函数部署和本地 mock 运行。TCB 版本用于真实小程序部署，本地 mock 版本用于我在本地不依赖微信开发者工具即可验证业务流程。





乡建数字身份 / Semi 登录体系兼容调整方案
1. 接入结论

乡建数字身份 / Semi 登录体系应按照 OAuth2 Authorization Code Flow + PKCE 的方式接入。

本次接入不是简单的前端跳转登录，也不是传统的手机号、邮箱验证码登录，而是引入一个第三方身份提供方。系统需要在现有登录体系之外，新增一套外部身份登录与账号绑定能力。

整体接入方式为：

前端展示 Semi 登录入口
  ↓
跳转到我方后端登录接口
  ↓
我方后端生成 state 和 PKCE 参数
  ↓
跳转到 Semi 授权页
  ↓
Semi 回调我方后端
  ↓
我方后端使用 code 换取 token
  ↓
我方后端获取 Semi 用户信息
  ↓
绑定或创建本地用户
  ↓
签发我方系统自己的登录态
  ↓
跳转回前端业务页面

因此，本方案需要 前端和后端共同改造，但核心安全逻辑必须放在后端完成。

2. 前端改造内容

前端主要负责登录入口展示和页面跳转，不直接参与 token 交换，也不保存 Semi 的 client_secret。

前端需要新增：

1. “使用乡建数字身份 / Semi 登录”按钮
2. 点击后跳转到我方后端登录入口
3. 登录成功后接收后端跳转结果
4. 登录失败时展示错误提示

推荐前端登录入口：

GET /auth/semi/login

前端点击按钮后，不直接跳转 Semi 授权地址，而是跳转到我方后端：

window.location.href = "/auth/semi/login";

登录完成后，由后端签发我方系统自己的登录态，再跳转回前端页面，例如：

/login/success
/dashboard

前端不应该做以下事情：

1. 不保存 client_secret
2. 不直接请求 Semi token 接口
3. 不直接持久化 Semi access_token
4. 不直接使用 Semi token 作为我方业务接口凭证
3. 后端改造内容

后端是本次接入的核心，需要新增完整的 OAuth2 登录流程。

后端需要新增以下接口：

GET /auth/semi/login
GET /auth/semi/callback
POST /auth/semi/unbind
POST /auth/semi/refresh

其中核心流程为：

3.1 发起登录

/auth/semi/login 负责：

1. 生成 state
2. 生成 code_verifier
3. 根据 code_verifier 生成 code_challenge
4. 临时保存 state 和 code_verifier
5. 302 跳转到 Semi 授权页

授权请求需要包含：

client_id
redirect_uri
response_type=code
scope=openid profile
state
code_challenge
code_challenge_method=S256

如果业务需要钱包地址，则 scope 调整为：

openid profile wallet

如果业务不需要积分、余额等信息，不建议默认申请 token:read。

3.2 处理回调

/auth/semi/callback 负责：

1. 接收 Semi 返回的 code 和 state
2. 校验 state 是否有效
3. 取出对应的 code_verifier
4. 使用 code + code_verifier 向 Semi token 接口换取 token
5. 使用 access_token 请求 Semi userinfo
6. 根据 userinfo.sub 查找外部身份绑定关系
7. 绑定已有用户或创建新用户
8. 签发我方系统自己的 session / JWT
9. 跳转回前端业务页面

我方系统后续接口鉴权应继续使用自己的登录态，不应直接依赖 Semi 的 access_token。

4. 用户模型调整

现有用户表不建议直接使用 Semi 的 handle、wallet_address、手机号或邮箱作为唯一标识。

Semi 用户在我方系统内应通过：

provider + provider_subject

进行唯一识别。

建议新增外部身份绑定表：

CREATE TABLE external_identities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_subject VARCHAR(255) NOT NULL,
  handle VARCHAR(255),
  wallet_address VARCHAR(255),
  phone_verified BOOLEAN,
  email_verified BOOLEAN,
  scopes_granted_json JSON,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  access_token_expires_at DATETIME,
  refresh_token_expires_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_provider_subject (provider, provider_subject)
);

其中：

provider = semi
provider_subject = Semi userinfo 返回的 sub

本地用户和 Semi 身份之间是一种绑定关系，而不是用 Semi 身份完全替代本地用户体系。

5. 登录态设计调整

Semi 登录成功后，系统不应把 Semi access_token 直接返回给前端作为业务 token。

推荐方式是：

Semi 登录成功
  ↓
后端获取 Semi 用户信息
  ↓
后端绑定或创建本地用户
  ↓
后端签发我方系统自己的 session / JWT
  ↓
前端继续使用我方原有登录态访问业务接口

Semi 的 token 只用于：

1. 获取 Semi 用户信息
2. 刷新 Semi 授权
3. 后续调用 Semi 相关接口
4. 解绑或吊销授权

Semi token 应加密存储在服务端，避免暴露给浏览器。

6. Token 管理调整

Semi 的 refresh token 存在轮换机制，每次刷新后会返回新的 refresh token，旧 refresh token 会失效。

因此后端刷新 token 时需要注意并发安全：

1. 对当前 external_identity 加锁
2. 使用当前 refresh_token 发起刷新请求
3. 成功后原子更新 access_token 和 refresh_token
4. 失败时不要重复使用旧 refresh_token 盲目重试

否则在并发请求场景下，可能出现一个请求刷新成功，另一个请求继续使用旧 refresh token 导致失败，从而误判用户授权失效。

7. 配置项调整

后端需要新增 Semi 相关配置：

SEMI_ISSUER=https://api.semi.im
SEMI_AUTHORIZATION_URL=https://api.semi.im/oauth/authorize
SEMI_TOKEN_URL=https://api.semi.im/oauth/token
SEMI_USERINFO_URL=https://api.semi.im/oauth/userinfo
SEMI_JWKS_URL=https://api.semi.im/oauth/jwks

SEMI_CLIENT_ID=xxx
SEMI_CLIENT_SECRET=xxx
SEMI_REDIRECT_URI=https://your-domain.com/auth/semi/callback
SEMI_SCOPES=openid profile

如果需要钱包信息：

SEMI_SCOPES=openid profile wallet

需要注意：

1. client_secret 只能保存在后端
2. redirect_uri 必须和 Semi 应用后台配置完全一致
3. 生产环境必须使用 HTTPS
4. 不同环境建议分别配置不同 redirect_uri
8. 安全调整

本次接入需要补充以下安全机制：

1. 使用 state 防止 CSRF 攻击
2. 使用 PKCE，code_challenge_method 必须为 S256
3. code_verifier 只在服务端临时保存
4. authorization code 只能使用一次
5. client_secret 不允许进入前端代码
6. Semi token 服务端加密存储
7. Cookie 设置 HttpOnly、Secure、SameSite
8. 回调地址严格校验
9. 登录失败日志需要脱敏

如需在本地验证 Semi 返回的 JWT，可通过 JWKS 校验签名，并校验：

iss
aud
exp
iat
kid
9. 账号绑定策略

需要支持以下几种场景：

9.1 未登录用户使用 Semi 登录
1. 根据 provider = semi 和 sub 查询绑定关系
2. 如果已绑定，则登录对应本地用户
3. 如果未绑定，则创建新本地用户
4. 创建 external_identity 绑定记录
9.2 已登录用户绑定 Semi
1. 当前用户已登录
2. 发起 Semi 授权
3. 回调后获取 Semi sub
4. 如果该 sub 未被其他用户绑定，则绑定到当前用户
5. 如果已被其他用户绑定，则提示该 Semi 账号已被占用
9.3 用户解绑 Semi
1. 判断用户是否还有其他可用登录方式
2. 如允许解绑，则吊销 Semi token
3. 删除或禁用 external_identity 绑定关系
4. 保留必要审计日志

如果 Semi 是该用户唯一登录方式，需要谨慎允许解绑，避免用户无法再次登录。

10. 错误处理调整

后端需要识别并处理以下错误：

invalid_request
invalid_client
invalid_grant
unauthorized_client
invalid_scope
access_denied
token_expired
userinfo_failed
state_mismatch

建议对用户展示统一、可理解的提示，例如：

登录失败，请重新尝试
授权已取消
登录状态已过期，请重新登录
当前账号暂不可使用乡建数字身份登录

同时后端日志中记录具体错误码，方便排查，但不得记录明文 token、client_secret、authorization code。

11. 发布与联调注意事项

上线前需要完成以下检查：

1. Semi 应用后台已创建应用
2. 应用状态已启用
3. client_id 和 client_secret 已配置到服务端
4. redirect_uri 与我方后端回调地址完全一致
5. scope 与业务需求一致
6. 前端按钮跳转到我方后端登录入口
7. 后端能够正确完成 code 换 token
8. 后端能够通过 userinfo 获取 sub
9. 本地用户能够正确创建或绑定
10. 我方登录态能够正常签发
11. token 刷新逻辑经过并发测试
12. 解绑逻辑经过验证
12. 最终调整后的登录架构
前端
  |
  | 点击 Semi 登录
  v
我方后端 /auth/semi/login
  |
  | 生成 state、code_verifier、code_challenge
  v
Semi 授权页
  |
  | 用户确认授权
  v
我方后端 /auth/semi/callback
  |
  | 校验 state
  | code 换 token
  | 获取 userinfo
  | 绑定 / 创建本地用户
  | 签发我方登录态
  v
前端业务页面

调整后，系统中存在两类 token：

1. Semi token
   - 用于访问 Semi 相关接口
   - 服务端保存
   - 不直接暴露给前端

2. 我方系统 token / session
   - 用于访问我方业务接口
   - 由我方后端签发
   - 前端继续按原有方式使用
13. 总结

本次兼容乡建数字身份 / Semi 登录体系，主要调整点如下：

1. 新增 OAuth2 + PKCE 登录流程
2. 前端只负责登录入口和跳转
3. 后端负责授权、换 token、获取用户信息和签发本地登录态
4. 新增 external_identity 外部身份绑定表
5. 使用 Semi userinfo.sub 作为第三方身份唯一标识
6. Semi token 服务端加密保存
7. 我方业务系统继续使用自己的登录态
8. refresh token 轮换需要做并发安全处理
9. 支持账号绑定、解绑和异常处理
10. 上线前需要重点验证 redirect_uri、scope、token 交换和用户绑定流程