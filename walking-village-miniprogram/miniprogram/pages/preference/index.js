const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { safeNavigate } = require('../../utils/safeNavigate')
const defaultInterestMap = {
  digital_nomad:['乡村建筑','人文故事','咖啡休闲'], tourist:['风景摄影','人文故事'], family:['非遗体验','风景摄影','人文故事'], student:['非遗体验','人文故事','乡村建筑'], rural_observer:['乡建观察','乡村建筑','人文故事']
}
Page({
  data:{ heroImage:IMAGE_BASE_URL + '/preference/preference-hero.jpg', summaryImage:IMAGE_BASE_URL + '/identity/identity-digital-nomad.png', selectedTime:'1 小时', role:'digital_nomad', roleLabel:'数字游民', roleDesc:'偏好轻松探索与文化体验，享受慢节奏的村庄生活。', interests:[], times:[{label:'30 分钟',value:'30 分钟'},{label:'1 小时',value:'1 小时'},{label:'2 小时',value:'2 小时'},{label:'半日游',value:'半日游'}] },
  onLoad(){
    const role = store.getProfile(); const selected = defaultInterestMap[role] || defaultInterestMap.digital_nomad
    const base = [ ['风景摄影','▣'], ['乡村建筑','⌂'], ['人文故事','☰'], ['非遗体验','❖'], ['咖啡休闲','♨'], ['乡建观察','⌕'] ]
    const iconMap={digital_nomad:'identity-digital-nomad.png',tourist:'identity-tourist.png',family:'identity-family.png',student:'identity-student.png',rural_observer:'identity-observer.png'}
    const descMap={digital_nomad:'偏好轻松探索与文化体验，享受慢节奏的村庄生活。',tourist:'轻松看风景，打卡村庄人文与田野风光。',family:'适合亲子互动和趣味任务。',student:'边走边学，理解乡村文化。',rural_observer:'关注空间更新与乡建实践。'}
    this.setData({ role, roleLabel: store.roleMap[role], roleDesc: descMap[role], summaryImage: IMAGE_BASE_URL + '/identity/' + iconMap[role], interests: base.map(i=>({name:i[0],symbol:i[1],checked:selected.indexOf(i[0])>=0})) })
  },
  goBack(){ wx.navigateBack() },
  toggleInterest(e){ const name=e.currentTarget.dataset.name; const interests=this.data.interests.map(i=>i.name===name?Object.assign({},i,{checked:!i.checked}):i); this.setData({interests}) },
  selectTime(e){ this.setData({ selectedTime:e.currentTarget.dataset.time }) },
  goGenerate(){ const selected=this.data.interests.filter(i=>i.checked).map(i=>i.name); if(!selected.length){ wx.showToast({title:'请至少选择一个兴趣',icon:'none'}); return } store.setPreference(selected,this.data.selectedTime); safeNavigate('/pages/route-loading/index','路线生成页暂不可用') }
})
