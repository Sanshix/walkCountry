const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const cloudMockRoute = {
  routeId: 'cloud_mock_route',
  routeName: '数字游民乡建观察路线',
  suitableRoles: ['digital_nomad', 'rural_observer'],
  suitableInterests: ['乡村建筑', '人文故事', '咖啡休闲', '乡建观察'],
  totalDuration: '1 小时',
  durationMinutes: 60,
  pointCount: 5,
  routeDesc: '从村口导览点出发，串联老屋改造、青年共创咖啡馆、艺术空间与村民故事，感受村庄更新与在地生活。',
  mapImage: '/pkg-assets/route-result/route-map-digital.jpg',
  themeColor: '#ff7a00',
  summary: '这是云函数 Mock 兜底路线。即使 AI 不可用，仍可完整完成路演流程。',
  points: [
    { id:'cloud_01', order:1, name:'村口导览点', subtitle:'理解村庄更新的第一站', image:'/pkg-assets/route-result/route-point-1.jpg', location:'龙潭村入口', duration:'10 分钟', story:'村口是理解龙潭村的起点。这里连接着外来的游客、返乡的青年与仍然生活在村里的老人。曾经安静的山村，因为文创和共创重新被看见。', highlight:'村口不是入口，而是村庄重新连接外部世界的开始。', aiAudioText:'欢迎来到龙潭村。你现在站在村庄叙事的起点。沿着这条路往里走，你会看到老屋被重新点亮，咖啡香从木窗里飘出，年轻人与村民共同创造新的生活场景。', task:'观察村口的新旧元素，记录一个代表变化的细节。', taskButtonText:'记录观察', tags:['村口','乡建'] },
    { id:'cloud_02', order:2, name:'老屋改造空间', subtitle:'旧建筑里的新生活', image:'/pkg-assets/route-result/route-point-2.jpg', location:'旧祠堂巷 12 号', duration:'15 分钟', story:'这座老屋曾是村里闲置的生活空间。改造保留土墙、木梁和青瓦，同时加入新的公共功能。老屋新生，不只是建筑更新，更是生活方式的延续。', highlight:'修旧如旧，让老房子重新拥有被使用的理由。', aiAudioText:'你看到的这座老屋，保留了传统村落的肌理。乡建并不是把乡村变成城市，而是在原有生活基础上找到新的使用方式。', task:'拍下一个你最喜欢的空间细节。', taskButtonText:'拍照记录', tags:['老屋改造','建筑'] },
    { id:'cloud_03', order:3, name:'青年共创咖啡馆', subtitle:'一杯咖啡里的在地生活', image:'/pkg-assets/route-result/route-point-3.jpg', location:'村中心共创街区', duration:'15 分钟', story:'咖啡馆让村庄多了一种停留方式。这里连接乡村院落、田野风光和青年创业，也让游客与村民产生新的相遇。', highlight:'咖啡不是终点，它让更多人愿意在村里停下来。', aiAudioText:'在乡村出现咖啡馆，不只是消费业态变化，而是让游客、村民、新村民之间产生新的相遇。', task:'写下一句话描述你此刻感受到的村庄节奏。', taskButtonText:'写下感受', tags:['咖啡','共创'] },
    { id:'cloud_04', order:4, name:'47树美术馆', subtitle:'艺术介入乡村的窗口', image:'/pkg-assets/route-result/route-point-4.jpg', location:'龙潭文创片区', duration:'10 分钟', story:'艺术空间让村庄的表达不再只停留在风景。展陈和公共活动，让外来创作者与本地生活发生对话。', highlight:'当艺术进入乡村，村庄也开始讲述自己的新故事。', aiAudioText:'这里的美术空间连接了创作者、游客与村民，让乡村不只是被观看，也成为被创作和被讨论的现场。', task:'选择一个有感触的艺术元素，思考它和村庄生活的关系。', taskButtonText:'记录灵感', tags:['艺术','文创'] },
    { id:'cloud_05', order:5, name:'村民故事墙', subtitle:'听见土地上的人', image:'/pkg-assets/route-result/route-point-5.jpg', location:'村民公共空间', duration:'10 分钟', story:'村民故事墙记录着返乡、守望、创业和日常生活的片段。它提醒我们，乡建需要与村民共同完成。', highlight:'村庄更新的核心，始终是生活在这里的人。', aiAudioText:'走到这里，请把视线交还给人。每一个村民的经历，都是村庄历史的一部分。真正的乡建，需要看见他们的生活。', task:'写下一个你想带走的村民故事关键词。', taskButtonText:'完成路线', tags:['村民故事','总结'] }
  ]
}

function buildPrompt(event) {
  const role = event.role || 'digital_nomad'
  const interests = Array.isArray(event.interests) ? event.interests.join('、') : ''
  const time = event.time || '1 小时'
  return `你是一位乡村导览专家、乡村文旅策划师和故事生成 AI。请根据用户身份、兴趣标签和游览时间，为用户生成一条村庄叙事路线。路线必须基于熙岭乡龙潭文创片区的真实文旅语境，包含龙潭村、四坪村、墘头村、三峰村等文创片区背景。输出必须是严格 JSON，不要输出 Markdown，不要输出解释。\n用户身份：${role}\n兴趣标签：${interests}\n游览时间：${time}\n输出 JSON 字段：routeId, routeName, totalDuration, pointCount, routeDesc, points, summary。每个 point 包含 id, order, name, subtitle, location, duration, story, highlight, aiAudioText, task, taskButtonText, tags。点位数量 3-5 个。`
}

function callAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  if (!apiKey) return Promise.reject(new Error('missing api key'))
  const payload = JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl)
    const req = https.request({ hostname: url.hostname, path: url.pathname + url.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const text = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content
          if (!text) return reject(new Error('empty ai content'))
          resolve(JSON.parse(text.replace(/```json|```/g, '').trim()))
        } catch (err) { reject(err) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

exports.main = async (event) => {
  try {
    const prompt = buildPrompt(event || {})
    const aiRoute = await callAI(prompt)
    return { success: true, source: 'ai', routeData: aiRoute }
  } catch (err) {
    console.warn('AI failed, use cloud mock:', err.message)
    return { success: true, source: 'cloud-mock', routeData: cloudMockRoute }
  }
}
