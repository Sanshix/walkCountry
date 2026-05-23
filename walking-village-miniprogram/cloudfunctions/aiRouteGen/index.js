const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const https = require('https')

// 真实点位数据库 - 龙潭村、四坪村等
const realSpots = {
  // 龙潭村点位
  longtan: [
    {
      id: 'lt_gate',
      name: '龙潭村口',
      subtitle: '理解村庄更新的第一站',
      location: '龙潭村入口',
      lat: 26.8923,
      lng: 119.7245,
      duration: '10 分钟',
      image: '/pkg-assets/route-result/route-point-1.jpg',
      story: '村口是理解龙潭村的起点。这里连接着外来的游客、返乡的青年与仍然生活在村里的老人。曾经安静的山村，因为文创和共创重新被看见。',
      highlight: '村口不是入口，而是村庄重新连接外部世界的开始。',
      aiAudioText: '欢迎来到龙潭村。你现在站在村庄叙事的起点。过去这里只是村民出入的普通路口，今天它成为游客理解村庄变化的第一幕。',
      task: '请观察村口周围的新旧元素，记录一个你认为最能代表"变化"的细节。',
      tags: ['村口', '乡建', '空间观察'],
      suitableRoles: ['digital_nomad', 'tourist', 'rural_observer'],
      suitableInterests: ['乡村建筑', '人文故事', '风景摄影']
    },
    {
      id: 'lt_oldhouse',
      name: '老屋改造空间',
      subtitle: '旧建筑里的新生活',
      location: '旧祠堂巷 12 号',
      lat: 26.8931,
      lng: 119.7252,
      duration: '15 分钟',
      image: '/pkg-assets/route-result/route-point-2.jpg',
      story: '这座老屋曾是村里闲置的生活空间。改造没有抹去土墙、木梁和青瓦，而是在原有肌理中加入新的功能。',
      highlight: '修旧如旧，让老房子重新拥有被使用的理由。',
      aiAudioText: '你看到的这座老屋，保留了传统村落的肌理。乡建并不是把乡村变成城市，而是在原有生活基础上找到新的使用方式。',
      task: '拍下一个你最喜欢的空间细节，例如窗、门、梁、墙面或院落。',
      tags: ['老屋改造', '建筑', '乡建'],
      suitableRoles: ['digital_nomad', 'rural_observer', 'student'],
      suitableInterests: ['乡村建筑', '人文故事', '乡建观察']
    },
    {
      id: 'lt_coffee',
      name: '青年共创咖啡馆',
      subtitle: '一杯咖啡里的在地生活',
      location: '村中心共创街区',
      lat: 26.8938,
      lng: 119.7258,
      duration: '15 分钟',
      image: '/pkg-assets/route-result/route-point-3.jpg',
      story: '咖啡馆让村庄多了一种停留方式。这里不是城市咖啡馆的复制品，而是把乡村院落、田野风光和青年创业连接在一起的生活空间。',
      highlight: '咖啡不是终点，它让更多人愿意在村里停下来。',
      aiAudioText: '在乡村里出现咖啡馆，并不只是消费业态的变化。它让游客、村民、新村民之间产生新的相遇。',
      task: '找一个适合停留的位置，写下一句话描述你此刻感受到的村庄节奏。',
      tags: ['咖啡', '数字游民', '共创'],
      suitableRoles: ['digital_nomad', 'tourist'],
      suitableInterests: ['咖啡休闲', '人文故事']
    },
    {
      id: 'lt_art',
      name: '47树美术馆',
      subtitle: '艺术介入乡村的窗口',
      location: '龙潭文创片区',
      lat: 26.8945,
      lng: 119.7265,
      duration: '10 分钟',
      image: '/pkg-assets/route-result/route-point-4.jpg',
      story: '艺术空间让村庄的表达不再只停留在风景。画作、展陈和公共活动，让外来创作者与本地生活发生对话。',
      highlight: '当艺术进入乡村，村庄也开始讲述自己的新故事。',
      aiAudioText: '这里的美术空间，是龙潭文创气质的重要组成部分。它连接了创作者、游客与村民。',
      task: '选择一个你最有感触的艺术元素，思考它和村庄生活有什么关系。',
      tags: ['艺术', '美术馆', '文创'],
      suitableRoles: ['digital_nomad', 'tourist', 'student'],
      suitableInterests: ['人文故事', '风景摄影']
    },
    {
      id: 'lt_story',
      name: '村民故事墙',
      subtitle: '听见土地上的人',
      location: '村民公共空间',
      lat: 26.8952,
      lng: 119.7272,
      duration: '10 分钟',
      image: '/pkg-assets/route-result/route-point-5.jpg',
      story: '一座村庄真正动人的地方，不只在建筑和风景，也在人的故事里。村民故事墙记录着返乡、守望、创业和日常生活的片段。',
      highlight: '村庄更新的核心，始终是生活在这里的人。',
      aiAudioText: '走到这里，你已经看过空间、业态和艺术。最后请把视线交还给人。每一个村民的经历，都是村庄历史的一部分。',
      task: '写下一个你想带走的村民故事关键词。',
      tags: ['村民故事', '在地生活', '总结'],
      suitableRoles: ['digital_nomad', 'rural_observer', 'student'],
      suitableInterests: ['人文故事', '乡建观察']
    },
    {
      id: 'lt_bridge',
      name: '回村桥',
      subtitle: '走进古村的第一眼风景',
      location: '龙潭村溪口',
      lat: 26.8918,
      lng: 119.7238,
      duration: '10 分钟',
      image: '/pkg-assets/route-result/route-point-1.jpg',
      story: '回村桥连接着村庄的过去与今天。桥下溪水流过，桥边的老屋和远山组成了最适合拍照的画面。',
      highlight: '一座桥，把风景、人和村庄记忆连接起来。',
      aiAudioText: '你现在看到的回村桥，是进入龙潭村最温柔的一幕。很多游客来到这里的第一张照片，都会把桥、溪和村庄放在同一个画面里。',
      task: '在桥边拍一张包含溪水、老屋和远山的照片。',
      tags: ['古桥', '摄影', '风景'],
      suitableRoles: ['tourist', 'family'],
      suitableInterests: ['风景摄影', '人文故事']
    },
    {
      id: 'lt_alley',
      name: '溪畔古巷',
      subtitle: '慢慢走，听见村庄的声音',
      location: '溪畔石板路',
      lat: 26.8926,
      lng: 119.7248,
      duration: '10 分钟',
      image: '/pkg-assets/route-result/route-point-2.jpg',
      story: '溪畔古巷保留了村庄日常生活的温度。水声、石路、墙面和屋檐共同构成了龙潭村的慢节奏。',
      highlight: '最好的风景，常常藏在慢下来的脚步里。',
      aiAudioText: '请把脚步放慢一点。你身边的石板路、老墙和溪水声，都是这条古巷的一部分。',
      task: '闭眼听 10 秒钟，记录你听到的三个声音。',
      tags: ['古巷', '溪流', '慢游'],
      suitableRoles: ['tourist'],
      suitableInterests: ['风景摄影', '人文故事']
    },
    {
      id: 'lt_book',
      name: '随喜书屋',
      subtitle: '在书页里遇见乡村',
      location: '龙潭村书屋',
      lat: 26.8934,
      lng: 119.7255,
      duration: '15 分钟',
      image: '/pkg-assets/route-result/route-point-3.jpg',
      story: '书屋让村庄有了安静停留的角落。游客可以在这里翻书、休息，也可以透过窗户看见村里的日常。',
      highlight: '书屋让旅行从打卡变成停留。',
      aiAudioText: '随喜书屋是一个适合停下来的地方。乡村旅行并不一定只有赶路，有时候，一段安静的阅读也是理解村庄的方式。',
      task: '选择一个你喜欢的角落，写下一句和村庄有关的话。',
      tags: ['书屋', '人文', '休闲'],
      suitableRoles: ['digital_nomad', 'tourist', 'student'],
      suitableInterests: ['人文故事', '咖啡休闲']
    }
  ],
  // 四坪村点位
  siping: [
    {
      id: 'sp_art_center',
      name: '龙潭公益艺术教育中心',
      subtitle: '人人都是艺术家的起点',
      location: '四坪艺术教育中心',
      lat: 26.8812,
      lng: 119.7156,
      duration: '25 分钟',
      image: '/pkg-assets/route-result/route-point-1.jpg',
      story: '艺术教育中心让孩子和游客理解，艺术并不只属于美术馆，也可以发生在乡村。',
      highlight: '艺术让村庄有了新的表达方式。',
      aiAudioText: '欢迎来到艺术教育中心。这里把艺术带进乡村，也把乡村带进孩子的创作里。',
      task: '画下你看到的一个村庄元素，可以是房子、树、桥或一条小路。',
      tags: ['艺术教育', '研学', '亲子'],
      suitableRoles: ['family', 'student'],
      suitableInterests: ['非遗体验', '人文故事', '风景摄影']
    },
    {
      id: 'sp_opera',
      name: '四平戏博物馆',
      subtitle: '听见古老戏曲的声音',
      location: '四坪村非遗展示点',
      lat: 26.8818,
      lng: 119.7162,
      duration: '25 分钟',
      image: '/pkg-assets/route-result/route-point-2.jpg',
      story: '四平戏是当地重要的传统文化。博物馆通过服饰、道具和故事，让孩子理解戏曲如何陪伴一代代村民的生活。',
      highlight: '非遗不是课本里的名词，而是曾经热闹生活的一部分。',
      aiAudioText: '四平戏博物馆记录着地方戏曲的声音。过去，戏台是村里重要的公共生活空间。',
      task: '找出一个你最感兴趣的戏曲元素，并说出它可能代表什么。',
      tags: ['非遗', '戏曲', '研学'],
      suitableRoles: ['family', 'student'],
      suitableInterests: ['非遗体验', '人文故事']
    },
    {
      id: 'sp_pottery',
      name: '四坪陶艺馆',
      subtitle: '用手触摸土地的温度',
      location: '四坪手作体验区',
      lat: 26.8824,
      lng: 119.7168,
      duration: '25 分钟',
      image: '/pkg-assets/route-result/route-point-3.jpg',
      story: '陶艺体验让孩子通过双手理解泥土与器物的关系。泥土来自土地，经过揉捏、塑形和烧制，变成可以使用的器物。',
      highlight: '用手完成的作品，会让孩子记住土地的温度。',
      aiAudioText: '陶艺馆里最重要的不是做出完美作品，而是感受泥土如何在手中变化。',
      task: '观察一个陶器的形状，想象它可以装下什么乡村记忆。',
      tags: ['陶艺', '手作', '亲子互动'],
      suitableRoles: ['family', 'student'],
      suitableInterests: ['非遗体验', '人文故事']
    },
    {
      id: 'sp_terrace',
      name: '四坪食光梯田',
      subtitle: '在田野里理解四季',
      location: '四坪梯田',
      lat: 26.8832,
      lng: 119.7175,
      duration: '25 分钟',
      image: '/pkg-assets/route-result/route-point-4.jpg',
      story: '梯田让孩子看到食物从哪里来，也能理解农事与季节的关系。站在田边，可以观察田埂、水渠、作物和远山。',
      highlight: '一块田，就是一间打开的自然教室。',
      aiAudioText: '请看看眼前的梯田。田埂、水渠、作物和山坡共同组成了乡村的自然课堂。',
      task: '请观察田野中的三种颜色，并说出它们分别来自哪里。',
      tags: ['梯田', '自然教育', '摄影'],
      suitableRoles: ['family', 'student', 'tourist'],
      suitableInterests: ['风景摄影', '人文故事']
    },
    {
      id: 'sp_astro',
      name: '四坪天文馆',
      subtitle: '从村庄望向星空',
      location: '四坪天文观察点',
      lat: 26.8840,
      lng: 119.7182,
      duration: '20 分钟',
      image: '/pkg-assets/route-result/route-point-5.jpg',
      story: '天文馆把孩子的视线从村庄带向星空。乡村较少的光污染，让夜空成为天然课堂。',
      highlight: '看见星空，也是在重新认识我们脚下的土地。',
      aiAudioText: '旅程的最后，我们从村庄望向星空。我们脚下的土地和头顶的宇宙，其实都值得认真观察。',
      task: '写下一个你想问星空的问题。',
      tags: ['天文', '科学', '研学'],
      suitableRoles: ['family', 'student'],
      suitableInterests: ['非遗体验', '人文故事']
    }
  ]
}

