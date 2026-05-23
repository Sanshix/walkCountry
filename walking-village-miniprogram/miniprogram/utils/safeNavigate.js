function safeNavigate(url, fallbackMessage) {
  wx.navigateTo({
    url,
    fail(err) {
      console.warn('navigate failed', url, err)
      wx.showToast({ title: fallbackMessage || '页面正在建设中', icon: 'none' })
    }
  })
}
function safeRedirect(url, fallbackMessage) {
  wx.redirectTo({
    url,
    fail(err) {
      console.warn('redirect failed', url, err)
      wx.showToast({ title: fallbackMessage || '页面跳转失败', icon: 'none' })
    }
  })
}
module.exports = { safeNavigate, safeRedirect }
