import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Award, Medal, ShieldCheck, Trophy, UserRound } from 'lucide-react'
import AvatarUploader from '../components/AvatarUploader'
import ChangePasswordModal from '../components/ChangePasswordModal'
import PageHeader from '../components/PageHeader'
import ProfileCard from '../components/ProfileCard'
import ProfileForm from '../components/ProfileForm'
import Toast from '../components/Toast'
import { AuthContext } from '../context/authContextValue'
import * as gamificationService from '../services/gamificationService'
import * as collaborationService from '../services/collaborationService'
import * as userService from '../services/userService'
import { cn, ui } from '../utils/tw'

const API_ORIGIN = (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api').replace(/\/api\/?$/, '')

const getErrorMessage = (err, fallback) => {
  const response = err.response?.data
  return response?.message || response?.errors?.[0]?.message || response?.errors?.[0]?.msg || fallback
}

const getAvatarSrc = (user) => {
  const url = user?.avatar?.url
  if (!url) return ''
  const src = url.startsWith('http') ? url : `${API_ORIGIN}${url}`
  const version = user?.avatar?.filename || user?.updatedAt
  if (!version) return src
  return `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="skeleton-shimmer min-h-80 rounded-panel border border-line" />
      <div className="grid gap-5">
        <div className="skeleton-shimmer min-h-48 rounded-panel border border-line" />
        <div className="skeleton-shimmer min-h-64 rounded-panel border border-line" />
      </div>
    </div>
  )
}

export default function Profile() {
  const { updateUser } = useContext(AuthContext)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [gamification, setGamification] = useState(null)
  const [privacy, setPrivacy] = useState({ enabled: false, slug: '', showLearningHours: true, showXp: true, showBadges: true, showAchievements: true })
  const [toast, setToast] = useState({ type: 'success', message: '' })

  const avatarSrc = useMemo(() => getAvatarSrc(user), [user])

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser)
    updateUser?.(nextUser)
  }, [updateUser])

  useEffect(() => {
    let ignore = false
    Promise.all([userService.getProfile(), gamificationService.getGamificationSummary(), collaborationService.getPrivacy()])
      .then(([profileResponse, gamificationResponse, privacyResponse]) => {
        if (!ignore) {
          syncUser(profileResponse.data.data.user)
          setGamification(gamificationResponse.data)
          setPrivacy((current) => ({ ...current, ...(privacyResponse.data.data.publicProfile || {}) }))
        }
      })
      .catch((err) => {
        if (!ignore) setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to load profile') })
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => { ignore = true }
  }, [syncUser])

  const saveProfile = async (values) => {
    setSaving(true)
    setToast({ type: 'success', message: '' })
    try {
      const response = await userService.updateProfile(values)
      syncUser(response.data.data.user)
      setToast({ type: 'success', message: 'Profile saved successfully.' })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to save profile') })
    } finally {
      setSaving(false)
    }
  }


  const uploadAvatar = async (file) => {
    setUploading(true)
    setToast({ type: 'success', message: '' })
    try {
      const response = await userService.uploadAvatar(file)
      const freshProfile = await userService.getProfile()
      syncUser(freshProfile.data.data.user || response.data.data.user)
      setToast({ type: 'success', message: 'Avatar uploaded successfully.' })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to upload avatar') })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    setRemovingAvatar(true)
    setToast({ type: 'success', message: '' })
    try {
      const response = await userService.deleteAvatar()
      syncUser(response.data.data.user)
      setToast({ type: 'success', message: 'Avatar removed successfully.' })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to remove avatar') })
    } finally {
      setRemovingAvatar(false)
    }
  }

  const changePassword = async (values) => {
    setPasswordLoading(true)
    setToast({ type: 'success', message: '' })
    try {
      await userService.changePassword(values)
      setPasswordOpen(false)
      setToast({ type: 'success', message: 'Password changed successfully.' })
      return true
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to change password') })
      return false
    } finally {
      setPasswordLoading(false)
    }
  }

  const savePrivacy = async () => {
    try {
      const response = await collaborationService.updatePrivacy(privacy)
      setPrivacy(response.data.data.publicProfile)
      setToast({ type: 'success', message: 'Privacy settings saved.' })
    } catch (err) {
      setToast({ type: 'danger', message: getErrorMessage(err, 'Unable to save privacy settings') })
    }
  }

  return (
    <section className="grid gap-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your account details, learning focus, profile picture, and password."
        icon={UserRound}
        actions={<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-brand/20 bg-emerald-pale px-3 py-1 text-xs font-extrabold text-emerald-dark-brand"><ShieldCheck size={16} /> Authenticated</span>}
      />

      {loading || !user ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <ProfileCard user={user} avatarSrc={avatarSrc} gamification={gamification} />
          <div className="grid gap-5">
            <section className={`${ui.panel} overflow-hidden`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-dark-brand"><Trophy size={15} /> Gamification</p>
                  <h2 className="mt-1 text-xl font-black text-ink">Progress profile</h2>
                </div>
                <span className="rounded-full border border-emerald-brand/20 bg-emerald-pale px-3 py-1 text-xs font-extrabold text-emerald-dark-brand">Active learner</span>
              </div>
              <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <strong className="text-2xl font-black text-ink">Level {gamification?.profile?.level || 1}</strong>
                  <span className="text-sm font-extrabold text-emerald-dark-brand">{gamification?.profile?.totalXp || 0} XP</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-emerald-brand" style={{ width: `${gamification?.profile?.levelInfo?.progress || 0}%` }} /></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold text-ink-soft"><Medal size={15} /> {gamification?.profile?.achievements?.length || 0} achievements</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold text-ink-soft"><Award size={15} /> {gamification?.profile?.badges?.length || 0} badges</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold text-ink-soft"><Trophy size={15} /> {gamification?.stats?.learningHours || 0}h learned</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(gamification?.profile?.badges || []).slice(0, 8).map((badge) => (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-brand/20 bg-emerald-pale px-3 py-1 text-xs font-extrabold text-emerald-dark-brand" key={badge.key}><Award size={15} /> {badge.title}</span>
                ))}
                {(gamification?.profile?.badges || []).length === 0 && <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-4 text-sm text-ink-soft">Badges will appear here as achievements unlock.</p>}
              </div>
            </section>
            <AvatarUploader avatarSrc={avatarSrc} uploading={uploading} removing={removingAvatar} onUpload={uploadAvatar} onRemove={removeAvatar} />
            <section className={ui.panel}>
              <div className="mb-5"><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Privacy</p><h2 className="mt-1 text-xl font-black text-ink">Public profile</h2></div>
              <div className="grid gap-4">
                <label className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-raised p-3 text-sm font-bold text-ink"><span>Enable public profile</span><input type="checkbox" checked={Boolean(privacy.enabled)} onChange={(event) => setPrivacy({ ...privacy, enabled: event.target.checked })} /></label>
                <div><label className={ui.field.label}>Public slug</label><div className={ui.field.control}><input className={ui.field.input} value={privacy.slug || ''} onChange={(event) => setPrivacy({ ...privacy, slug: event.target.value })} placeholder="abhishek-kumar" /></div><p className={ui.field.help}>{privacy.slug ? `${window.location.origin}/public/${privacy.slug}` : 'Choose a shareable profile link.'}</p></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['showLearningHours', 'Show learning hours'],
                    ['showXp', 'Show XP and level'],
                    ['showBadges', 'Show badges'],
                    ['showAchievements', 'Show achievements'],
                  ].map(([key, label]) => (
                    <label className="flex items-center justify-between gap-3 rounded-card border border-line bg-white p-3 text-sm font-bold text-ink" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(privacy[key])} onChange={(event) => setPrivacy({ ...privacy, [key]: event.target.checked })} /></label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={savePrivacy} className={cn(ui.button.base, ui.button.primary)}>Save Privacy</button>
                  {privacy.enabled && privacy.slug && <a className={cn(ui.button.base, ui.button.secondary)} href={`/public/${privacy.slug}`} target="_blank" rel="noreferrer">View Public Profile</a>}
                </div>
              </div>
            </section>


            <ProfileForm user={user} saving={saving} onSubmit={saveProfile} onPasswordClick={() => setPasswordOpen(true)} />
          </div>
        </div>
      )}

      <ChangePasswordModal open={passwordOpen} loading={passwordLoading} onClose={() => setPasswordOpen(false)} onSubmit={changePassword} />
    </section>
  )
}
