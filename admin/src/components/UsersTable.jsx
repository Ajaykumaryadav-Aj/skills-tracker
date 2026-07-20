import { ShieldCheck, Trash2, UserRound } from 'lucide-react'

const roleStyles = {
  admin: 'role-badge role-badge--admin',
  user: 'role-badge role-badge--user',
}

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Not available')
const formatHours = (minutes = 0) => `${Math.round((minutes / 60) * 10) / 10}h`
const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

export default function UsersTable({ users, loading, deletingId, onDelete, onEdit, onToggleStatus, onVerifyEmail, onResetPassword }) {
  if (loading && users.length === 0) {
    return (
      <div className="table-loading" role="status" aria-label="Loading users">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-row" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="empty-state">
        <UserRound size={24} aria-hidden="true" />
        <p>No users match these filters.</p>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="users-table">
        <caption className="sr-only">Registered users and their learning activity</caption>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Skills</th>
            <th scope="col">Progress</th>
            <th scope="col">Activity</th>
            <th scope="col">Created</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const stats = user.stats || {}
            const progress = Math.min(100, Math.max(0, Number(stats.averageProgress) || 0))

            return (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <span className="user-avatar" aria-hidden="true">{getInitials(user.name)}</span>
                    <div>
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={roleStyles[user.role] || roleStyles.user}>
                    {user.role === 'admin' ? <ShieldCheck size={13} aria-hidden="true" /> : <UserRound size={13} aria-hidden="true" />}
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    user.isActive === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                  {user.emailVerified ? (
                    <span className="block text-xs font-bold text-emerald-600 mt-0.5">Verified</span>
                  ) : (
                    <span className="block text-xs font-bold text-red-500 mt-0.5">Unverified</span>
                  )}
                </td>
                <td>
                  <p className="table-primary">{stats.skillCount || 0} skills</p>
                  <p className="table-secondary">{stats.topicCount || 0} topics</p>
                </td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-copy">
                      <span>{progress}%</span>
                      <span>{stats.completedSkills || 0} done</span>
                    </div>
                    <div className="progress-track" role="progressbar" aria-label={`${user.name} average progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                      <span className="progress-fill" style={{ '--progress': `${progress}%` }} />
                    </div>
                  </div>
                </td>
                <td>
                  <p className="table-primary">{stats.logCount || 0} logs</p>
                  <p className="table-secondary">{formatHours(stats.learningMinutes)}</p>
                </td>
                <td className="table-date">{formatDate(user.createdAt)}</td>
                <td className="table-actions">
                  <div className="flex flex-wrap gap-1.5 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="px-2 py-1 text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 transition"
                    >
                      Edit
                    </button>
                    {!user.emailVerified && (
                      <button
                        type="button"
                        onClick={() => onVerifyEmail(user)}
                        className="px-2 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition"
                      >
                        Verify Email
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(user)}
                      className={`px-2 py-1 text-xs font-bold rounded border transition ${
                        user.isActive === false
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {user.isActive === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onResetPassword(user)}
                      className="px-2 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition"
                    >
                      Reset PW
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={deletingId === user._id}
                      className="px-2 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition"
                    >
                      {deletingId === user._id ? 'Deleting' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
