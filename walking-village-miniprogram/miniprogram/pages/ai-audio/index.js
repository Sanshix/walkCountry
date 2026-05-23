const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute, findPoint } = require('../../utils/routeMatcher')
Page({
  data:{ avatar:IMAGE_BASE_URL + '/ai-audio/ai-guide-avatar.png', point:{}, playing:false,current:72,duration:228,progress:31,currentText:'01:12',speed:'1.0',showText:true,bars:[18,24,34,28,46,60,42,34,26,18,44,70,110,76,42,28,22,18,20,25,34,40,28,20] },
  timer:null,
  onLoad(options){ let route=store.getRoute(); if(!route){ const role=store.getProfile(); const pref=store.getPreference(); route=matchRoute(role,pref.interests,pref.time) } const point=findPoint(route,options.pointId || store.getCurrentPoint()); this.setData({point}) },
  onUnload(){ if(this.timer) clearInterval(this.timer) },
  goBack(){ wx.navigateBack() }, user(){ wx.showToast({title:'路演 Demo 暂不开放登录',icon:'none'}) },
  toggleText(){ this.setData({showText:!this.data.showText}) },
  changeSpeed(){ const seq=['1.0','1.25','1.5']; const idx=seq.indexOf(this.data.speed); this.setData({speed:seq[(idx+1)%seq.length]}) },
  togglePlay(){ const playing=!this.data.playing; this.setData({playing}); if(playing){ this.timer=setInterval(()=>{ let c=this.data.current+1; if(c>this.data.duration)c=0; const m=String(Math.floor(c/60)).padStart(2,'0'), s=String(c%60).padStart(2,'0'); this.setData({current:c,currentText:m+':'+s,progress:Math.floor(c/this.data.duration*100)}) },1000)} else { clearInterval(this.timer) } }
})
