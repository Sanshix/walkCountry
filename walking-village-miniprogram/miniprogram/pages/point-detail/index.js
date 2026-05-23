const store = require('../../utils/store')
const { matchRoute, findPoint } = require('../../utils/routeMatcher')
const { safeNavigate } = require('../../utils/safeNavigate')
Page({
  data:{ route:{pointCount:5}, point:{}, isLast:false },
  onLoad(options){ this.loadPoint(options.pointId) },
  loadPoint(pointId){ let route=store.getRoute(); if(!route){ const role=store.getProfile(); const pref=store.getPreference(); route=matchRoute(role,pref.interests,pref.time); store.setRoute(route) } const point=findPoint(route,pointId); const isLast=point.order>=route.points.length; store.setCurrentPoint(point.id); this.setData({route,point,isLast}) },
  goBack(){ wx.navigateBack() },
  goAudio(){ safeNavigate('/pages/ai-audio/index?pointId='+this.data.point.id,'AI讲解页暂不可用') },
  goPublish(){ safeNavigate('/pages/publish/index?pointId='+this.data.point.id,'发表页暂不可用') },
  goNext(){ const { route, point, isLast }=this.data; if(isLast){ safeNavigate('/pages/report/index','故事报告页暂不可用'); return } const next=route.points.find(p=>p.order===point.order+1); safeNavigate('/pages/point-detail/index?pointId='+next.id,'下一站暂不可用') }
})
