const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute, findPoint } = require('../../utils/routeMatcher')
Page({
  data:{ content:'',photoCount:0,pointName:'老屋改造空间',posts:[] },
  onLoad(options){ let route=store.getRoute(); if(!route){ const role=store.getProfile(); const pref=store.getPreference(); route=matchRoute(role,pref.interests,pref.time) } const point=findPoint(route, options.pointId || store.getCurrentPoint()); const local=store.getPublishRecords(); const defaults=[{id:'demo1',avatar:IMAGE_BASE_URL + '/publish/publish-user-1.jpg',name:'山野小葵',time:'2小时前',point:point.name,text:'在老屋改造的空间里，阳光透过木窗洒在桌上，时光仿佛慢了下来。这里既有过去的痕迹，也有新的温度。',photo:IMAGE_BASE_URL + '/publish/publish-demo-photo-1.jpg',likes:28,comments:6,collects:15},{id:'demo2',avatar:IMAGE_BASE_URL + '/publish/publish-user-2.jpg',name:'行走的风',time:'5小时前',point:point.name,text:'村庄的黄昏太美了，炊烟、晚霞、归家的人，一切都那么治愈。',photo:IMAGE_BASE_URL + '/publish/publish-demo-photo-2.jpg',likes:36,comments:12,collects:21}]; this.setData({pointName:point.name,posts:local.concat(defaults)}) },
  goBack(){ wx.navigateBack() }, user(){ wx.showToast({title:'路演 Demo 暂不开放登录',icon:'none'}) },
  onInput(e){ this.setData({content:e.detail.value}) }, addImage(){ this.setData({photoCount:Math.min(4,this.data.photoCount+1)}); wx.showToast({title:'已模拟添加图片',icon:'none'}) },
  publish(){ const text=this.data.content.trim() || '我在这里记录下了一段属于自己的村庄感受。'; const item=store.addPublishRecord({avatar:IMAGE_BASE_URL + '/publish/publish-user-1.jpg',name:'我',time:'刚刚',point:this.data.pointName,text,photo:this.data.photoCount?IMAGE_BASE_URL + '/publish/publish-demo-photo-1.jpg':'',likes:0,comments:0,collects:0}); this.setData({posts:[item].concat(this.data.posts),content:'',photoCount:0}); wx.showToast({title:'发布成功',icon:'success'}) },
  like(e){ const id=e.currentTarget.dataset.id; const posts=this.data.posts.map(p=>p.id===id?Object.assign({},p,{likes:p.likes+1}):p); this.setData({posts}) }
})
