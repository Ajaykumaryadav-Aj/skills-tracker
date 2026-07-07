import { ShieldCheck, Trash2, UserRound } from 'lucide-react'

const roleStyles = {
  admin: 'role-badge role-badge--admin',
  user: 'role-badge role-badge--user',
}

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Not available')
const formatHours = (minutes = 0) => `${Math.round((minutes / 60) * 10) / 10}h`
const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

export default function UsersTable({ users, loading, deletingId, onDelete }) {
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
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    disabled={deletingId === user._id}
                    className="icon-action icon-action--danger"
                    aria-label={`Delete ${user.name}`}
                    title={`Delete ${user.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    <span>{deletingId === user._id ? 'Deleting' : 'Delete'}</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
