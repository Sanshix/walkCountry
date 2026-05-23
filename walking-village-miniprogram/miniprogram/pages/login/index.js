const auth = require('../../utils/auth')

const imageBase = '/pkg-assets/login'

Page({
  data: {
    bgOk: true,
    titleOk: true,
    roadOk: true,
    safeTopStyle: '',
    assets: {
      bg: `${imageBase}/login-bg.png`,
      logoTitle: `${imageBase}/login-logo-title.png`,
      roadCard: `${imageBase}/login-road-card.png`
    }
  },

  onLoad() {
    this.initSafeArea()
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

    this.setData({
      safeTopStyle: `height:${safeHeight}px;`
    })
  },

  handleWechatLogin() {
    wx.showLoading({
      title: '正在登录...',
      mask: true
    })

    wx.login({
      success: (loginRes) => {
        if (!loginRes || !loginRes.code) {
          this.enterGuestFallback()
          return
        }

        this.tryCloudLogin(loginRes.code)
      },
      fail: () => {
        this.enterGuestFallback()
      }
    })
  },

  tryCloudLogin(code) {
    if (!wx.cloud || !wx.cloud.callFunction) {
      this.mockWechatLogin()
      return
    }

    wx.cloud.callFunction({
      name: 'userLogin',
      data: { code }
    })
      .then((res) => {
        const result = res && res.result ? res.result : {}

        auth.setLoginInfo({
          mode: 'wechat',
          isLogin: true,
          nickName: result.nickName || '微信用户',
          avatarUrl: result.avatarUrl || '',
          loginTime: Date.now()
        })

        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        this.goHome()
      })
      .catch(() => {
        this.mockWechatLogin()
      })
  },

  mockWechatLogin() {
    auth.setLoginInfo({
      mode: 'wechat',
      isLogin: true,
      nickName: '微信用户',
      avatarUrl: '',
      loginTime: Date.now()
    })

    wx.hideLoading()
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    })

    this.goHome()
  },

  handleGuestLogin() {
    auth.setGuestLogin()

    wx.showToast({
      title: '进入游客体验',
      icon: 'none'
    })

    this.goHome()
  },

  enterGuestFallback() {
    auth.setGuestLogin()

    wx.hideLoading()
    wx.showToast({
      title: '已进入游客体验',
      icon: 'none'
    })

    this.goHome()
  },

  goHome() {
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/home/index',
        fail: () => {
          wx.reLaunch({
            url: '/pages/home/index'
          })
        }
      })
    }, 500)
  },

  handleTipClick() {
    wx.showToast({
      title: '登录后可保存路线与故事报告',
      icon: 'none'
    })
  },

  onBgError() {
    this.setData({
      bgOk: false
    })
  },

  onTitleError() {
    this.setData({
      titleOk: false
    })
  },

  onRoadError() {
    this.setData({
      roadOk: false
    })
  }
})