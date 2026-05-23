const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute } = require('../../utils/routeMatcher')
const { safeNavigate } = require('../../utils/safeNavigate')
Page({
  data:{ brandLogo:IMAGE_BASE_URL + '/home/home-brand-logo.png', route:{} },
  onLoad(){ let route=store.getRoute(); if(!route){ const role=store.getProfile(); const pref=store.getPreference(); route=matchRoute(role,pref.interests,pref.time); store.setRoute(route) } this.setData({route}) },
  goBack(){ wx.navigateBack() },
  user(){ wx.showToast({title:'路演 Demo 暂不开放登录',icon:'none'}) },
  openPoint(e){ const id=e.currentTarget.dataset.id; store.setCurrentPoint(id); safeNavigate('/pages/point-detail/index?pointId='+id,'点位页暂不可用') },
  startRoute(){ const p=this.data.route.points[0]; if(p){ store.setCurrentPoint(p.id); safeNavigate('/pages/point-detail/index?pointId='+p.id,'点位页暂不可用') } }
})
