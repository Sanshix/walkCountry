const PROFILE_KEY = 'walkingVillage_profile'
const PREFERENCE_KEY = 'walkingVillage_preference'
const ROUTE_KEY = 'walkingVillage_route'
const POINT_KEY = 'walkingVillage_currentPoint'
const PUBLISH_KEY = 'walkingVillage_publishRecords'

const roleMap = {
  digital_nomad: '数字游民',
  tourist: '普通游客',
  family: '亲子家庭',
  student: '研学学生',
  rural_observer: '乡建观察者'
}

function setProfile(role) { wx.setStorageSync(PROFILE_KEY, role) }
function getProfile() { return wx.getStorageSync(PROFILE_KEY) || 'digital_nomad' }
function setPreference(interests, time) { wx.setStorageSync(PREFERENCE_KEY, { interests: interests || [], time: time || '1 小时' }) }
function getPreference() { return wx.getStorageSync(PREFERENCE_KEY) || { interests: ['乡村建筑', '人文故事', '咖啡休闲'], time: '1 小时' } }
function setRoute(routeData) { wx.setStorageSync(ROUTE_KEY, routeData) }
function getRoute() { return wx.getStorageSync(ROUTE_KEY) || null }
function setCurrentPoint(pointId) { wx.setStorageSync(POINT_KEY, pointId) }
function getCurrentPoint() { return wx.getStorageSync(POINT_KEY) || '' }
function addPublishRecord(record) {
  const list = getPublishRecords()
  const item = Object.assign({ id: `local_${Date.now()}`, createTime: '刚刚', likes: 0, comments: 0, collects: 0 }, record)
  wx.setStorageSync(PUBLISH_KEY, [item].concat(list))
  return item
}
function getPublishRecords() { return wx.getStorageSync(PUBLISH_KEY) || [] }
function clearJourney() {
  wx.removeStorageSync(PROFILE_KEY)
  wx.removeStorageSync(PREFERENCE_KEY)
  wx.removeStorageSync(ROUTE_KEY)
  wx.removeStorageSync(POINT_KEY)
}

module.exports = {
  roleMap,
  setProfile,
  getProfile,
  setPreference,
  getPreference,
  setRoute,
  getRoute,
  setCurrentPoint,
  getCurrentPoint,
  addPublishRecord,
  getPublishRecords,
  clearJourney
}
