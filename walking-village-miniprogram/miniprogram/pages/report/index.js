const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute } = require('../../utils/routeMatcher')
Page({
  data:{ brandLogo:IMAGE_BASE_URL + '/home/home-brand-logo.png', heroImage:IMAGE_BASE_URL + '/report/report-hero.jpg', route:{}, roleLabel:'数字游民', summary:'', moments:[] },
  onLoad(){ let route=store.getRoute(); if(!route){ const role=store.getProfile(); const pref=store.getPreference(); route=matchRoute(role,pref.interests,pref.time) } const role=store.getProfile(); const summary=route.summary || `你以${store.roleMap[role]}的视角，完成了一段属于自己的村庄叙事旅程。`; const moments=route.points.slice(0,3).map((p,i)=>({title:p.name,desc:p.highlight,image:IMAGE_BASE_URL + `/report/report-moment-${i+1}.jpg`})); this.setData({route,roleLabel:store.roleMap[role],summary,moments}) },
  goBack(){ wx.navigateBack() },
  user(){ wx.showToast({title:'路演 Demo 暂不开放登录',icon:'none'}) }, shareReport(){ wx.showToast({title:'已生成分享海报演示',icon:'none'}) }, restart(){ store.clearJourney(); wx.redirectTo({url:'/pages/home/index'}) }
})
