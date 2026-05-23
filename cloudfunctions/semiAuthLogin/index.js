const cloud = require('wx-server-sdk');
const { config, randomUrlSafe, sha256Base64Url, ok, fail, addSeconds } = require('./semiUtils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event = {}, context) => {
  try {
    const { OPENID } = cloud.getWXContext();
    const state = randomUrlSafe(24);
    const codeVerifier = randomUrlSafe(48);
    const codeChallenge = sha256Base64Url(codeVerifier);
    const scope = event.scope || config.SEMI_SCOPES;
    const redirectAfter = event.redirectAfter || config.APP_FRONTEND_SUCCESS_URL;
    const mode = event.mode === 'bind' ? 'bind' : 'login';

    await db.collection('oauthStates').add({
      data: {
        _id: state,
        provider: 'semi',
        openid: OPENID || '',
        mode,
        codeVerifier,
        scope,
        redirectAfter,
        expiresAt: addSeconds(600),
        used: false,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    const url = new URL(config.SEMI_AUTHORIZATION_URL);
    url.searchParams.set('client_id', config.SEMI_CLIENT_ID || 'local-dev-client');
    url.searchParams.set('redirect_uri', config.SEMI_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return ok({
      authUrl: url.toString(),
      state,
      expiresIn: 600,
      message: '请在前端跳转到 authUrl 完成 Semi 授权'
    });
  } catch (err) {
    console.error('semiAuthLogin failed:', err);
    return fail('INTERNAL_ERROR', '发起 Semi 登录失败');
  }
};
