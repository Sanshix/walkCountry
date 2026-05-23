const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { nickName, avatarUrl, action } = event

  // action: 'login' | 'updateProfile'
  if (action === 'updateProfile') {
    return await updateProfile(OPENID, nickName, avatarUrl)
  }

  return await login(OPENID, nickName, avatarUrl)
}

async function login(openid, nickName, avatarUrl) {
  try {
    const { data: users } = await usersCollection
      .where({ openid })
      .limit(1)
      .get()

    const now = db.serverDate()

    if (users.length > 0) {
      const user = users[0]
      const updateData = { lastLoginTime: now, loginCount: db.command.inc(1) }
      if (nickName) updateData.nickName = nickName
      if (avatarUrl) updateData.avatarUrl = avatarUrl

      await usersCollection.doc(user._id).update({ data: updateData })

      return {
        success: true,
        data: {
          openid,
          nickName: nickName || user.nickName || '微信用户',
          avatarUrl: avatarUrl || user.avatarUrl || '',
          isNewUser: false
        }
      }
    }

    const newUser = {
      openid,
      nickName: nickName || '微信用户',
      avatarUrl: avatarUrl || '',
      createTime: now,
      lastLoginTime: now,
      loginCount: 1
    }
    await usersCollection.add({ data: newUser })

    return {
      success: true,
      data: {
        openid,
        nickName: newUser.nickName,
        avatarUrl: newUser.avatarUrl,
        isNewUser: true
      }
    }
  } catch (err) {
    console.error('userLogin error:', err)
    return {
      success: false,
      message: '登录失败，请重试',
      data: {
        openid,
        nickName: nickName || '微信用户',
        avatarUrl: avatarUrl || '',
        isNewUser: false
      }
    }
  }
}

async function updateProfile(openid, nickName, avatarUrl) {
  try {
    const { data: users } = await usersCollection
      .where({ openid })
      .limit(1)
      .get()

    if (users.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const updateData = {}
    if (nickName) updateData.nickName = nickName
    if (avatarUrl) updateData.avatarUrl = avatarUrl

    await usersCollection.doc(users[0]._id).update({ data: updateData })

    return {
      success: true,
      data: {
        openid,
        nickName: nickName || users[0].nickName,
        avatarUrl: avatarUrl || users[0].avatarUrl
      }
    }
  } catch (err) {
    console.error('updateProfile error:', err)
    return { success: false, message: '更新失败' }
  }
}
