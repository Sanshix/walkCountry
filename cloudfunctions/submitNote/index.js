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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateImages(images) {
  if (images === undefined || images === null) return [];
  if (!Array.isArray(images)) throw new Error('INVALID_IMAGES');
  if (images.length > 9) throw new Error('TOO_MANY_IMAGES');
  for (const item of images) {
    if (typeof item !== 'string' || !item.startsWith('cloud://')) {
      throw new Error('INVALID_IMAGE_FILE_ID');
    }
  }
  return images;
}

function mapValidationError(err) {
  if (err.message === 'INVALID_IMAGES') return 'images 必须是数组';
  if (err.message === 'TOO_MANY_IMAGES') return '最多只能上传 9 张图片';
  if (err.message === 'INVALID_IMAGE_FILE_ID') return '图片 fileID 必须以 cloud:// 开头';
  return '参数错误';
}

exports.main = async (event = {}, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('UNAUTHORIZED', '未获得用户身份');
  }

  const sessionId = isNonEmptyString(event.sessionId) ? event.sessionId.trim() : '';
  const spotId = isNonEmptyString(event.spotId) ? event.spotId.trim() : '';
  const note = typeof event.note === 'string' ? event.note.trim() : '';

  if (!sessionId || !spotId) {
    return fail('INVALID_PARAMS', 'sessionId 和 spotId 不能为空');
  }

  if (typeof event.note !== 'string') {
    return fail('INVALID_PARAMS', 'note 必须是字符串');
  }

  if (note.length > 500) {
    return fail('INVALID_PARAMS', 'note 不能超过 500 字');
  }

  let images;
  try {
    images = validateImages(event.images);
  } catch (err) {
    return fail('INVALID_PARAMS', mapValidationError(err));
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

    const createdAt = db.serverDate();
    const noteData = {
      sessionId,
      openid: OPENID,
      spotId,
      spotName: spot.name,
      note,
      images,
      createdAt
    };

    const addRes = await db.collection('notes').add({ data: noteData });
    const noteId = addRes._id || addRes.id;

    const noteSummary = {
      noteId,
      spotId,
      spotName: spot.name,
      note,
      images,
      createdAt: new Date().toISOString()
    };

    await db.collection('sessions').doc(sessionId).update({
      data: {
        notes: _.push(noteSummary),
        visitedSpots: _.addToSet(spotId),
        updatedAt: db.serverDate()
      }
    });

    return ok({
      noteId,
      message: '记录成功'
    });
  } catch (err) {
    console.error('submitNote failed:', err);
    return fail('DB_ERROR', '保存记录失败');
  }
};
