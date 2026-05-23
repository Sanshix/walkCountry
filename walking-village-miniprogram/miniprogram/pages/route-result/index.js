const { IMAGE_BASE_URL } = require('../../utils/config')
const store = require('../../utils/store')
const { matchRoute } = require('../../utils/routeMatcher')
const { safeNavigate } = require('../../utils/safeNavigate')

Page({
  data: {
    brandLogo: IMAGE_BASE_URL + '/home/home-brand-logo.png',
    route: {},
    mapCenter: { lat: 26.89, lng: 119.72 },
    markers: [],
    hasValidCoordinates: false
  },

  onLoad() {
    let route = store.getRoute()

    if (!route) {
      const role = store.getProfile()
      const pref = store.getPreference()
      route = matchRoute(role, pref.interests, pref.time)
      store.setRoute(route)
    }

    this.processRouteData(route)
  },

  processRouteData(route) {
    // 检查是否有有效坐标
    const hasCoords = route.points && route.points.some(p => p.lat && p.lng)

    // 生成地图标记点
    let markers = []
    let mapCenter = { lat: 26.89, lng: 119.72 }

    if (hasCoords && route.points) {
      // 计算中心点（取第一个点）
      const firstPoint = route.points[0]
      mapCenter = {
        lat: firstPoint.lat || 26.89,
        lng: firstPoint.lng || 119.72
      }

      // 生成标记点
      markers = route.points.map((point, index) => ({
        id: point.id || index,
        latitude: point.lat || 26.89,
        longitude: point.lng || 119.72,
        width: 24,
        height: 32,
        // 不使用自定义图标，使用默认标记样式
        callout: {
          content: point.name || `点位${index + 1}`,
          color: '#5a2f14',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#fffaf0',
          padding: 4,
          display: 'BYCLICK'
        }
      }))
    }

    this.setData({
      route,
      mapCenter,
      markers,
      hasValidCoordinates: hasCoords
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    const point = this.data.route.points.find(p => p.id === markerId)

    if (point) {
      wx.showModal({
        title: point.name,
        content: point.subtitle || point.story?.slice(0, 50) + '...',
        confirmText: '查看详情',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            this.openPointById(point.id)
          }
        }
      })
    }
  },

  openPoint(e) {
    const id = e.currentTarget.dataset.id
    this.openPointById(id)
  },

  openPointById(id) {
    store.setCurrentPoint(id)
    safeNavigate('/pages/point-detail/index?pointId=' + id, '点位页暂不可用')
  },

  startRoute() {
    const p = this.data.route.points[0]
    if (p) {
      store.setCurrentPoint(p.id)
      safeNavigate('/pages/point-detail/index?pointId=' + p.id, '点位页暂不可用')
    }
  }
})