// 路线模板
const routeTemplates = {
  digital_nomad: {
    name: '数字游民乡建观察路线',
    desc: '从村口导览点出发，串联老屋改造、青年共创咖啡馆、艺术空间与村民故事，感受村庄更新与在地生活。',
    color: '#ff7a00',
    villages: ['longtan'],
    summary: '你以数字游民的视角，深度走访了龙潭村的乡建空间与日常现场。这段旅程不只是观察，更是一次与在地生活的连接。'
  },
  tourist: {
    name: '游客人文风景路线',
    desc: '从回村桥进入古村，沿溪畔古巷、书屋、酒博馆与田野观景点，轻松感受龙潭村的人文与风景。',
    color: '#ff8a00',
    villages: ['longtan'],
    summary: '你用轻松游客的视角，走过桥、古巷、书屋和田野，把龙潭村的风景、人文和慢生活收入自己的旅程。'
  },
  family: {
    name: '亲子研学非遗体验路线',
    desc: '围绕艺术教育、非遗戏曲、手作体验、梯田观察与星空探索，适合亲子家庭边走边学。',
    color: '#f28a00',
    villages: ['siping'],
    summary: '你和同行者边走边学，在艺术、非遗、手作、田野和星空之间，完成了一次温暖又有知识感的乡村研学。'
  },
  student: {
    name: '学生研学探索路线',
    desc: '从艺术教育到非遗体验，从梯田观察到天文馆，适合学生群体深度学习乡村文化。',
    color: '#f28a00',
    villages: ['siping'],
    summary: '你在研学中理解了乡村文化的多样性，从艺术、非遗到自然，收获知识与感动。'
  },
  rural_observer: {
    name: '乡建深度观察路线',
    desc: '深入观察老屋改造、共创空间与村民生活实践，理解乡建工作的在地逻辑。',
    color: '#ff7a00',
    villages: ['longtan'],
    summary: '你以乡建观察者的视角，深入理解了空间更新、业态引入与社区营造的在地实践。'
  }
}

