const auth = require('../../utils/auth')

Page({
  data: {
    loading: true,
    error: false,
    errorMsg: '',
    authUrl: '',
    showManualAuth: false,
    authCode: '',
    state: ''
  },

  onLoad(options) {
    // 检查是否从授权回调返回
    if (options.code) {
      this.handleAuthCode(options.code, options.state)
      return
    }

    // 获取授权URL
    this.getAuthUrl()
  },

  async getAuthUrl() {
    this.setData({ loading: true, error: false })

    try {
      if (!wx.cloud || !wx.cloud.callFunction) {
        // 云开发未初始化，使用手动模式
        this.setData({
          showManualAuth: true,
          loading: false
        })
        return
      }

      const res = await wx.cloud.callFunction({
        name: 'semiOAuth',
        data: { action: 'getAuthUrl' }
      })

      const result = res.result || {}

      if (!result.success) {
        throw new Error(result.message || '获取授权链接失败')
      }

      this.setData({
        authUrl: result.data.authUrl,
        state: result.data.state,
        loading: false
      })

      // 存储state用于后续验证
      wx.setStorageSync('semi_auth_state', result.data.state)

    } catch (err) {
      console.error('getAuthUrl error:', err)
      this.setData({
        error: true,
        errorMsg: err.message || '获取授权链接失败',
        loading: false,
        showManualAuth: true
      })
    }
  },

  onWebViewMessage(e) {
    console.log('WebView message:', e.detail)
    const data = e.detail.data || []

    // 从WebView获取授权码
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].code) {
        this.handleAuthCode(data[i].code, data[i].state)
        break
      }
    }
  },

  onWebViewError(e) {
    console.error('WebView error:', e.detail)
    // WebView加载失败，切换到手动模式
    this.setData({
      showManualAuth: true,
      error: false,
      loading: false
    })
  },

  retryLoad() {
    this.getAuthUrl()
  },

  // 手动授权流程
  async copyAuthUrl() {
    try {
      if (!this.data.authUrl) {
        await this.getAuthUrl()
      }

      if (this.data.authUrl) {
        wx.setClipboardData({
          data: this.data.authUrl,
          success: () => {
            wx.showToast({
              title: '链接已复制',
              icon: 'success'
            })
          }
        })
      }
    } catch (err) {
      wx.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  },

  onAuthCodeInput(e) {
    this.setData({ authCode: e.detail.value })
  },

  async submitAuthCode() {
    const { authCode } = this.data

    if (!authCode) {
      wx.showToast({
        title: '请输入授权码',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '正在登录...', mask: true })

    await this.handleAuthCode(authCode, this.data.state)
  },

  // 处理授权码
  async handleAuthCode(code, state) {
    wx.showLoading({ title: '正在登录...', mask: true })

    try {
      if (!wx.cloud || !wx.cloud.callFunction) {
        throw new Error('云开发未初始化')
      }

      const res = await wx.cloud.callFunction({
        name: 'semiOAuth',
        data: {
          action: 'exchangeToken',
          code,
          state: state || wx.getStorageSync('semi_auth_state')
        }
      })

      const result = res.result || {}

      if (!result.success) {
        throw new Error(result.message || '登录失败')
      }

      const userData = result.data || {}

      // 保存登录信息
      auth.setLoginInfo({
        mode: 'semi',
        isLogin: true,
        nickName: userData.handle || 'Semi用户',
        avatarUrl: '',
        openid: userData.sub || '',
        walletAddress: userData.wallet_address || '',
        accessToken: userData.access_token,
        loginTime: Date.now()
      })

      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 清除临时数据
      wx.removeStorageSync('semi_auth_state')

      // 跳转到首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/home/index'
        })
      }, 1000)

    } catch (err) {
      console.error('handleAuthCode error:', err)
      wx.hideLoading()
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    }
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({
          url: '/pages/login/index'
        })
      }
    })
  }
})
