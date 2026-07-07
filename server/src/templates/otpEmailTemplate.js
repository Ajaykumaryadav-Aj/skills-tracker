export default function otpEmailTemplate({ name = 'there', otp, purpose = 'verify your email' }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
      <h2 style="margin-bottom:8px">Skills Tracker</h2>
      <p>Hi ${name},</p>
      <p>Use this one-time password to ${purpose}:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:24px 0">${otp}</p>
      <p>This code expires in 5 minutes. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:13px">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `
}
