import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Award, Flame, Globe, Trophy, UserRound } from 'lucide-react'
import * as collaborationService from '../services/collaborationService'
import { cn, ui } from '../utils/tw'

const API_ORIGIN = (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api').replace(/\/api\/?$/, '')
const avatarUrl = (avatar) => avatar?.url ? (avatar.url.startsWith('http') ? avatar.url : `${API_ORIGIN}${avatar.url}`) : ''

export default function PublicProfile() {
  const { slug } = useParams()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    collaborationService.getPublicProfile(slug)
      .then((response) => setProfile(response.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Public profile not found'))
  }, [slug])

  if (error) return <div className={ui.empty}><UserRound size={24} /><p>{error}</p></div>
  if (!profile) return <div className="skeleton-shimmer h-96 rounded-panel" />

  const src = avatarUrl(profile.user.avatar)
  return (
    <section className="mx-auto grid max-w-4xl gap-5">
      <div className="surface-grid overflow-hidden rounded-panel border border-line bg-white/90 shadow-card">
        <div className="h-32 bg-gradient-to-br from-forest via-emerald-brand to-forest-mid" />
        <div className="p-6">
          <div className="-mt-20 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
            <div className="grid size-32 place-items-center overflow-hidden rounded-full border-4 border-white bg-emerald-brand text-4xl font-black text-white shadow-card">
              {src ? <img src={src} className="size-full object-cover" alt="" /> : profile.user.name?.charAt(0)}
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-black text-ink">{profile.user.name}</h1>
              <p className="mt-1 text-sm font-semibold text-ink-soft">{profile.user.profession || profile.user.experienceLevel || 'Learner'}</p>
            </div>
          </div>
          {profile.user.bio && <p className="mt-5 text-sm leading-6 text-ink-soft">{profile.user.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.user.website && <a className={cn(ui.badge.base, ui.badge.active)} href={profile.user.website} target="_blank" rel="noreferrer"><Globe size={15} /> Website</a>}
            {profile.user.location && <span className={cn(ui.badge.base, ui.badge.idle)}>{profile.user.location}</span>}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <article className={ui.panel}><Trophy className="text-emerald-dark-brand" /><strong className="mt-3 block text-3xl text-ink">{profile.stats.level ?? 'Hidden'}</strong><span className="text-sm text-ink-soft">Level</span></article>
        <article className={ui.panel}><Award className="text-emerald-dark-brand" /><strong className="mt-3 block text-3xl text-ink">{profile.stats.xp ?? 'Hidden'}</strong><span className="text-sm text-ink-soft">XP</span></article>
        <article className={ui.panel}><Flame className="text-emerald-dark-brand" /><strong className="mt-3 block text-3xl text-ink">{profile.stats.streak?.currentStreak || 0}</strong><span className="text-sm text-ink-soft">Current streak</span></article>
      </div>
      <section className={ui.panel}>
        <h2 className="text-xl font-black text-ink">Badges</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.stats.badges?.length ? profile.stats.badges.map((badge) => <span className={cn(ui.badge.base, ui.badge.active)} key={badge.key}><Award size={15} /> {badge.title}</span>) : <p className="text-sm text-ink-soft">Badges are private or not unlocked yet.</p>}
        </div>
      </section>
    </section>
  )
}
