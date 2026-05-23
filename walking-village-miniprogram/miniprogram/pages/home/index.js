const { IMAGE_BASE_URL } = require('../../utils/config')
const { safeNavigate } = require('../../utils/safeNavigate')
const auth = require('../../utils/auth')

Page({
  data: {
    pageBgError: false,
    titleImageError: false,
    heroImageError: false,
    isLoggedIn: false,
    userInfo: null,
    homeConfig: {
      brandName: '会走路的村庄',
      brandLogo: IMAGE_BASE_URL + '/home/home-brand-logo.png',
      pageBg: IMAGE_BASE_URL + '/home/page-home-bg.png',
      titleImage: IMAGE_BASE_URL + '/home/home-main-text.png',
      mainTitle: '会走路的村庄',
      subtitle: 'AI 实地叙事导览 Agent',
      heroImage: IMAGE_BASE_URL + '/home/home-hero.jpg',
      heroRightImg: IMAGE_BASE_URL + '/home/herorightimg.jpg',
      heroCopyLine1: '每个村庄都有自己的故事',
      heroCopyLine2: '让 AI 带你，走进真实的土地',
      routeOverlay: IMAGE_BASE_URL + '/home/home-route-overlay.png',
      aiBot: IMAGE_BASE_URL + '/home/home-ai-bot.png',
      endPin: IMAGE_BASE_URL + '/home/home-end-pin.png',
      introLine1: '会走路的村庄，你的专属AI村庄叙事伙伴。',
      introLine2: '通过身份匹配、兴趣定制与故事路线规划，',
      introLine3: '为你打造独一无二的实地游览体验。',
      primaryButtonText: '开始体验',
      secondaryButtonText: 'AI 导览入口',
      featureCards: [
        { title: '身份匹配', desc: '了解你是谁\n推荐适合的故事', icon: IMAGE_BASE_URL + '/home/home-feature-identity.png' },
        { title: '兴趣定制', desc: '发现你感兴趣的主题\n定制专属内容', icon: IMAGE_BASE_URL + '/home/home-feature-interest.png' },
        { title: '故事路线', desc: '规划专属游览路线\n沉浸式叙事体验', icon: IMAGE_BASE_URL + '/home/home-feature-route.png' }
      ]
    }
  },

  onLoad() {
    this.initSafeArea()
  },

  onShow() {
    this.checkLoginStatus()
  },

  initSafeArea() {
    let safeHeight = 96

    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const menu = wx.getMenuButtonBoundingClientRect()
      safeHeight = menu.top + menu.height + 24
      if (!safeHeight || safeHeight < info.statusBarHeight) {
        safeHeight = info.statusBarHeight + 88
      }
    } catch (e) {
      safeHeight = 110
    }
  },

  checkLoginStatus() {
    const isLoggedIn = auth.isLoggedIn()
    const userInfo = auth.getLoginInfo()

    this.setData({
      isLoggedIn,
      userInfo: isLoggedIn ? userInfo : null
    })
  },

  // 点击用户头像
  handleUserClick() {
    if (this.data.isLoggedIn) {
      // 已登录：显示用户选项
      wx.showActionSheet({
        itemList: ['退出登录', '取消'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.logout()
          }
        }
      })
    } else {
      // 未登录：跳转登录页
      wx.navigateTo({
        url: '/pages/login/index',
        fail: () => {
          wx.showToast({
            title: '登录页暂未就绪',
            icon: 'none'
          })
        }
      })
    }
  },

  // 退出登录
  logout() {
    auth.clearLoginInfo()
    this.setData({
      isLoggedIn: false,
      userInfo: null
    })
    wx.showToast({
      title: '已退出登录',
      icon: 'none'
    })
  },

  onPageBgError() {
    this.setData({ pageBgError: true })
  },

  onTitleImageError() {
    this.setData({ titleImageError: true })
  },

  onHeroError() {
    this.setData({ heroImageError: true })
  },

  goIdentity() {
    safeNavigate('/pages/identity/index', '身份选择页暂不可用')
  },

  goGuideEntrance() {
    safeNavigate('/pages/route-loading/index?mode=guide', 'AI 导览入口暂不可用')
  }
})