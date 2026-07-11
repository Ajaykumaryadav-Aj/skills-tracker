export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

export const isAdminEmail = (email) => getAdminEmails().includes(String(email || '').trim().toLowerCase())

export const getServerAssignedRole = (email) => (isAdminEmail(email) ? 'admin' : 'user')
