const LOGIN_KEY = 'LOGIN_INFO'

function setLoginInfo(info) {
  const finalInfo = {
    mode: info.mode || 'guest',
    isLogin: Boolean(info.isLogin),
    nickName: info.nickName || '游客',
    avatarUrl: info.avatarUrl || '',
    loginTime: info.loginTime || Date.now()
  }

  wx.setStorageSync(LOGIN_KEY, finalInfo)
  return finalInfo
}

function getLoginInfo() {
  return wx.getStorageSync(LOGIN_KEY) || null
}

function isLoggedIn() {
  const info = getLoginInfo()
  return Boolean(info && info.isLogin)
}

function isGuest() {
  const info = getLoginInfo()
  return !info || info.mode === 'guest'
}

function setGuestLogin() {
  return setLoginInfo({
    mode: 'guest',
    isLogin: false,
    nickName: '游客',
    avatarUrl: '',
    loginTime: Date.now()
  })
}

function clearLoginInfo() {
  wx.removeStorageSync(LOGIN_KEY)
}

module.exports = {
  LOGIN_KEY,
  setLoginInfo,
  getLoginInfo,
  isLoggedIn,
  isGuest,
  setGuestLogin,
  clearLoginInfo
}