// 智能匹配点位
function matchSpots(role, interests, time, count = 4) {
  const template = routeTemplates[role] || routeTemplates.digital_nomad
  const villages = template.villages
  const allSpots = []

  villages.forEach(v => {
    if (realSpots[v]) {
      allSpots.push(...realSpots[v])
    }
  })

  // 计算每个点位的匹配分数
  const scoredSpots = allSpots.map(spot => {
    let score = 0
    if (spot.suitableRoles && spot.suitableRoles.includes(role)) score += 30
    if (spot.suitableInterests) {
      interests.forEach(i => {
        if (spot.suitableInterests.includes(i)) score += 20
      })
    }
    // 添加随机性
    score += Math.random() * 10
    return { ...spot, score }
  })

  // 按分数排序并选取
  scoredSpots.sort((a, b) => b.score - a.score)

  // 根据时间调整点位数量
  let spotCount = count
  if (time.includes('30')) spotCount = 3
  else if (time.includes('1')) spotCount = 4
  else if (time.includes('2')) spotCount = 5
  else if (time.includes('半日')) spotCount = 6

  const selectedSpots = scoredSpots.slice(0, Math.min(spotCount, scoredSpots.length))

  // 添加顺序和任务按钮文字
  return selectedSpots.map((spot, index) => ({
    ...spot,
    order: index + 1,
    taskButtonText: index === selectedSpots.length - 1 ? '完成路线' : '继续探索'
  }))
}

