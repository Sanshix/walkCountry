const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const routes = [
  {
    _id: 'digital_nomad_village_research',
    name: '新村民与乡建观察线',
    routeType: 'digital_nomad',
    targetUsers: ['数字游民', '乡建研究者', '青年创业者', '新村民观察者'],
    duration: '45分钟',
    theme: '从乡建、空间更新和新村民创业角度理解村庄',
    description: '这条路线适合想深入理解乡村变化的人。它会带你从村口进入村庄，在老屋、公共空间、民宿和新村民创业点之间，看见传统村落如何被重新使用。',
    spotIds: ['village_gate', 'old_house', 'public_space', 'cafe', 'new_villager_space']
  },
  {
    _id: 'visitor_scenery_humanities',
    name: '风景与乡愁漫游线',
    routeType: 'visitor',
    targetUsers: ['普通游客', '亲子家庭', '摄影爱好者', '城市白领'],
    duration: '40分钟',
    theme: '看风景、听故事、理解乡村人文',
    description: '这条路线适合第一次来到村庄的游客。它会带你看见村口、植物、老屋、山路和公共空间，在轻松漫游中理解村庄的自然与人文。',
    spotIds: ['village_gate', 'persimmon_tree', 'old_house', 'mountain_path', 'public_space']
  }
];

const spots = [
  {
    _id: 'village_gate',
    name: '村口',
    village: '四坪村',
    type: '入口 / 标志 / 起点',
    image: 'cloud://placeholder/village_gate.jpg',
    intro: '这里是进入四坪村的第一站。村口的老树和石墙标记着村庄的边界，也是外来者与村庄相遇的起点。',
    storyMaterial: '四坪村的村口保留着一棵百年老树和一段石砌矮墙。过去，村民从这里出发去赶集、去城里打工；如今，新村民和游客从这里进入村庄，开始一段新的关系。村口既是地理边界，也是心理边界。',
    details: ['老树根部的青苔', '石墙上的刻痕', '路面从水泥变为石板的交界', '村口的指示牌', '远处可见的屋顶轮廓'],
    tags: ['村口', '边界', '起点', '老树', '石墙'],
    suitableRoutes: ['digital_nomad_village_research', 'visitor_scenery_humanities'],
    defaultTask: "站在村口，观察从哪个细节开始，你感觉自己'进入'了村庄。",
    defaultQuestion: '你觉得一个村庄的入口应该给人什么样的感觉？'
  },
  {
    _id: 'old_house',
    name: '老屋',
    village: '四坪村',
    type: '建筑 / 乡愁 / 乡建',
    image: 'cloud://placeholder/old_house.jpg',
    intro: '老屋是村庄记忆最集中的地方。木梁、瓦片、门槛和墙面都保存着几代人生活过的痕迹。',
    storyMaterial: '四坪村的老屋多为传统民居，木结构、青瓦和厚墙构成了稳定的生活空间。过去，一栋老屋里常常住着几代人，堂屋、灶间和院落承载着日常劳作、节庆团聚和邻里往来。如今，一些老屋正在被重新修缮，也可能被改造为民宿、展厅、公共空间或青年驻留空间。老屋不只是怀旧对象，也是乡村更新的重要入口。',
    details: ['木梁上的纹理', '老门槛的磨损', '瓦片的层次', '墙面修补的痕迹', '院落里留下的生活器物'],
    tags: ['老屋', '建筑', '乡愁', '修缮', '再利用'],
    suitableRoutes: ['digital_nomad_village_research', 'visitor_scenery_humanities'],
    defaultTask: '找一处老屋中最能体现时间痕迹的细节，并想象它曾经属于怎样的日常生活。',
    defaultQuestion: '你觉得老屋被重新使用时，最应该保留下来的是什么？'
  },
  {
    _id: 'public_space',
    name: '公共空间',
    village: '四坪村',
    type: '社区 / 共创 / 乡建',
    image: 'cloud://placeholder/public_space.jpg',
    intro: '这里是村庄中的公共客厅，既是新老村民相遇的地方，也是游客理解村庄当下生活的窗口。',
    storyMaterial: '这个公共空间由旧建筑改造而来，可能是公共客厅、图书室、活动室或小型展厅。它不只服务游客，也服务村民的日常交流。老人可以在这里聊天，孩子可以阅读，新村民可以组织分享会，外来访客也可以通过这里认识村庄。公共空间让乡建不再只是建筑更新，而是人与人关系的重新连接。',
    details: ['公共桌椅的摆放', '墙上的活动海报', '书架上的书', '旧建筑保留下来的结构', '村民和游客共同使用的痕迹'],
    tags: ['公共空间', '社区', '共创', '图书室', '公共客厅'],
    suitableRoutes: ['digital_nomad_village_research', 'visitor_scenery_humanities'],
    defaultTask: '观察这个空间中有哪些设计是在邀请人停下来交流。',
    defaultQuestion: '一个村庄为什么需要公共空间？它和城市里的咖啡馆或社区中心有什么不同？'
  },
  {
    _id: 'cafe',
    name: '咖啡屋',
    village: '四坪村',
    type: '新业态 / 生活方式 / 创业',
    image: 'cloud://placeholder/cafe.jpg',
    intro: '咖啡屋是新生活方式进入村庄后的一个小小窗口。它连接了城市经验、乡村空间和新的创业想象。',
    storyMaterial: '这间咖啡屋由新村民或返乡青年经营。它把城市里的咖啡、阅读、远程办公和社交活动带入村庄，也让游客在停留中重新感受乡村空间。咖啡屋不是简单复制城市消费，而是在老房子、田野、山景和村民生活之间寻找新的平衡。它代表一种新的乡村业态：既面向外来者，也尝试与本地生活发生关系。',
    details: ['窗外的村庄景色', '吧台与老建筑的关系', '菜单中的本地元素', '座位如何面向街巷或山景', '游客和村民是否共同使用空间'],
    tags: ['咖啡', '新业态', '生活方式', '创业', '新村民'],
    suitableRoutes: ['digital_nomad_village_research'],
    defaultTask: '观察咖啡屋中有哪些元素来自城市，又有哪些元素属于村庄。',
    defaultQuestion: '你觉得一家乡村咖啡屋应该更像城市咖啡馆，还是更像村庄的一部分？'
  },
  {
    _id: 'new_villager_space',
    name: '新村民创业点',
    village: '四坪村',
    type: '创业 / 农业 / 新村民',
    image: 'cloud://placeholder/new_villager_space.jpg',
    intro: '这里展示了新村民进入乡村后的工作方式：有人做农业，有人做内容，有人做空间，也有人重新组织人与土地的关系。',
    storyMaterial: '新村民创业点可能是一处工作室、小农场、共创空间或农产品实验点。返乡青年或外来创业者在这里尝试把设计、互联网、农业、教育和文旅结合起来。他们既带来新的工具和资源，也需要学习村庄原有的节奏、土地经验和人情关系。这个点位能让游客看到，乡村振兴并不只是风景变美，也包括新的职业、新的协作和新的生活选择。',
    details: ['工作空间的布置', '农具和现代设备的并置', '产品包装或展示', '人与土地的连接方式', '新老村民合作的痕迹'],
    tags: ['新村民', '创业', '农业', '返乡青年', '乡村振兴'],
    suitableRoutes: ['digital_nomad_village_research'],
    defaultTask: '观察这里的创业实践解决了村庄里的什么问题，或者创造了什么新的可能。',
    defaultQuestion: '如果你在村庄里工作一个月，你最想尝试做什么？'
  },
  {
    _id: 'persimmon_tree',
    name: '柿子树',
    village: '四坪村',
    type: '植物 / 季节 / 风景',
    image: 'cloud://placeholder/persimmon_tree.jpg',
    intro: '柿子树是村庄季节感最鲜明的标志之一。秋天果实挂满枝头时，它会成为村里最容易被记住的风景。',
    storyMaterial: '村中的柿子树陪伴着村民经历一年四季。春天发芽，夏天成荫，秋天果实变红，冬天枝干安静地站在屋旁或路边。对游客来说，柿子树是一处风景；对村民来说，它可能关联着采摘、晾晒、分享和童年记忆。它提醒人们，村庄的时间不是只由日历决定，也由植物、天气和农事慢慢标记。',
    details: ['树干的纹理', '果实的颜色', '树影落在墙面的位置', '树与老屋的关系', '地上落叶或果实的痕迹'],
    tags: ['柿子树', '季节', '植物', '乡愁', '风景'],
    suitableRoutes: ['visitor_scenery_humanities'],
    defaultTask: '围绕柿子树观察三种颜色，并记录它们分别让你想到什么季节。',
    defaultQuestion: '你记忆中的乡村，是由哪一种植物或味道唤起的？'
  },
  {
    _id: 'mountain_path',
    name: '山路',
    village: '四坪村',
    type: '自然 / 步道 / 风景',
    image: 'cloud://placeholder/mountain_path.jpg',
    intro: '这条山路连接着村庄、山林和远处的梯田。沿着它行走，可以看到村庄与自然环境之间的关系。',
    storyMaterial: '山路曾是村民进山、劳作、采集和连接外部道路的重要路径。它可能不宽，也并不总是平整，但承载着村庄和山林之间长期的往来。沿路可以看到远山、竹林、梯田、石阶和被踩出的泥土痕迹。对游客来说，山路是一段风景；对村庄来说，它是生活半径的一部分，也是理解土地、体力和时间的线索。',
    details: ['路面的材质变化', '石阶或泥土的磨损', '远处山形', '梯田线条', '路边植物'],
    tags: ['山路', '自然', '步道', '远山', '梯田'],
    suitableRoutes: ['visitor_scenery_humanities'],
    defaultTask: '在山路上停下来，观察一处能体现‘人走出来的路’的痕迹。',
    defaultQuestion: '当你步行进入山林时，你对村庄的感受发生了什么变化？'
  }
];




