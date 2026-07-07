import { memo } from 'react'
import { Link as LinkIcon, MapPin, Target } from 'lucide-react'

function ProfileCard({ user, avatarSrc }) {
  return (
    <aside className="profile-card">
      <div className="profile-card__avatar">
        {avatarSrc ? <img src={avatarSrc} alt={`${user.name || 'User'} avatar`} /> : <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>}
      </div>
      <h2>{user.name || 'Learner'}</h2>
      <p>{user.profession || user.email}</p>
      <div className="profile-card__facts">
        {user.location && <span><MapPin size={15} /> {user.location}</span>}
        {user.experienceLevel && <span><Target size={15} /> {user.experienceLevel}</span>}
        {user.github && <a href={user.github} target="_blank" rel="noreferrer"><LinkIcon size={15} /> GitHub</a>}
        {user.linkedin && <a href={user.linkedin} target="_blank" rel="noreferrer"><LinkIcon size={15} /> LinkedIn</a>}
      </div>
    </aside>
  )
}

export default memo(ProfileCard)
