const store = require('../../utils/store')
const { matchRoute, findPoint } = require('../../utils/routeMatcher')
const { safeNavigate } = require('../../utils/safeNavigate')

Page({
  data: {
    route: { pointCount: 5 },
    point: {},
    isLast: false,
    nextPointName: '',
    distanceToNext: '',
    walkTime: '',
    swiperCurrent: 0,
    swiperTotal: 4,
    isPlaying: false,
    audioProgress: 0,
    audioCurrentTime: '00:00',
    audioDuration: '00:00'
  },

  // 音频上下文
  audioContext: null,
  audioTimer: null,

  onLoad(options) {
    this.loadPoint(options.pointId)
  },

  onUnload() {
    this.stopAIAudio()
  },

  loadPoint(pointId) {
    let route = store.getRoute()
    if (!route) {
      const role = store.getProfile()
      const pref = store.getPreference()
      route = matchRoute(role, pref.interests, pref.time)
      store.setRoute(route)
    }

    const point = findPoint(route, pointId)
    const isLast = point.order >= route.points.length
    store.setCurrentPoint(point.id)

    // 计算距离下一个点
    let nextPointName = ''
    let distanceToNext = ''
    let walkTime = ''

    if (!isLast) {
      const nextPoint = route.points.find(p => p.order === point.order + 1)
      if (nextPoint) {
        nextPointName = nextPoint.name

        // 计算距离（如果有坐标）
        if (point.lat && point.lng && nextPoint.lat && nextPoint.lng) {
          const distance = this.calculateDistance(
            point.lat, point.lng,
            nextPoint.lat, nextPoint.lng
          )
          distanceToNext = Math.round(distance)
          walkTime = Math.ceil(distance / 80) // 按步行速度80米/分钟计算
        } else {
          // 如果没有坐标，使用默认值
          distanceToNext = Math.round(150 + Math.random() * 200)
          walkTime = Math.ceil(distanceToNext / 80)
        }
      }
    }

    this.setData({
      route,
      point,
      isLast,
      nextPointName,
      distanceToNext,
      walkTime,
      swiperTotal: point.image2 ? 4 : 3
    })
  },

  // 计算两点之间的距离（米）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  toRad(deg) {
    return deg * Math.PI / 180
  },

  // Swiper滑动事件
  onSwiperChange(e) {
    this.setData({
      swiperCurrent: e.detail.current
    })
  },

  // 播放AI语音讲解
  playAIAudio() {
    if (this.data.isPlaying) {
      // 如果正在播放，暂停
      this.pauseAIAudio()
      return
    }

    const { point } = this.data
    const text = point.aiAudioText || point.story || '这里是一个精彩的点位故事。'

    // 使用微信插件播放语音
    // 需要在app.json中配置插件
    this.playTextToSpeech(text)
  },

  // 文字转语音播放
  playTextToSpeech(text) {
    // 方案1: 使用微信同声传译插件（需要在app.json中配置）
    // 方案2: 使用云函数生成音频（需要部署）
    // 方案3: 使用浏览器内置语音（web-view）

    // 由于小程序限制，这里使用模拟播放效果
    // 实际项目中需要接入TTS服务

    wx.showLoading({
      title: '正在加载语音...',
      mask: true
    })

    // 模拟语音播放
    // 实际实现需要：
    // 1. 配置微信同声传译插件
    // 2. 或调用云函数生成音频URL
    // 3. 或使用第三方TTS API

    setTimeout(() => {
      wx.hideLoading()
      this.startMockAudioPlay(text)
    }, 1000)
  },

  // 模拟音频播放（实际项目中替换为真实TTS）
  startMockAudioPlay(text) {
    const duration = Math.ceil(text.length * 0.3) // 假设每字0.3秒
    let current = 0

    this.setData({
      isPlaying: true,
      audioDuration: this.formatTime(duration),
      audioProgress: 0,
      audioCurrentTime: '00:00'
    })

    this.audioTimer = setInterval(() => {
      current++
      const progress = Math.min((current / duration) * 100, 100)

      this.setData({
        audioProgress: progress,
        audioCurrentTime: this.formatTime(current)
      })

      if (current >= duration) {
        this.stopAIAudio()
        wx.showToast({
          title: '讲解完成',
          icon: 'success'
        })
      }
    }, 1000)
  },

  pauseAIAudio() {
    if (this.audioTimer) {
      clearInterval(this.audioTimer)
      this.audioTimer = null
    }
    this.setData({
      isPlaying: false
    })
  },

  stopAIAudio() {
    if (this.audioTimer) {
      clearInterval(this.audioTimer)
      this.audioTimer = null
    }
    this.setData({
      isPlaying: false,
      audioProgress: 0,
      audioCurrentTime: '00:00'
    })
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  },

  goBack() {
    this.stopAIAudio()
    wx.navigateBack()
  },

  goAudio() {
    this.stopAIAudio()
    safeNavigate('/pages/ai-audio/index?pointId=' + this.data.point.id, 'AI讲解页暂不可用')
  },

  goPublish() {
    safeNavigate('/pages/publish/index?pointId=' + this.data.point.id, '发表页暂不可用')
  },

  goNext() {
    this.stopAIAudio()
    const { route, point, isLast } = this.data

    if (isLast) {
      safeNavigate('/pages/report/index', '故事报告页暂不可用')
      return
    }

    const next = route.points.find(p => p.order === point.order + 1)
    safeNavigate('/pages/point-detail/index?pointId=' + next.id, '下一站暂不可用')
  }
})