// 计算路线总时长
function calculateTotalDuration(spots) {
  const totalMinutes = spots.reduce((sum, spot) => {
    const dur = spot.duration || '10 分钟'
    const min = parseInt(dur) || 10
    return sum + min
  }, 0)

  if (totalMinutes < 45) return '30 分钟'
  if (totalMinutes < 90) return '1 小时'
  if (totalMinutes < 150) return '2 小时'
  return '半日游'
}

// 生成路线
function generateRoute(role, interests, time) {
  const template = routeTemplates[role] || routeTemplates.digital_nomad
  const spots = matchSpots(role, interests, time)
  const totalDuration = calculateTotalDuration(spots)

  return {
    routeId: `${role}_${Date.now()}`,
    routeName: template.name,
    suitableRoles: [role],
    suitableInterests: interests,
    totalDuration,
    durationMinutes: spots.reduce((s, p) => s + (parseInt(p.duration) || 10), 0),
    pointCount: spots.length,
    routeDesc: template.desc,
    mapImage: '/pkg-assets/route-result/route-map-digital.jpg',
    themeColor: template.color,
    summary: template.summary,
    source: 'smart-match',
    points: spots
  }
}

// AI 生成提示词
function buildPrompt(role, interests, time) {
  const roleNames = {
    digital_nomad: '数字游民',
    tourist: '普通游客',
    family: '亲子家庭',
    student: '研学学生',
    rural_observer: '乡建观察者'
  }

  return `你是一位乡村导览专家。请根据用户身份和兴趣，生成一条龙潭村或四坪村的游览路线。

用户身份：${roleNames[role] || role}
兴趣标签：${interests.join('、')}
游览时间：${time}

请输出JSON格式路线，包含以下字段：
- routeName: 路线名称
- routeDesc: 路线简介(50字内)
- totalDuration: 总时长
- points: 点位数组(3-5个)，每个点位包含：
  - name: 点位名称
  - subtitle: 副标题
  - location: 具体位置
  - lat: 纬度(龙潭村约26.89, 四坪村约26.88)
  - lng: 经度(约119.72)
  - duration: 停留时长
  - story: 点位故事(100字内)
  - highlight: 精彩亮点(一句话)
  - aiAudioText: AI讲解词(80字内)
  - task: 互动任务

只输出JSON，不要其他内容。`
}

