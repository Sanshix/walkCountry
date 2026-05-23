const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Semi OAuth2 配置 - 请在小程序后台配置环境变量
const SEMI_CONFIG = {
  clientId: process.env.SEMI_CLIENT_ID || '',
  clientSecret: process.env.SEMI_CLIENT_SECRET || '',
  redirectUri: process.env.SEMI_REDIRECT_URI || '',
  authUrl: 'https://www.semi.im/oauth/authorize',
  tokenUrl: 'https://api.semi.im/oauth/token',
  userInfoUrl: 'https://api.semi.im/oauth/userinfo',
  scope: 'openid profile wallet'
}

// PKCE 工具函数
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function sha256(text) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(text).digest()
}

function generateCodeVerifier() {
  return base64UrlEncode(generateRandomString(32))
}

function generateCodeChallenge(verifier) {
  return base64UrlEncode(sha256(verifier))
}

exports.main = async (event) => {
  const { action } = event

  switch (action) {
    case 'getAuthUrl':
      return await getAuthUrl(event)
    case 'exchangeToken':
      return await exchangeToken(event)
    case 'getUserInfo':
      return await getUserInfo(event)
    case 'refreshToken':
      return await refreshToken(event)
    default:
      return { success: false, message: '未知操作' }
  }
}

// 获取授权URL
async function getAuthUrl(event) {
  try {
    if (!SEMI_CONFIG.clientId) {
      return {
        success: false,
        message: '请先配置 SEMI_CLIENT_ID 环境变量'
      }
    }

    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(verifier)
    const state = generateRandomString(16)

    // 存储PKCE参数供后续验证使用
    const pkceCollection = db.collection('semi_pkce_sessions')
    await pkceCollection.add({
      data: {
        state,
        codeVerifier,
        createTime: db.serverDate(),
        expiredAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟有效期
      }
    })

    // 构建授权URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SEMI_CONFIG.clientId,
      redirect_uri: SEMI_CONFIG.redirectUri,
      scope: SEMI_CONFIG.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    const authUrl = `${SEMI_CONFIG.authUrl}?${params.toString()}`

    return {
      success: true,
      data: {
        authUrl,
        state
      }
    }
  } catch (err) {
    console.error('getAuthUrl error:', err)
    return { success: false, message: '生成授权链接失败' }
  }
}

// 用授权码换取Token
async function exchangeToken(event) {
  const { code, state } = event

  try {
    // 验证state并获取code_verifier
    const pkceCollection = db.collection('semi_pkce_sessions')
    const { data: sessions } = await pkceCollection
      .where({ state })
      .limit(1)
      .get()

    if (sessions.length === 0) {
      return { success: false, message: '无效的state参数' }
    }

    const session = sessions[0]

    // 检查是否过期
    if (new Date() > new Date(session.expiredAt)) {
      await pkceCollection.doc(session._id).remove()
      return { success: false, message: '授权会话已过期' }
    }

    // 请求Token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SEMI_CONFIG.redirectUri,
      client_id: SEMI_CONFIG.clientId,
      client_secret: SEMI_CONFIG.clientSecret,
      code_verifier: session.codeVerifier
    })

    const tokenRes = await fetch(SEMI_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokenData)
      return {
        success: false,
        message: tokenData.error_description || 'Token交换失败'
      }
    }

    // 删除已使用的PKCE session
    await pkceCollection.doc(session._id).remove()

    // 获取用户信息
    const userRes = await fetch(SEMI_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const userInfo = await userRes.json()

    if (!userRes.ok) {
      console.error('Get userinfo failed:', userInfo)
      return { success: false, message: '获取用户信息失败' }
    }

    // 存储用户信息到数据库
    const usersCollection = db.collection('semi_users')
    const { data: existingUsers } = await usersCollection
      .where({ sub: userInfo.sub })
      .limit(1)
      .get()

    const now = db.serverDate()
    const userRecord = {
      sub: userInfo.sub,
      handle: userInfo.handle || '',
      wallet_address: userInfo.wallet_address || '',
      phone_verified: userInfo.phone_verified || false,
      email_verified: userInfo.email_verified || false,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      lastLoginTime: now
    }

    if (existingUsers.length > 0) {
      await usersCollection.doc(existingUsers[0]._id).update({
        data: userRecord
      })
    } else {
      userRecord.createTime = now
      await usersCollection.add({ data: userRecord })
    }

    return {
      success: true,
      data: {
        sub: userInfo.sub,
        handle: userInfo.handle,
        wallet_address: userInfo.wallet_address,
        access_token: tokenData.access_token
      }
    }
  } catch (err) {
    console.error('exchangeToken error:', err)
    return { success: false, message: 'Token交换过程出错' }
  }
}

// 获取用户信息
async function getUserInfo(event) {
  const { accessToken } = event

  try {
    const userRes = await fetch(SEMI_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const userInfo = await userRes.json()

    if (!userRes.ok) {
      return { success: false, message: '获取用户信息失败' }
    }

    return {
      success: true,
      data: userInfo
    }
  } catch (err) {
    console.error('getUserInfo error:', err)
    return { success: false, message: '获取用户信息出错' }
  }
}

// 刷新Token
async function refreshToken(event) {
  const { refreshToken } = event

  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SEMI_CONFIG.clientId,
      client_secret: SEMI_CONFIG.clientSecret
    })

    const tokenRes = await fetch(SEMI_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      return {
        success: false,
        message: tokenData.error_description || '刷新Token失败'
      }
    }

    // 更新数据库中的token
    const usersCollection = db.collection('semi_users')
    const { data: users } = await usersCollection
      .where({ refresh_token: refreshToken })
      .limit(1)
      .get()

    if (users.length > 0) {
      await usersCollection.doc(users[0]._id).update({
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token
        }
      })
    }

    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      }
    }
  } catch (err) {
    console.error('refreshToken error:', err)
    return { success: false, message: '刷新Token出错' }
  }
}