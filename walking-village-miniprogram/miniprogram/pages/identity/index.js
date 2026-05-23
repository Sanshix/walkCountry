const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { safeNavigate } = require('../../utils/safeNavigate')
Page({
  data:{
    brandLogo: IMAGE_BASE_URL + '/home/home-brand-logo.png',
    heroImage: IMAGE_BASE_URL + '/identity/identity-hero.jpg',
    selectedRole:'digital_nomad',
    roles:[
      { value:'digital_nomad', label:'数字游民', desc:'关注共创空间与在地生活', icon:IMAGE_BASE_URL + '/identity/identity-digital-nomad.png' },
      { value:'tourist', label:'普通游客', desc:'轻松看风景，感受村庄氛围', icon:IMAGE_BASE_URL + '/identity/identity-tourist.png' },
      { value:'family', label:'亲子家庭', desc:'适合互动打卡与亲子体验', icon:IMAGE_BASE_URL + '/identity/identity-family.png' },
      { value:'student', label:'研学学生', desc:'边走边学，理解乡村文化', icon:IMAGE_BASE_URL + '/identity/identity-student.png' },
      { value:'rural_observer', label:'乡建观察者', desc:'深入观察空间更新与乡建实践', icon:IMAGE_BASE_URL + '/identity/identity-observer.png' }
    ]
  },
  onLoad(){ this.setData({ selectedRole: store.getProfile() || 'digital_nomad' }) },
  goBack(){ wx.navigateBack({ fail:()=>wx.redirectTo({url:'/pages/home/index'}) }) },
  selectRole(e){ this.setData({ selectedRole:e.currentTarget.dataset.role }) },
  goNext(){ store.setProfile(this.data.selectedRole); safeNavigate('/pages/preference/index','兴趣选择页暂不可用') }
})
