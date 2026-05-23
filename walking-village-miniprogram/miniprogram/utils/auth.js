const LOGIN_KEY = 'LOGIN_INFO'

function setLoginInfo(info) {
  const finalInfo = {
    mode: info.mode || 'guest',
    isLogin: Boolean(info.isLogin),
    nickName: info.nickName || '游客',
    avatarUrl: info.avatarUrl || '',
    openid: info.openid || '',
    walletAddress: info.walletAddress || '',
    accessToken: info.accessToken || '',
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

function isSemiLogin() {
  const info = getLoginInfo()
  return info && info.mode === 'semi'
}

function getWalletAddress() {
  const info = getLoginInfo()
  return info?.walletAddress || ''
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
  isSemiLogin,
  getWalletAddress,
  setGuestLogin,
  clearLoginInfo
}