// 调用 AI
async function callAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    return Promise.reject(new Error('missing api key'))
  }

  const payload = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8
  })

  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.message?.content
          if (!text) return reject(new Error('empty ai content'))
          // 清理可能的 markdown 格式
          const cleanText = text.replace(/```json|```/g, '').trim()
          const parsed = JSON.parse(cleanText)
          resolve(parsed)
        } catch (err) {
          reject(err)
        }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

exports.main = async (event) => {
  const role = event.role || 'digital_nomad'
  const interests = Array.isArray(event.interests) ? event.interests : ['乡村建筑', '人文故事']
  const time = event.time || '1 小时'

  try {
    // 尝试 AI 生成
    const prompt = buildPrompt(role, interests, time)
    const aiRoute = await callAI(prompt)

    // 补充缺失字段
    if (aiRoute.points) {
      aiRoute.points = aiRoute.points.map((p, i) => ({
        ...p,
        id: `ai_${role}_${i}`,
        order: i + 1,
        image: `/pkg-assets/route-result/route-point-${(i % 5) + 1}.jpg`,
        taskButtonText: i === aiRoute.points.length - 1 ? '完成路线' : '继续探索',
        tags: p.tags || [interests[0] || '人文']
      }))
    }

    aiRoute.routeId = `ai_${role}_${Date.now()}`
    aiRoute.source = 'ai'

    return { success: true, source: 'ai', routeData: aiRoute }
  } catch (err) {
    console.warn('AI generation failed, use smart match:', err.message)

    // 智能匹配生成路线
    const smartRoute = generateRoute(role, interests, time)

    return { success: true, source: 'smart-match', routeData: smartRoute }
  }
}