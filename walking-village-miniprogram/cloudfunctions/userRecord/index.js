const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event) => {
  return {
    success: true,
    message: 'Demo 模式：用户记录已模拟保存',
    data: event || {}
  }
}
