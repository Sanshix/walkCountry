module.exports = {
  SEMI_ISSUER: process.env.SEMI_ISSUER || 'https://api.semi.im',
  SEMI_AUTHORIZATION_URL: process.env.SEMI_AUTHORIZATION_URL || 'https://api.semi.im/oauth/authorize',
  SEMI_TOKEN_URL: process.env.SEMI_TOKEN_URL || 'https://api.semi.im/oauth/token',
  SEMI_USERINFO_URL: process.env.SEMI_USERINFO_URL || 'https://api.semi.im/oauth/userinfo',
  SEMI_CLIENT_ID: process.env.SEMI_CLIENT_ID || '',
  SEMI_CLIENT_SECRET: process.env.SEMI_CLIENT_SECRET || '',
  SEMI_REDIRECT_URI: process.env.SEMI_REDIRECT_URI || 'http://localhost:3000/auth/semi/callback',
  SEMI_SCOPES: process.env.SEMI_SCOPES || 'openid profile',
  APP_FRONTEND_SUCCESS_URL: process.env.APP_FRONTEND_SUCCESS_URL || '/login/success',
  APP_FRONTEND_ERROR_URL: process.env.APP_FRONTEND_ERROR_URL || '/login/error',
  APP_SESSION_SECRET: process.env.APP_SESSION_SECRET || 'local-dev-secret'
};
