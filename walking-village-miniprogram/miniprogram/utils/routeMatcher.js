const { mockRoutes } = require('./mockRoutes')

function timeToMinutes(time) {
  if (!time) return 60
  if (String(time).includes('30')) return 30
  if (String(time).includes('1')) return 60
  if (String(time).includes('2')) return 120
  if (String(time).includes('半日')) return 180
  return 60
}

function matchRoute(selectedRole, selectedInterests, selectedTime) {
  const role = selectedRole || 'digital_nomad'
  const interests = Array.isArray(selectedInterests) ? selectedInterests : []
  const targetTime = timeToMinutes(selectedTime)
  let best = mockRoutes[0]
  let bestScore = -1
  mockRoutes.forEach(route => {
    let score = 0
    if (route.suitableRoles.indexOf(role) >= 0) score += 50
    interests.forEach(item => { if (route.suitableInterests.indexOf(item) >= 0) score += 15 })
    const diff = Math.abs((route.durationMinutes || 60) - targetTime)
    if (diff <= 15) score += 20
    else if (diff <= 60) score += 10
    if (score > bestScore) { bestScore = score; best = route }
  })
  return best || mockRoutes[0]
}

function findPoint(route, pointId) {
  const r = route || mockRoutes[0]
  if (!pointId) return r.points[0]
  return r.points.find(p => p.id === pointId) || r.points[0]
}

module.exports = { matchRoute, findPoint, timeToMinutes }
