export const OTP_PURPOSES = Object.freeze({
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
})

export const OTP_CONFIG = Object.freeze({
  expiresInMs: 5 * 60 * 1000,
  maxAttempts: 5,
  resendCooldownMs: 30 * 1000,
  resendWindowMs: 60 * 60 * 1000,
  maxResendsPerWindow: 5,
})

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
