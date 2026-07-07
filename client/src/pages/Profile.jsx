import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ShieldCheck, UserRound } from 'lucide-react'
import AvatarUploader from '../components/AvatarUploader'
import ChangePasswordModal from '../components/ChangePasswordModal'
import PageHeader from '../components/PageHeader'
import ProfileCard from '../components/ProfileCard'
import ProfileForm from '../components/ProfileForm'
import Toast from '../components/Toast'
import { AuthContext } from '../context/authContextValue'
import * as userService from '../services/userService'

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
    <div className="profile-layout">
      <div className="profile-card profile-skeleton"><span /><i /><i /><i /></div>
      <div className="profile-stack">
        <div className="profile-section profile-skeleton"><i /><i /><i /></div>
        <div className="profile-section profile-skeleton"><i /><i /><i /><i /></div>
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
  const [toast, setToast] = useState({ type: 'success', message: '' })

  const avatarSrc = useMemo(() => getAvatarSrc(user), [user])

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser)
    updateUser?.(nextUser)
  }, [updateUser])

  useEffect(() => {
    let ignore = false
    userService.getProfile()
      .then((response) => {
        if (!ignore) syncUser(response.data.data.user)
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

  return (
    <section className="profile-page">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your account details, learning focus, profile picture, and password."
        icon={UserRound}
        actions={<span className="profile-security"><ShieldCheck size={16} /> Authenticated</span>}
      />

      {loading || !user ? (
        <ProfileSkeleton />
      ) : (
        <div className="profile-layout">
          <ProfileCard user={user} avatarSrc={avatarSrc} />
          <div className="profile-stack">
            <AvatarUploader avatarSrc={avatarSrc} uploading={uploading} removing={removingAvatar} onUpload={uploadAvatar} onRemove={removeAvatar} />
            <ProfileForm user={user} saving={saving} onSubmit={saveProfile} onPasswordClick={() => setPasswordOpen(true)} />
          </div>
        </div>
      )}

      <ChangePasswordModal open={passwordOpen} loading={passwordLoading} onClose={() => setPasswordOpen(false)} onSubmit={changePassword} />
    </section>
  )
}
