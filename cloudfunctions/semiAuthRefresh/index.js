const cloud = require('wx-server-sdk');
const {
  config,
  verifyAppToken,
  ok,
  fail,
  addSeconds,
  encryptForDemo,
  decryptForDemo
} = require('./semiUtils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function refreshToken(refreshToken) {
  if (!config.SEMI_CLIENT_ID || refreshToken.startsWith('mock_refresh_')) {
    return {
      access_token: `mock_access_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      refresh_expires_in: 2592000,
      scope: config.SEMI_SCOPES
    };
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', refreshToken);
  body.set('client_id', config.SEMI_CLIENT_ID);
  if (config.SEMI_CLIENT_SECRET) body.set('client_secret', config.SEMI_CLIENT_SECRET);

  const res = await fetch(config.SEMI_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!res.ok) throw new Error(`refresh_failed_${res.status}`);
  return res.json();
}

exports.main = async (event = {}, context) => {
  const auth = verifyAppToken(event.appToken);
  if (!auth || !auth.userId) {
    return fail('UNAUTHORIZED', '登录状态无效');
  }

  try {
    const res = await db.collection('external_identities').where({
      provider: 'semi',
      userId: auth.userId,
      disabled: false
    }).limit(1).get();
    const identity = res.data && res.data[0];
    if (!identity) {
      return fail('NOT_BOUND', '当前用户未绑定 Semi 身份');
    }

    const currentRefreshToken = decryptForDemo(identity.refreshTokenEncrypted);
    if (!currentRefreshToken) {
      return fail('token_expired', 'Semi 授权已过期，请重新登录');
    }

    const token = await refreshToken(currentRefreshToken);
    await db.collection('external_identities').doc(identity._id).update({
      data: {
        accessTokenEncrypted: encryptForDemo(token.access_token),
        refreshTokenEncrypted: encryptForDemo(token.refresh_token),
        accessTokenExpiresAt: addSeconds(token.expires_in || 3600),
        refreshTokenExpiresAt: addSeconds(token.refresh_expires_in || 2592000),
        updatedAt: db.serverDate()
      }
    });

    return ok({
      message: 'Semi token 刷新成功',
      accessTokenExpiresAt: addSeconds(token.expires_in || 3600)
    });
  } catch (err) {
    console.error('semiAuthRefresh failed:', err.message || err);
    return fail('INTERNAL_ERROR', '刷新 Semi 授权失败');
  }
};
