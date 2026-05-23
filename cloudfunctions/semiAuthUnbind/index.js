const cloud = require('wx-server-sdk');
const { verifyAppToken, ok, fail } = require('./semiUtils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event = {}, context) => {
  const auth = verifyAppToken(event.appToken);
  if (!auth || !auth.userId) {
    return fail('UNAUTHORIZED', '登录状态无效');
  }

  try {
    const res = await db.collection('external_identities').where({
      provider: 'semi',
      userId: auth.userId
    }).limit(1).get();
    const identity = res.data && res.data[0];
    if (!identity) {
      return fail('NOT_BOUND', '当前用户未绑定 Semi 身份');
    }

    // MVP：禁用绑定关系，保留审计数据。生产环境可在此处调用 Semi revoke 接口。
    await db.collection('external_identities').doc(identity._id).update({
      data: {
        disabled: true,
        accessTokenEncrypted: '',
        refreshTokenEncrypted: '',
        updatedAt: db.serverDate()
      }
    });

    return ok({ message: '解绑成功' });
  } catch (err) {
    console.error('semiAuthUnbind failed:', err);
    return fail('INTERNAL_ERROR', '解绑失败');
  }
};
