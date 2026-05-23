const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function ok(data) {
  return { success: true, data };
}

function fail(errorCode, message) {
  return { success: false, errorCode, message };
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

async function getFirstRouteByWhere(where) {
  const res = await db.collection('routes').where(where).limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function findRoute({ routeType, userType }) {
  let route = null;
  if (routeType) {
    route = await getFirstRouteByWhere({ routeType });
  }
  if (!route && userType) {
    route = await getFirstRouteByWhere({ targetUsers: userType });
  }
  if (!route) {
    const fallback = await db.collection('routes').doc('visitor_scenery_humanities').get();
    route = fallback && fallback.data ? fallback.data : null;
  }
  return route;
}

function normalizeSpot(spot) {
  return {
    id: spot._id,
    name: spot.name,
    intro: spot.intro,
    image: spot.image
  };
}

exports.main = async (event = {}, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('UNAUTHORIZED', '未获得用户身份');
  }

  try {
    const routeType = asString(event.routeType);
    const userType = asString(event.userType);
    const interest = asString(event.interest);

    const route = await findRoute({ routeType, userType });
    if (!route) {
      return fail('ROUTE_NOT_FOUND', '未找到可用路线');
    }

    const spotIds = Array.isArray(route.spotIds) ? route.spotIds : [];
    const spotRes = await db.collection('spots').where({
      _id: _.in(spotIds)
    }).get();

    const spotMap = {};
    (spotRes.data || []).forEach((spot) => {
      spotMap[spot._id] = spot;
    });

    const orderedSpots = spotIds
      .map((id) => spotMap[id])
      .filter(Boolean);

    const now = db.serverDate();
    const sessionData = {
      openid: OPENID,
      routeId: route._id,
      routeType: route.routeType,
      routeName: route.name,
      routeTheme: route.theme,
      routeSpotIds: spotIds,
      userType,
      interest,
      duration: asString(event.duration, route.duration) || route.duration,
      currentSpotIndex: 0,
      visitedSpots: [],
      notes: [],
      report: null,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const addRes = await db.collection('sessions').add({ data: sessionData });
    const sessionId = addRes._id || addRes.id;

    return ok({
      sessionId,
      route: {
        id: route._id,
        name: route.name,
        routeType: route.routeType,
        duration: sessionData.duration,
        theme: route.theme,
        description: route.description
      },
      spots: orderedSpots.map(normalizeSpot)
    });
  } catch (err) {
    console.error('createSession failed:', err);
    return fail('DB_ERROR', '创建体验会话失败');
  }
};
