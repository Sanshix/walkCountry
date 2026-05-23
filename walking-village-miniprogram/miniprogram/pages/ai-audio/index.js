const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute, findPoint } = require('../../utils/routeMatcher')

Page({
  data: {
    avatar: IMAGE_BASE_URL + '/ai-audio/ai-guide-avatar.png',
    point: {},
    playing: false,
    current: 0,
    duration: 0,
    progress: 0,
    currentText: '00:00',
    speed: '1.0',
    showText: true,
    bars: [18, 24, 34, 28, 46, 60, 42, 34, 26, 18, 44, 70, 110, 76, 42, 28, 22, 18, 20, 25, 34, 40, 28, 20]
  },

  audioContext: null,
  timer: null,

  onLoad(options) {
    let route = store.getRoute()
    if (!route) {
      const role = store.getProfile()
      const pref = store.getPreference()
      route = matchRoute(role, pref.interests, pref.time)
    }
    const point = findPoint(route, options.pointId || store.getCurrentPoint())

    // 计算音频时长（基于文本长度）
    const textLength = (point.aiAudioText || point.story || '').length
    const duration = Math.ceil(textLength * 0.3) // 每字约0.3秒

    this.setData({
      point,
      duration,
      durationText: this.formatTime(duration)
    })

    // 创建音频上下文（如果使用真实音频URL）
    this.audioContext = wx.createInnerAudioContext()
  },

  onUnload() {
    this.stopPlay()
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  },

  goBack() {
    this.stopPlay()
    wx.navigateBack()
  },

  toggleText() {
    this.setData({ showText: !this.data.showText })
  },

  changeSpeed() {
    const seq = ['1.0', '1.25', '1.5', '0.75']
    const idx = seq.indexOf(this.data.speed)
    this.setData({ speed: seq[(idx + 1) % seq.length] })

    if (this.audioContext) {
      this.audioContext.playbackRate = parseFloat(this.data.speed)
    }
  },

  // 播放/暂停切换
  togglePlay() {
    if (this.data.playing) {
      this.pausePlay()
    } else {
      this.startPlay()
    }
  },

  startPlay() {
    const { point, duration, speed } = this.data
    const text = point.aiAudioText || point.story || '这是一个精彩的故事点位。'

    this.setData({ playing: true })

    // 方案1: 使用模拟播放（无真实音频）
    this.mockAudioPlay(text)

    // 方案2: 如果有真实音频URL，使用InnerAudioContext
    // if (point.audioUrl) {
    //   this.playRealAudio(point.audioUrl)
    // }
  },

  pausePlay() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.setData({ playing: false })
  },

  stopPlay() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.audioContext) {
      this.audioContext.stop()
    }
    this.setData({
      playing: false,
      current: 0,
      progress: 0,
      currentText: '00:00'
    })
  },

  // 模拟音频播放
  mockAudioPlay(text) {
    const speedFactor = parseFloat(this.data.speed)
    const effectiveDuration = this.data.duration / speedFactor

    // 使用微信的语音合成（需要配置插件）
    // 或者使用Web Speech API（需要在web-view中）

    let current = 0
    this.timer = setInterval(() => {
      current++
      const progress = Math.min((current / effectiveDuration) * 100, 100)

      this.setData({
        current,
        progress,
        currentText: this.formatTime(current)
      })

      if (current >= effectiveDuration) {
        this.stopPlay()
        wx.showToast({
          title: '讲解完成',
          icon: 'success'
        })
      }
    }, 1000 / speedFactor)
  },

  // 真实音频播放（如果有音频URL）
  playRealAudio(url) {
    if (!this.audioContext) return

    this.audioContext.src = url
    this.audioContext.playbackRate = parseFloat(this.data.speed)

    this.audioContext.onPlay(() => {
      this.setData({ playing: true })
    })

    this.audioContext.onTimeUpdate(() => {
      const current = Math.floor(this.audioContext.currentTime)
      const duration = Math.floor(this.audioContext.duration)
      const progress = (current / duration) * 100

      this.setData({
        current,
        progress,
        currentText: this.formatTime(current)
      })
    })

    this.audioContext.onEnded(() => {
      this.stopPlay()
      wx.showToast({
        title: '讲解完成',
        icon: 'success'
      })
    })

    this.audioContext.onError((err) => {
      console.error('音频播放错误:', err)
      this.stopPlay()
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      })
    })

    this.audioContext.play()
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  },

  // 跳转到任务
  goToTask() {
    const { point } = this.data
    wx.navigateTo({
      url: '/pages/publish/index?pointId=' + point.id
    })
  },

  user() {
    wx.showToast({
      title: '路演 Demo 暂不开放登录',
      icon: 'none'
    })
  }
})