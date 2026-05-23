const { IMAGE_BASE_URL } = require('./config')
const imageBaseUrl = IMAGE_BASE_URL

const mockRoutes = [
  {
    routeId: 'digital_nomad_route',
    routeName: '数字游民乡建观察路线',
    suitableRoles: ['digital_nomad', 'rural_observer'],
    suitableInterests: ['乡村建筑', '人文故事', '咖啡休闲', '乡建观察'],
    totalDuration: '1 小时',
    durationMinutes: 60,
    pointCount: 5,
    routeDesc: '从村口导览点出发，串联老屋改造、青年共创咖啡馆、艺术空间与村民故事，感受村庄更新与在地生活。',
    mapImage: imageBaseUrl + '/route-result/route-map-digital.jpg',
    themeColor: '#ff7a00',
    summary: '你以数字游民的视角，深度走访了龙潭村的乡建空间与日常现场。这段旅程不只是观察，更是一次与在地生活的连接。',
    points: [
      { id:'digital_01', order:1, name:'村口导览点', subtitle:'理解村庄更新的第一站', image:imageBaseUrl + '/route-result/route-point-1.jpg', location:'龙潭村入口', duration:'10 分钟', story:'村口是理解龙潭村的起点。这里连接着外来的游客、返乡的青年与仍然生活在村里的老人。曾经安静的山村，因为文创和共创重新被看见。站在村口，你看到的不只是一条进村的路，也是一段乡村更新慢慢展开的序章。', highlight:'村口不是入口，而是村庄重新连接外部世界的开始。', aiAudioText:'欢迎来到龙潭村。你现在站在村庄叙事的起点。过去，这里只是村民出入的普通路口；今天，它成为游客理解村庄变化的第一幕。沿着这条路往里走，你会看到老屋被重新点亮，咖啡香从木窗里飘出，年轻人与村民共同创造新的生活场景。', task:'请观察村口周围的新旧元素，记录一个你认为最能代表“变化”的细节。', taskButtonText:'记录观察', tags:['村口','乡建','空间观察'] },
      { id:'digital_02', order:2, name:'老屋改造空间', subtitle:'旧建筑里的新生活', image:imageBaseUrl + '/route-result/route-point-2.jpg', location:'旧祠堂巷 12 号', duration:'15 分钟', story:'这座老屋曾是村里闲置的生活空间。改造没有抹去土墙、木梁和青瓦，而是在原有肌理中加入新的功能。它可能是议事空间，也可能是手作分享和游客交流的地方。老屋新生，不只是建筑更新，更是乡村生活方式的延续。', highlight:'修旧如旧，让老房子重新拥有被使用的理由。', aiAudioText:'你看到的这座老屋，保留了传统村落的肌理。它的墙面、屋檐和木构并不完美，却正是这种不完美保存了时间的痕迹。乡建并不是把乡村变成城市，而是在原有生活基础上找到新的使用方式。', task:'拍下一个你最喜欢的空间细节，例如窗、门、梁、墙面或院落。', taskButtonText:'拍照记录', tags:['老屋改造','建筑','乡建'] },
      { id:'digital_03', order:3, name:'青年共创咖啡馆', subtitle:'一杯咖啡里的在地生活', image:imageBaseUrl + '/route-result/route-point-3.jpg', location:'村中心共创街区', duration:'15 分钟', story:'咖啡馆让村庄多了一种停留方式。这里不是城市咖啡馆的复制品，而是把乡村院落、田野风光和青年创业连接在一起的生活空间。坐下来喝一杯咖啡，你会发现村庄的慢节奏，也能遇见返乡者和新村民的故事。', highlight:'咖啡不是终点，它让更多人愿意在村里停下来。', aiAudioText:'在乡村里出现咖啡馆，并不只是消费业态的变化。它让游客、村民、新村民之间产生新的相遇。有人在这里办公，有人在这里聊天，也有人在这里第一次认真看见这个村庄。', task:'找一个适合停留的位置，写下一句话描述你此刻感受到的村庄节奏。', taskButtonText:'写下感受', tags:['咖啡','数字游民','共创'] },
      { id:'digital_04', order:4, name:'47树美术馆', subtitle:'艺术介入乡村的窗口', image:imageBaseUrl + '/route-result/route-point-4.jpg', location:'龙潭文创片区', duration:'10 分钟', story:'艺术空间让村庄的表达不再只停留在风景。画作、展陈和公共活动，让外来创作者与本地生活发生对话。这里的艺术不是高高在上的展品，而是参与乡村更新的一种方式。', highlight:'当艺术进入乡村，村庄也开始讲述自己的新故事。', aiAudioText:'这里的美术空间，是龙潭文创气质的重要组成部分。它连接了创作者、游客与村民，让乡村不只是被观看，也成为被创作和被讨论的现场。', task:'选择一个你最有感触的艺术元素，思考它和村庄生活有什么关系。', taskButtonText:'记录灵感', tags:['艺术','美术馆','文创'] },
      { id:'digital_05', order:5, name:'村民故事墙', subtitle:'听见土地上的人', image:imageBaseUrl + '/route-result/route-point-5.jpg', location:'村民公共空间', duration:'10 分钟', story:'一座村庄真正动人的地方，不只在建筑和风景，也在人的故事里。村民故事墙记录着返乡、守望、创业和日常生活的片段。它提醒我们，乡建不是外来者单方面的设计，而是与村民共同完成的生活实践。', highlight:'村庄更新的核心，始终是生活在这里的人。', aiAudioText:'走到这里，你已经看过空间、业态和艺术。最后请把视线交还给人。每一个村民的经历，都是村庄历史的一部分。真正的乡建，需要看见他们的生活，也尊重他们的选择。', task:'写下一个你想带走的村民故事关键词。', taskButtonText:'完成路线', tags:['村民故事','在地生活','总结'] }
    ]
  },
  {
    routeId: 'tourist_humanity_route',
    routeName: '游客人文风景路线',
    suitableRoles: ['tourist'],
    suitableInterests: ['风景摄影', '人文故事', '咖啡休闲'],
    totalDuration: '1 小时',
    durationMinutes: 60,
    pointCount: 5,
    routeDesc: '从回村桥进入古村，沿溪畔古巷、书屋、酒博馆与田野观景点，轻松感受龙潭村的人文与风景。',
    mapImage: imageBaseUrl + '/route-result/route-map-tourist.jpg',
    themeColor: '#ff8a00',
    summary: '你用轻松游客的视角，走过桥、古巷、书屋和田野，把龙潭村的风景、人文和慢生活收入自己的旅程。',
    points: [
      { id:'tourist_01', order:1, name:'回村桥', subtitle:'走进古村的第一眼风景', image:imageBaseUrl + '/route-result/route-point-1.jpg', location:'龙潭村溪口', duration:'10 分钟', story:'回村桥连接着村庄的过去与今天。桥下溪水流过，桥边的老屋和远山组成了最适合拍照的画面。对普通游客来说，这里是进入龙潭村最有仪式感的地方，也是理解古村气质的第一眼。', highlight:'一座桥，把风景、人和村庄记忆连接起来。', aiAudioText:'你现在看到的回村桥，是进入龙潭村最温柔的一幕。桥下有溪水，远处是山，近处是老屋。很多游客来到这里的第一张照片，都会把桥、溪和村庄放在同一个画面里，因为它们共同组成了龙潭村的入口记忆。', task:'在桥边拍一张包含溪水、老屋和远山的照片。', taskButtonText:'拍照打卡', tags:['古桥','摄影','风景'] },
      { id:'tourist_02', order:2, name:'溪畔古巷', subtitle:'慢慢走，听见村庄的声音', image:imageBaseUrl + '/route-result/route-point-2.jpg', location:'溪畔石板路', duration:'10 分钟', story:'溪畔古巷保留了村庄日常生活的温度。水声、石路、墙面和屋檐共同构成了龙潭村的慢节奏。这里不需要匆忙赶路，适合边走边看，感受山村的清凉与安静。', highlight:'最好的风景，常常藏在慢下来的脚步里。', aiAudioText:'请把脚步放慢一点。你身边的石板路、老墙和溪水声，都是这条古巷的一部分。这里没有强烈的景点提示，却有最真实的村庄日常。慢慢走，你会听见风穿过屋檐，也会看到生活留下的痕迹。', task:'闭眼听 10 秒钟，记录你听到的三个声音。', taskButtonText:'记录声音', tags:['古巷','溪流','慢游'] },
      { id:'tourist_03', order:3, name:'随喜书屋', subtitle:'在书页里遇见乡村', image:imageBaseUrl + '/route-result/route-point-3.jpg', location:'龙潭村书屋', duration:'15 分钟', story:'书屋让村庄有了安静停留的角落。游客可以在这里翻书、休息，也可以透过窗户看见村里的日常。它让旅程不只是走马观花，而是有了一段可以慢慢阅读的时间。', highlight:'书屋让旅行从打卡变成停留。', aiAudioText:'随喜书屋是一个适合停下来的地方。你可以随手翻开一本书，也可以透过窗户看一会儿村庄。乡村旅行并不一定只有赶路，有时候，一段安静的阅读也是理解村庄的方式。', task:'选择一个你喜欢的角落，写下一句和村庄有关的话。', taskButtonText:'写一句话', tags:['书屋','人文','休闲'] },
      { id:'tourist_04', order:4, name:'龙潭酒博馆', subtitle:'一口地方风味里的记忆', image:imageBaseUrl + '/route-result/route-point-4.jpg', location:'龙潭酒文化展示点', duration:'15 分钟', story:'酒博馆展示着地方风味与乡村生活的关系。黄酒、器具和展陈背后，是村民代代相传的生活方式。游客在这里可以理解，乡村文化不只存在于建筑中，也藏在饮食、节庆与人情往来里。', highlight:'地方风味，是最容易被记住的乡愁。', aiAudioText:'在酒博馆里，你看到的不只是酒，更是乡村生活的一部分。器具、发酵、节庆和待客方式，共同构成了这里的地方记忆。味道常常比文字更容易被带走，也更容易唤起乡愁。', task:'找一个和地方饮食有关的细节，记录它背后的故事想象。', taskButtonText:'记录风味', tags:['酒博馆','地方风味','人文'] },
      { id:'tourist_05', order:5, name:'田野观景台', subtitle:'把龙潭村装进一张照片', image:imageBaseUrl + '/route-result/route-point-5.jpg', location:'村外田野平台', duration:'10 分钟', story:'田野观景台适合作为路线的收尾。站在这里，可以看到村庄、田野和远山层层展开。白墙黛瓦散落在山谷之间，像一幅温暖的水彩画。这里也是最适合拍摄整段旅程记忆的地方。', highlight:'从这里回望，整座村庄都变成了你的故事背景。', aiAudioText:'站在田野观景台回望，龙潭村会变成一个完整的画面。村庄、道路、田野和远山连在一起，你刚刚走过的地方，也都成为画面中的一部分。这里适合拍下本次旅程的收尾照片。', task:'拍一张本次路线的收尾照片，并为它取一个名字。', taskButtonText:'完成打卡', tags:['田野','观景','摄影'] }
    ]
  },
  {
    routeId: 'study_family_route',
    routeName: '亲子研学非遗体验路线',
    suitableRoles: ['family', 'student'],
    suitableInterests: ['非遗体验', '人文故事', '乡村建筑', '风景摄影'],
    totalDuration: '2 小时',
    durationMinutes: 120,
    pointCount: 5,
    routeDesc: '围绕艺术教育、非遗戏曲、手作体验、梯田观察与星空探索，适合亲子家庭和研学学生边走边学。',
    mapImage: imageBaseUrl + '/route-result/route-map-study.jpg',
    themeColor: '#f28a00',
    summary: '你和同行者边走边学，在艺术、非遗、手作、田野和星空之间，完成了一次温暖又有知识感的乡村研学。',
    points: [
      { id:'study_01', order:1, name:'龙潭公益艺术教育中心', subtitle:'人人都是艺术家的起点', image:imageBaseUrl + '/route-result/route-point-1.jpg', location:'龙潭艺术教育中心', duration:'25 分钟', story:'艺术教育中心让孩子和游客理解，艺术并不只属于美术馆，也可以发生在乡村。这里曾吸引许多人来到村里学习、创作和交流，让龙潭村因为艺术重新被看见。', highlight:'艺术让村庄有了新的表达方式。', aiAudioText:'欢迎来到艺术教育中心。这里把艺术带进乡村，也把乡村带进孩子的创作里。你可以把房子、树、桥和田野都看作创作素材。乡村不是遥远的背景，而是可以被观察、被画下、被表达的生活现场。', task:'画下你看到的一个村庄元素，可以是房子、树、桥或一条小路。', taskButtonText:'开始小创作', tags:['艺术教育','研学','亲子'] },
      { id:'study_02', order:2, name:'四平戏博物馆', subtitle:'听见古老戏曲的声音', image:imageBaseUrl + '/route-result/route-point-2.jpg', location:'四坪村非遗展示点', duration:'25 分钟', story:'四平戏是当地重要的传统文化。博物馆通过服饰、道具和故事，让孩子理解戏曲如何陪伴一代代村民的生活。这里适合用观察和提问的方式进入非遗世界。', highlight:'非遗不是课本里的名词，而是曾经热闹生活的一部分。', aiAudioText:'四平戏博物馆记录着地方戏曲的声音。过去，戏台是村里重要的公共生活空间。村民在这里看戏、相聚，也通过唱念做打记住历史和传说。今天我们用观察道具和服饰的方式，重新听见那些声音。', task:'找出一个你最感兴趣的戏曲元素，并说出它可能代表什么。', taskButtonText:'完成观察', tags:['非遗','戏曲','研学'] },
      { id:'study_03', order:3, name:'四坪陶艺馆', subtitle:'用手触摸土地的温度', image:imageBaseUrl + '/route-result/route-point-3.jpg', location:'四坪手作体验区', duration:'25 分钟', story:'陶艺体验让孩子通过双手理解泥土与器物的关系。泥土来自土地，经过揉捏、塑形和烧制，变成可以使用的器物。这种过程让乡村研学变得具体而有趣。', highlight:'用手完成的作品，会让孩子记住土地的温度。', aiAudioText:'陶艺馆里最重要的不是做出完美作品，而是感受泥土如何在手中变化。泥土来自土地，器物服务生活。你可以想象，一只碗、一只杯子，也许都承载着某个家庭的日常记忆。', task:'观察一个陶器的形状，想象它可以装下什么乡村记忆。', taskButtonText:'记录发现', tags:['陶艺','手作','亲子互动'] },
      { id:'study_04', order:4, name:'四坪食光梯田', subtitle:'在田野里理解四季', image:imageBaseUrl + '/route-result/route-point-4.jpg', location:'四坪梯田', duration:'25 分钟', story:'梯田让孩子看到食物从哪里来，也能理解农事与季节的关系。站在田边，可以观察田埂、水渠、作物和远山。这里适合亲子一起完成自然观察任务。', highlight:'一块田，就是一间打开的自然教室。', aiAudioText:'请看看眼前的梯田。田埂、水渠、作物和山坡共同组成了乡村的自然课堂。食物并不是从超市出现的，它们经历阳光、水、泥土和人的照料，才来到我们的餐桌。', task:'请观察田野中的三种颜色，并说出它们分别来自哪里。', taskButtonText:'完成自然观察', tags:['梯田','自然教育','摄影'] },
      { id:'study_05', order:5, name:'四坪天文馆', subtitle:'从村庄望向星空', image:imageBaseUrl + '/route-result/route-point-5.jpg', location:'四坪天文观察点', duration:'20 分钟', story:'天文馆把孩子的视线从村庄带向星空。乡村较少的光污染，让夜空成为天然课堂。这里可以把自然、科学和想象力连接起来，为研学路线留下一个充满好奇心的结尾。', highlight:'看见星空，也是在重新认识我们脚下的土地。', aiAudioText:'旅程的最后，我们从村庄望向星空。乡村的夜晚更容易看见天空，也更容易让人产生问题。星星在哪里？时间如何流动？我们脚下的土地和头顶的宇宙，其实都值得认真观察。', task:'写下一个你想问星空的问题。', taskButtonText:'完成研学', tags:['天文','科学','研学'] }
    ]
  }
]

module.exports = { mockRoutes, imageBaseUrl }