function ok(data) {
  return { success: true, data };
}

function fail(errorCode, message) {
  return { success: false, errorCode, message };
}

async function upsertById(collectionName, item) {
  const now = db.serverDate();
  const { _id, ...fields } = item;
  const updateData = { ...fields, updatedAt: now };
  const createData = { _id, ...fields, createdAt: now, updatedAt: now };
  try {
    const existing = await db.collection(collectionName).doc(_id).get();
    if (existing && existing.data) {
      await db.collection(collectionName).doc(_id).update({
        data: updateData
      });
    } else {
      await db.collection(collectionName).add({
        data: createData
      });
    }
  } catch (err) {
    // 部分 TCB 环境 doc(id).get() 在不存在时会抛错；此时按新增处理。
    const message = err && err.message ? err.message : '';
    if (/not found|does not exist|document/i.test(message)) {
      await db.collection(collectionName).add({
        data: createData
      });
      return;
    }
    throw err;
  }
}

exports.main = async (event, context) => {
  // MVP 阶段不做管理员校验。生产环境应限制为管理员或仅在部署初始化阶段调用。
  try {
    for (const route of routes) {
      await upsertById('routes', route);
    }
    for (const spot of spots) {
      await upsertById('spots', spot);
    }
    return ok({
      routes: routes.length,
      spots: spots.length,
      message: '初始化完成'
    });
  } catch (err) {
    console.error('initData failed:', err);
    return fail('DB_ERROR', '初始化数据失败');
  }
};
