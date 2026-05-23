const cloud = require('wx-server-sdk');
const { callAI } = require('./aiService');
const { generateSpotPrompt } = require('./prompts');

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

function buildFallback(spot) {
  return {
    aiStory: `${spot.name}是这条路线中的重要点位。它连接了村庄的空间、记忆和当下生活。`,
    task: spot.defaultTask || '请观察这个点位中最吸引你的一个细节。',
    photoTip: '请拍下一处你觉得最能代表这个地方的画面。',
    question: spot.defaultQuestion || '你想给这个地方留下一句什么话？'
  };
}

function pickAiFields(ai, fallback) {
  return {
    aiStory: typeof ai.aiStory === 'string' && ai.aiStory.trim() ? ai.aiStory.trim() : fallback.aiStory,
    task: typeof ai.task === 'string' && ai.task.trim() ? ai.task.trim() : fallback.task,
    photoTip: typeof ai.photoTip === 'string' && ai.photoTip.trim() ? ai.photoTip.trim() : fallback.photoTip,
    question: typeof ai.question === 'string' && ai.question.trim() ? ai.question.trim() : fallback.question
  };
}

exports.main = async (event = {}, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('UNAUTHORIZED', '未获得用户身份');
  }

  const sessionId = isNonEmptyString(event.sessionId) ? event.sessionId.trim() : '';
  const spotId = isNonEmptyString(event.spotId) ? event.spotId.trim() : '';

  if (!sessionId || !spotId) {
    return fail('INVALID_PARAMS', 'sessionId 和 spotId 不能为空');
  }

  try {
    const sessionRes = await db.collection('sessions').doc(sessionId).get();
    const session = sessionRes && sessionRes.data;

    if (!session || session.openid !== OPENID) {
      return fail('SESSION_NOT_FOUND', '会话不存在或无权限访问');
    }

    if (!Array.isArray(session.routeSpotIds) || !session.routeSpotIds.includes(spotId)) {
      return fail('SPOT_NOT_FOUND', '该点位不属于当前路线');
    }

    const spotRes = await db.collection('spots').doc(spotId).get();
    const spot = spotRes && spotRes.data;

    if (!spot) {
      return fail('SPOT_NOT_FOUND', '点位不存在');
    }

    const fallback = buildFallback(spot);
    let aiContent = fallback;
    let usedFallback = false;

    try {
      const prompt = generateSpotPrompt({
        userType: session.userType,
        interest: session.interest,
        routeName: session.routeName,
        routeTheme: session.routeTheme,
        spotName: spot.name,
        spotIntro: spot.intro,
        storyMaterial: spot.storyMaterial,
        details: spot.details,
        tags: spot.tags
      });
      const ai = await callAI(prompt);
      aiContent = pickAiFields(ai, fallback);
    } catch (aiErr) {
      usedFallback = true;
      console.error('getSpotContent AI fallback:', aiErr.message || aiErr);
    }

    const spotIndex = session.routeSpotIds.indexOf(spotId);
    const updateData = {
      visitedSpots: _.addToSet(spotId),
      updatedAt: db.serverDate()
    };

    if (spotIndex >= 0) {
      updateData.currentSpotIndex = Math.max(session.currentSpotIndex || 0, spotIndex);
    }

    await db.collection('sessions').doc(sessionId).update({ data: updateData });

    return ok({
      spotId: spot._id,
      spotName: spot.name,
      image: spot.image,
      intro: spot.intro,
      ...aiContent
    }, { fallback: usedFallback });
  } catch (err) {
    console.error('getSpotContent failed:', err);
    return fail('DB_ERROR', '获取点位内容失败');
  }
};
