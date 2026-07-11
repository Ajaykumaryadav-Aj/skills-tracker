import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ImageUp, Trash2 } from 'lucide-react'
import { cn, ui } from '../utils/tw'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxAvatarSize = 2 * 1024 * 1024

function AvatarUploader({ avatarSrc, uploading, removing, onUpload, onRemove }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    setError('')
    if (!selected) return

    if (!allowedTypes.has(selected.type)) {
      setFile(null)
      setError('Please choose a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (selected.size > maxAvatarSize) {
      setFile(null)
      setError('Your image is greater than 2MB. Please use an image 2MB or smaller.')
      event.target.value = ''
      return
    }

    setFile(selected)
  }

  const upload = async () => {
    if (!file) return
    await onUpload(file)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className={ui.panel} aria-labelledby="avatar-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Profile picture</p><h2 id="avatar-title" className="mt-1 text-xl font-black text-ink">Avatar</h2></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="grid size-28 place-items-center overflow-hidden rounded-full border-4 border-emerald-pale bg-surface-raised text-sm font-bold text-ink-soft shadow-card">
          {(previewUrl || avatarSrc) ? <img className="size-full object-cover" src={previewUrl || avatarSrc} alt="Avatar preview" /> : <span>No image</span>}
        </div>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn(ui.button.base, ui.button.secondary, 'cursor-pointer')} htmlFor="avatar-file"><ImageUp size={16} /> Choose image</label>
            <input ref={inputRef} id="avatar-file" className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            <span className="min-w-0 flex-1 truncate rounded-card border border-line bg-surface-raised px-3 py-2 text-sm font-semibold text-ink-soft">
              {file?.name || 'No image selected'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.button.base, ui.button.primary)} onClick={upload} disabled={!file || uploading}>
            <ImageUp size={16} /> {uploading ? 'Uploading...' : 'Upload Avatar'}
          </button>
          <button type="button" className={cn(ui.button.base, ui.button.danger)} onClick={onRemove} disabled={removing || !avatarSrc}>
            <Trash2 size={16} /> {removing ? 'Removing...' : 'Remove Avatar'}
          </button>
          </div>
          <p className={cn('basis-full text-sm leading-6', error ? 'font-semibold text-red-700' : 'text-ink-soft')}>{error || 'JPG, JPEG, PNG, or WEBP. Maximum size 2MB.'}</p>
        </div>
      </div>
    </section>
  )
}

export default memo(AvatarUploader)
