const cloud = require('wx-server-sdk');
const { callAI } = require('./aiService');
const { generateReportPrompt } = require('./prompts');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function ok(data, meta) {
  return meta ? { success: true, data, meta } : { success: true, data };
}

function fail(errorCode, message) {
  return { success: false, errorCode, message };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildFallback(session) {
  return {
    title: '我的村庄观察报告',
    identity: session.userType || '村庄漫游者',
    routeName: session.routeName,
    summary: '这次体验中，你沿着路线经过了多个村庄点位，并留下了自己的观察和感受。这不是一次普通游览，而是一次你和村庄共同生成的故事。',
    moments: [
      '你选择了一条属于自己的村庄路线。',
      '你在点位中完成了观察和记录。',
      '你为这个村庄留下了一段个人记忆。'
    ],
    nextSuggestion: '下次可以尝试另一条路线，从新的角度重新打开村庄。'
  };
}

function normalizeReport(report, fallback) {
  return {
    title: typeof report.title === 'string' && report.title.trim() ? report.title.trim() : fallback.title,
    identity: typeof report.identity === 'string' && report.identity.trim() ? report.identity.trim() : fallback.identity,
    routeName: typeof report.routeName === 'string' && report.routeName.trim() ? report.routeName.trim() : fallback.routeName,
    summary: typeof report.summary === 'string' && report.summary.trim() ? report.summary.trim() : fallback.summary,
    moments: Array.isArray(report.moments) && report.moments.length ? report.moments.slice(0, 5) : fallback.moments,
    nextSuggestion: typeof report.nextSuggestion === 'string' && report.nextSuggestion.trim() ? report.nextSuggestion.trim() : fallback.nextSuggestion
  };
}

async function getSpotNames(spotIds) {
  if (!Array.isArray(spotIds) || !spotIds.length) return [];
  const res = await db.collection('spots').where({ _id: _.in(spotIds) }).get();
  const spotMap = {};
  (res.data || []).forEach((spot) => {
    spotMap[spot._id] = spot.name;
  });
  return spotIds.map((id) => spotMap[id]).filter(Boolean);
}

exports.main = async (event = {}, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('UNAUTHORIZED', '未获得用户身份');
  }

  const sessionId = isNonEmptyString(event.sessionId) ? event.sessionId.trim() : '';
  if (!sessionId) {
    return fail('INVALID_PARAMS', 'sessionId 不能为空');
  }

  try {
    const sessionRes = await db.collection('sessions').doc(sessionId).get();
    const session = sessionRes && sessionRes.data;

    if (!session || session.openid !== OPENID) {
      return fail('SESSION_NOT_FOUND', '会话不存在或无权限访问');
    }

    const notesRes = await db.collection('notes').where({
      sessionId,
      openid: OPENID
    }).get();
    const notes = notesRes.data || [];

    const visited = Array.isArray(session.visitedSpots) ? session.visitedSpots : [];
    const noteSpotIds = notes.map((item) => item.spotId).filter(Boolean);
    const spotIds = [...new Set([...visited, ...noteSpotIds])];
    const spotNames = await getSpotNames(spotIds);

    const fallback = buildFallback(session);
    let report = fallback;
    let usedFallback = false;

    if (!notes.length) {
      usedFallback = true;
    } else {
      try {
        const prompt = generateReportPrompt({
          userType: session.userType,
          routeName: session.routeName,
          routeTheme: session.routeTheme,
          spotNames,
          notes: notes.map((item) => ({
            spotName: item.spotName,
            note: item.note,
            images: item.images || []
          }))
        });
        const aiReport = await callAI(prompt);
        report = normalizeReport(aiReport, fallback);
      } catch (aiErr) {
        usedFallback = true;
        console.error('generateReport AI fallback:', aiErr.message || aiErr);
      }
    }

    await db.collection('sessions').doc(sessionId).update({
      data: {
        report,
        updatedAt: db.serverDate()
      }
    });

    return ok(report, { fallback: usedFallback });
  } catch (err) {
    console.error('generateReport failed:', err);
    return fail('DB_ERROR', '生成报告失败');
  }
};
