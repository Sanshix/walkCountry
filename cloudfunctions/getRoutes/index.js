const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function ok(data) {
  return { success: true, data };
}

function fail(errorCode, message) {
  return { success: false, errorCode, message };
}

function normalizeRoute(route) {
  return {
    id: route._id,
    name: route.name,
    routeType: route.routeType,
    targetUsers: route.targetUsers || [],
    duration: route.duration,
    theme: route.theme,
    description: route.description,
    spotIds: route.spotIds || []
  };
}

exports.main = async (event, context) => {
  try {
    const res = await db.collection('routes').get();
    const routes = (res.data || []).map(normalizeRoute);
    return ok(routes);
  } catch (err) {
    console.error('getRoutes failed:', err);
    return fail('DB_ERROR', '获取路线列表失败');
  }
};
