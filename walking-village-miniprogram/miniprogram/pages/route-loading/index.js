const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute } = require('../../utils/routeMatcher')
const { safeRedirect } = require('../../utils/safeNavigate')
Page({
  data:{ brandLogo:IMAGE_BASE_URL + '/home/home-brand-logo.png', mapImage:IMAGE_BASE_URL + '/route-loading/route-loading-map.jpg', botImage:IMAGE_BASE_URL + '/route-loading/route-loading-ai-bot.png', roleLabel:'数字游民', interestText:'乡村建筑 / 人文故事 / 咖啡休闲', timeText:'1 小时' },
  onLoad(){
    const role=store.getProfile(); const pref=store.getPreference();
    this.setData({ roleLabel:store.roleMap[role] || '数字游民', interestText:(pref.interests||[]).join(' / '), timeText:pref.time || '1 小时' })
    this.generateRoute(role,pref)
  },
  handleUserClick(){ wx.showToast({title:'路演 Demo 暂不开放登录',icon:'none'}) },
  generateRoute(role,pref){
    const fallbackRoute = matchRoute(role, pref.interests, pref.time)
    const start = Date.now()
    const finish = (routeData, source) => {
      const route = routeData || fallbackRoute
      route.source = source || 'front-mock'
      store.setRoute(route)
      const wait = Math.max(0, 2200 - (Date.now() - start))
      setTimeout(()=>safeRedirect('/pages/route-result/index','路线结果页暂不可用'), wait)
    }
    if (!wx.cloud || !wx.cloud.callFunction) { finish(fallbackRoute,'front-mock'); return }
    wx.cloud.callFunction({ name:'aiRouteGen', data:{ role, interests:pref.interests, time:pref.time } })
      .then(res=>{
        if (res && res.result && res.result.routeData) finish(res.result.routeData, res.result.source || 'ai')
        else finish(fallbackRoute,'front-mock')
      })
      .catch(err=>{ console.warn('cloud failed, use front mock', err); finish(fallbackRoute,'front-mock') })
  }
})
