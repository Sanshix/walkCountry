Page({
  handleWechatLogin() {
    wx.showLoading({
      title: '正在登录...',
      mask: true
    })

    wx.login({
      success: () => {
        wx.setStorageSync('LOGIN_INFO', {
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
      fail: () => {
        this.enterGuest()
      }
    })
  },

  handleGuestLogin() {
    this.enterGuest()
  },

  enterGuest() {
    wx.setStorageSync('LOGIN_INFO', {
      mode: 'guest',
      isLogin: false,
      nickName: '游客',
      avatarUrl: '',
      loginTime: Date.now()
    })

    wx.hideLoading()

    wx.showToast({
      title: '进入游客体验',
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
  }
})