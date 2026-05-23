const cloud = require('wx-server-sdk');
const {
  config,
  signAppToken,
  ok,
  fail,
  addSeconds,
  encryptForDemo,
  isExpired
} = require('./semiUtils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function exchangeToken({ code, codeVerifier }) {
  if (!config.SEMI_CLIENT_ID || code.startsWith('mock_')) {
    return {
      access_token: `mock_access_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      refresh_expires_in: 2592000,
      scope: config.SEMI_SCOPES
    };
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('redirect_uri', config.SEMI_REDIRECT_URI);
  body.set('client_id', config.SEMI_CLIENT_ID);
  body.set('code_verifier', codeVerifier);
  if (config.SEMI_CLIENT_SECRET) body.set('client_secret', config.SEMI_CLIENT_SECRET);

  const res = await fetch(config.SEMI_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`token_failed_${res.status}`);
  return res.json();
}

async function getUserinfo(accessToken, event) {
  if (!config.SEMI_CLIENT_ID || accessToken.startsWith('mock_access_')) {
    return event.mockUserinfo || {
      sub: 'semi_mock_subject_001',
      handle: 'semi_mock_user',
      wallet_address: '0x0000000000000000000000000000000000000000',
      phone_verified: false,
      email_verified: false
    };
  }

  const res = await fetch(config.SEMI_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`userinfo_failed_${res.status}`);
  return res.json();
}

async function findIdentity(sub) {
  const res = await db.collection('external_identities').where({
    provider: 'semi',
    providerSubject: sub
  }).limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function createUser(userinfo) {
  const res = await db.collection('users').add({
    data: {
      displayName: userinfo.handle || 'Semi 用户',
      provider: 'semi',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });
  return res._id || res.id;
}

exports.main = async (event = {}, context) => {
  const code = typeof event.code === 'string' ? event.code.trim() : '';
  const state = typeof event.state === 'string' ? event.state.trim() : '';

  if (!code || !state) {
    return fail('INVALID_PARAMS', 'code 和 state 不能为空');
  }

  try {
    const stateRes = await db.collection('oauthStates').doc(state).get();
    const stateDoc = stateRes && stateRes.data;
    if (!stateDoc || stateDoc.provider !== 'semi' || stateDoc.used || isExpired(stateDoc.expiresAt)) {
      return fail('state_mismatch', '登录状态已过期，请重新登录');
    }

    await db.collection('oauthStates').doc(state).update({
      data: {
        used: true,
        updatedAt: db.serverDate()
      }
    });

    const token = await exchangeToken({ code, codeVerifier: stateDoc.codeVerifier });
    const userinfo = await getUserinfo(token.access_token, event);

    if (!userinfo || !userinfo.sub) {
      return fail('userinfo_failed', '获取 Semi 用户信息失败');
    }

    let identity = await findIdentity(userinfo.sub);
    let userId = identity && identity.userId;

    if (!userId) {
      userId = await createUser(userinfo);
      const now = db.serverDate();
      await db.collection('external_identities').add({
        data: {
          provider: 'semi',
          providerSubject: userinfo.sub,
          userId,
          handle: userinfo.handle || '',
          walletAddress: userinfo.wallet_address || '',
          phoneVerified: !!userinfo.phone_verified,
          emailVerified: !!userinfo.email_verified,
          scopesGranted: (token.scope || stateDoc.scope || '').split(/\s+/).filter(Boolean),
          accessTokenEncrypted: encryptForDemo(token.access_token),
          refreshTokenEncrypted: encryptForDemo(token.refresh_token),
          accessTokenExpiresAt: addSeconds(token.expires_in || 3600),
          refreshTokenExpiresAt: addSeconds(token.refresh_expires_in || 2592000),
          disabled: false,
          createdAt: now,
          updatedAt: now
        }
      });
    } else {
      await db.collection('external_identities').doc(identity._id).update({
        data: {
          handle: userinfo.handle || identity.handle || '',
          walletAddress: userinfo.wallet_address || identity.walletAddress || '',
          scopesGranted: (token.scope || stateDoc.scope || '').split(/\s+/).filter(Boolean),
          accessTokenEncrypted: encryptForDemo(token.access_token),
          refreshTokenEncrypted: encryptForDemo(token.refresh_token),
          accessTokenExpiresAt: addSeconds(token.expires_in || 3600),
          refreshTokenExpiresAt: addSeconds(token.refresh_expires_in || 2592000),
          updatedAt: db.serverDate()
        }
      });
    }

    const appToken = signAppToken({ userId, provider: 'semi', sub: userinfo.sub });
    return ok({
      userId,
      appToken,
      provider: 'semi',
      providerSubject: userinfo.sub,
      redirectTo: stateDoc.redirectAfter || config.APP_FRONTEND_SUCCESS_URL,
      message: 'Semi 登录成功'
    });
  } catch (err) {
    console.error('semiAuthCallback failed:', err.message || err);
    return fail('INTERNAL_ERROR', 'Semi 登录失败，请重新尝试');
  }
};
