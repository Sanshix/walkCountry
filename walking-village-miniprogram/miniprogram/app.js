const { IMAGE_BASE_URL } = require('./utils/config')
App({
  globalData: { imageBaseUrl: IMAGE_BASE_URL },
  onLaunch() {
    if (wx.cloud) {
      try { wx.cloud.init({ traceUser: false }) } catch (err) { console.warn('cloud init skipped', err) }
    }
  }
})
