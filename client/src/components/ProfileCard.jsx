import { memo } from 'react'
import { Link as LinkIcon, MapPin, Target, Trophy } from 'lucide-react'
import { ui } from '../utils/tw'

function chipClass(extra = 'text-ink-soft') {
  return `inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold ${extra}`
}

function ProfileCard({ user, avatarSrc, gamification }) {
  return (
    <aside className={`${ui.panel} sticky top-24 self-start overflow-hidden text-center`}>
      <div className="-mx-6 -mt-6 mb-6 h-20 bg-gradient-to-br from-forest via-emerald-brand to-forest-mid" aria-hidden="true" />
      <div className="mx-auto -mt-20 grid size-32 place-items-center overflow-hidden rounded-full border-4 border-white bg-emerald-brand text-4xl font-black text-white shadow-card">
        {avatarSrc ? <img className="size-full object-cover" src={avatarSrc} alt={`${user.name || 'User'} avatar`} /> : <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>}
      </div>
      <h2 className="mt-5 text-xl font-black text-ink">{user.name || 'Learner'}</h2>
      <p className="mt-1 truncate text-sm font-semibold text-ink-soft">{user.profession || user.email}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <span className={chipClass()}><Trophy size={15} /> Level {gamification?.profile?.level || 1} | {gamification?.profile?.totalXp || 0} XP</span>
        {user.location && <span className={chipClass()}><MapPin size={15} /> {user.location}</span>}
        {user.experienceLevel && <span className={chipClass()}><Target size={15} /> {user.experienceLevel}</span>}
        {user.github && <a className={chipClass('text-emerald-dark-brand hover:bg-emerald-pale')} href={user.github} target="_blank" rel="noreferrer"><LinkIcon size={15} /> GitHub</a>}
        {user.linkedin && <a className={chipClass('text-emerald-dark-brand hover:bg-emerald-pale')} href={user.linkedin} target="_blank" rel="noreferrer"><LinkIcon size={15} /> LinkedIn</a>}
      </div>
    </aside>
  )
}

export default memo(ProfileCard)
