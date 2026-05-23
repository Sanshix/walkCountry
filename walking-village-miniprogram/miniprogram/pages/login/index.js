const auth = require('../../utils/auth')

const imageBase = '/pkg-assets/login'

Page({
  data: {
    bgOk: true,
    titleOk: true,
    roadOk: true,
    safeTopStyle: '',
    showProfileModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
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

  // 点击微信登录按钮 - 显示弹窗
  handleWechatLogin() {
    this.setData({
      showProfileModal: true,
      tempAvatarUrl: '',
      tempNickName: ''
    })
  },

  // 选择头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ tempAvatarUrl: avatarUrl })
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value })
  },

  // 昵称输入框失焦
  onNicknameBlur(e) {
    if (e.detail.value) {
      this.setData({ tempNickName: e.detail.value })
    }
  },

  // 关闭弹窗
  closeProfileModal() {
    this.setData({
      showProfileModal: false,
      tempAvatarUrl: '',
      tempNickName: ''
    })
  },

  // 确认微信登录
  confirmProfile() {
    const { tempAvatarUrl, tempNickName } = this.data

    // 昵称可以为空，使用默认值
    const nickName = tempNickName || '微信用户'
    const avatarUrl = tempAvatarUrl || ''

    wx.showLoading({
      title: '正在登录...',
      mask: true
    })

    // 尝试云函数，失败则使用本地存储
    this.tryCloudLogin(nickName, avatarUrl)
  },

  // 尝试云函数登录
  async tryCloudLogin(nickName, avatarUrl) {
    try {
      // 检查云开发是否可用
      if (!wx.cloud) {
        console.log('wx.cloud 不可用，使用本地登录')
        this.localLoginSuccess(nickName, avatarUrl)
        return
      }

      // 尝试调用云函数
      const res = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'login',
          nickName: nickName,
          avatarUrl: avatarUrl
        }
      })

      const result = res?.result || {}
      const userData = result.data || {}

      // 云函数成功
      this.loginSuccess(
        userData.nickName || nickName,
        userData.avatarUrl || avatarUrl,
        userData.openid || ''
      )
    } catch (err) {
      console.error('云函数登录失败，使用本地登录:', err)
      // 云函数失败，使用本地存储
      this.localLoginSuccess(nickName, avatarUrl)
    }
  },

  // 本地登录成功（云函数不可用时的降级方案）
  localLoginSuccess(nickName, avatarUrl) {
    this.loginSuccess(nickName, avatarUrl, '')
  },

  // 登录成功处理
  loginSuccess(nickName, avatarUrl, openid) {
    auth.setLoginInfo({
      mode: 'wechat',
      isLogin: true,
      nickName: nickName,
      avatarUrl: avatarUrl,
      openid: openid,
      loginTime: Date.now()
    })

    wx.hideLoading()
    this.setData({ showProfileModal: false })

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    })

    setTimeout(() => {
      this.goHome()
    }, 800)
  },

  // 游客登录
  handleGuestLogin() {
    auth.setGuestLogin()

    wx.showToast({
      title: '进入游客体验',
      icon: 'none'
    })

    setTimeout(() => {
      this.goHome()
    }, 500)
  },

  // Semi登录
  handleSemiLogin() {
    wx.navigateTo({
      url: '/pages/semi-auth/index',
      fail: () => {
        wx.showToast({
          title: '打开授权页面失败',
          icon: 'none'
        })
      }
    })
  },

  // 跳转首页
  goHome() {
    wx.redirectTo({
      url: '/pages/home/index',
      fail: () => {
        wx.reLaunch({
          url: '/pages/home/index'
        })
      }
    })
  },

  handleTipClick() {
    wx.showToast({
      title: '登录后可保存路线与故事报告',
      icon: 'none'
    })
  },

  onBgError() {
    this.setData({ bgOk: false })
  },

  onTitleError() {
    this.setData({ titleOk: false })
  },

  onRoadError() {
    this.setData({ roadOk: false })
  }
})